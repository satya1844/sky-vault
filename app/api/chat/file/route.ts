import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { performOCR } from '@/ai/ocr';
import path from 'path';

// Ensure Node.js runtime (pdf-parse & mammoth need Node APIs, not Edge runtime)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeText(t: string) {
  return t.replace(/\s+/g, ' ').trim();
}

function sentenceSplit(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => normalizeText(s))
    .filter(Boolean);
}

function keywordScore(sentence: string, keywords: string[]): number {
  const lower = sentence.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (!kw) continue;
    const occurrences = lower.split(kw).length - 1;
    if (occurrences > 0) score += occurrences * (kw.length > 6 ? 2 : 1);
  }
  return score;
}

function buildAnswer(question: string, sentences: string[]): { answer: string; snippets: string[] } {
  const keywords = Array.from(new Set(question.toLowerCase().match(/[a-z0-9]{3,}/g) || [])).slice(0, 25);
  const scored = sentences
    .map(s => ({ s, score: keywordScore(s, keywords) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (scored.length === 0) {
    return {
      answer: "I couldn't find anything in the file that clearly answers that. Try rephrasing or ask about a specific term present in the document.",
      snippets: []
    };
  }

  const snippets = scored.map(r => r.s);
  const answer = `Based on the file, here are relevant excerpts:\n\n- ${snippets.join('\n- ')}\n\n(This is a heuristic summary. A more advanced AI answer will arrive once the full model integration is enabled.)`;
  return { answer, snippets };
}

async function fetchFileText(fileUrl: string, mime: string, debug?: boolean): Promise<{ text: string | null; error?: string }> {
  try {
    const res = await fetch(fileUrl);
  if (!res.ok) return { text: null, error: `fetch_failed_status_${res.status}` };

    if (mime.startsWith('text/')) {
      const text = await res.text();
      console.log('[chat-file] TEXT extracted length:', text.length);
  const preview = text.slice(0, 200).replace(/\s+/g, ' ');
  console.log('[chat-file] TEXT preview(0-200):', preview);
      return { text: text.length > 150_000 ? text.slice(0, 150_000) : text };
    }

    if (mime === 'application/pdf') {
      const arrayBuf = await res.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuf);
      console.log('[chat-file] PDF bytes length:', pdfBuffer.length);
      try {
        // Try using pdfjs-dist directly instead of pdf-parse
        console.log('[chat-file] Using pdfjs-dist for extraction...');
        const pdfjs = await import('pdfjs-dist');
        
        // Use custom node worker workaround
        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
          console.log('[chat-file] Running in Node environment, disabling worker');
          (pdfjs as any).GlobalWorkerOptions = (pdfjs as any).GlobalWorkerOptions || {};
          (pdfjs as any).GlobalWorkerOptions.workerSrc = false;
        }
        
        // @ts-ignore dynamic worker config
        const getDocument = (pdfjs as any).getDocument || (pdfjs as any).default.getDocument;
        const loadingTask = getDocument({ data: pdfBuffer });
        const pdf = await loadingTask.promise;
        let combined = '';
        const maxPages = Math.min(pdf.numPages, 25); // limit pages for performance
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((it: any) => it.str).join(' ').trim();
          combined += pageText + '\n';
        }
        let text = combined.trim();
        console.log('[chat-file] Extracted PDF text length (pdfjs-dist):', text.length);
        if (text) {
          const preview = text.slice(0, 200).replace(/\s+/g, ' ');
          console.log('[chat-file] PDF preview(0-200):', preview);
        }
        if (!text) return { text: '\n' };
        return { text: text.length > 150_000 ? text.slice(0, 150_000) : text };
      } catch (err) {
        console.error('[chat-file] PDF extraction failed', err);
        const msg = (err as any)?.message || 'unknown';
        return { text: null, error: `pdf_extraction_failed:${msg}` };
      }
    }

    if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mime === 'application/msword') {
      const arrayBuf = await res.arrayBuffer();
      try {
        const { default: mammoth } = await import('mammoth');
        const { value } = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuf) });
        const text = (value || '').trim();
        console.log('[chat-file] DOCX text length:', text.length);
        if (text) {
          const preview = text.slice(0, 200).replace(/\s+/g, ' ');
          console.log('[chat-file] DOCX preview(0-200):', preview);
        }
        return { text: text.length > 150_000 ? text.slice(0, 150_000) : text };
      } catch (err) {
            console.error('[chat-file] mammoth failed', err);
            const msg = (err as any)?.message || 'unknown';
            return { text: null, error: `doc_parse_failed:${msg}` };
      }
    }

    return { text: null, error: 'unsupported_mime' };
  } catch (e: any) {
    console.error('fetchFileText error', e);
    return { text: null, error: `exception:${e?.message || 'unknown'}` };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
  const { fileId, messages, debug } = body as { fileId?: string; messages?: Array<{ role: string; content: string }>; debug?: boolean };
    if (!fileId || !messages || messages.length === 0) {
      return NextResponse.json({ error: 'fileId and messages required' }, { status: 400 });
    }
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) {
      return NextResponse.json({ error: 'A user message is required' }, { status: 400 });
    }

    const [fileRecord] = await db().select().from(files).where(eq(files.id, fileId));
    if (!fileRecord || fileRecord.userId !== userId) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    if (fileRecord.isFolder) {
      return NextResponse.json({ error: 'Cannot chat with a folder' }, { status: 400 });
    }

    console.log('[chat-file] Fetching file for Q&A', { id: fileRecord.id, name: fileRecord.name, type: fileRecord.type });
    const started = Date.now();
  let { text, error: extractError } = await fetchFileText(fileRecord.fileUrl, fileRecord.type, debug);
  const extractionMs = Date.now() - started;
  if (!text) {
      return NextResponse.json({
        answer: `Could not extract text. Either the file type (${fileRecord.type}) is unsupported or extraction failed. Supported: text/*, PDF, DOC/DOCX.`,
        snippets: [],
        debug: debug ? {
          fileType: fileRecord.type,
            extractionMs,
            textPresent: false,
      reason: 'unsupported_or_failure',
      extractError
        } : undefined
      });
    }
    // OCR fallback for scanned/image-only PDFs (sentinel value '\n' used above)
    let ocrMs: number | undefined;
    let ocrTried = false;
    let ocrError: string | undefined;
    let ocrDebugInfo: any = undefined;
    
    if (text === '\n' && fileRecord.type === 'application/pdf') {
      ocrTried = true;
      console.log('[chat-file] Attempting OCR for image-only PDF:', fileRecord.name);
      
      const ocrResult = await performOCR(fileRecord.fileUrl, {
        detectOrientation: true,
        isTable: false
      });
      
      if (ocrResult.text) {
        text = ocrResult.text.length > 150_000 ? ocrResult.text.slice(0, 150_000) : ocrResult.text;
        ocrMs = ocrResult.processingTimeMs;
        ocrDebugInfo = ocrResult.debugInfo;
      } else {
        ocrError = ocrResult.error;
        ocrMs = ocrResult.processingTimeMs;
        ocrDebugInfo = ocrResult.debugInfo;
      }
    }
    if (text === '\n') {
      return NextResponse.json({
        answer: 'No selectable text found in this PDF. It appears to be scanned (image-only). OCR attempt ' + (ocrTried ? (ocrError ? 'failed (' + ocrError + ')' : 'succeeded') : 'was skipped (API key missing)').replace(/\s+/g,' ') + '.',
        snippets: [],
        debug: debug ? {
          fileType: fileRecord.type,
          extractionMs,
          textPresent: false,
          reason: 'empty_pdf_text',
          ocrTried,
          ocrMs,
          ocrError,
          ocrDebugInfo
        } : undefined
      });
    }

  // At this point text is guaranteed not null and not the sentinel '\n'
  const finalText: string = text!;
  const sentences = sentenceSplit(finalText);
    const { answer, snippets } = buildAnswer(lastUserMessage.content, sentences);

    return NextResponse.json({
      answer,
      snippets,
      meta: {
        fileName: fileRecord.name,
        fileType: fileRecord.type,
        totalSentences: sentences.length,
        usedSnippets: snippets.length
      },
      debug: debug ? {
        fileType: fileRecord.type,
        extractionMs,
        textLength: finalText.length,
        first200: finalText.slice(0, 200),
        sentenceSample: sentences.slice(0, 3),
        ocr: ocrTried ? {
          tried: true,
          succeeded: !ocrError,
          error: ocrError,
          processingTimeMs: ocrMs,
          debugInfo: ocrDebugInfo
        } : undefined
      } : undefined
    });
  } catch (e) {
    console.error('Chat file error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
