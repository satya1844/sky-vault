import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

async function fetchFileText(fileUrl: string, mime: string): Promise<string | null> {
  try {
    if (!mime.startsWith('text/')) return null;
    const res = await fetch(fileUrl);
    if (!res.ok) return null;
    const text = await res.text();
    return text.length > 150_000 ? text.slice(0, 150_000) : text;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileId, messages } = body as { fileId?: string; messages?: Array<{ role: string; content: string }>; };
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

    const text = await fetchFileText(fileRecord.fileUrl, fileRecord.type);
    if (!text) {
      return NextResponse.json({
        answer: `This file type (${fileRecord.type}) is not yet supported for Q&A. Supported: text/* files (MVP).`,
        snippets: []
      });
    }

    const sentences = sentenceSplit(text);
    const { answer, snippets } = buildAnswer(lastUserMessage.content, sentences);

    return NextResponse.json({
      answer,
      snippets,
      meta: {
        fileName: fileRecord.name,
        fileType: fileRecord.type,
        totalSentences: sentences.length,
        usedSnippets: snippets.length
      }
    });
  } catch (e) {
    console.error('Chat file error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
