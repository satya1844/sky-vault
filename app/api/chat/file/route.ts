import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

interface ChatBody {
  fileId: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  debug?: boolean;
}

function extractQuestion(messages: ChatBody["messages"]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content.trim();
  }
  return "";
}

function pickKeywords(text: string) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const unique: string[] = [];
  for (const w of words) {
    if (!unique.includes(w)) unique.push(w);
  }
  return unique.slice(0, 8);
}

function findSnippets(content: string, keywords: string[]) {
  const lines = content.split(/\r?\n/);
  const matches: string[] = [];
  for (const line of lines) {
    const l = line.toLowerCase();
    if (keywords.some((k) => l.includes(k))) {
      matches.push(line.trim().slice(0, 300));
      if (matches.length >= 5) break;
    }
  }
  return matches;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ChatBody;
    if (!body?.fileId || !Array.isArray(body?.messages)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const [file] = await db()
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, body.fileId),
          eq(files.userId, userId),
          eq(files.isFolder, false),
          eq(files.isTrashed, false)
        )
      );

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const question = extractQuestion(body.messages);

    // Handle text files directly
    if (file.type?.startsWith("text/")) {
      const resp = await fetch(file.fileUrl);
      if (!resp.ok) {
        return NextResponse.json({ error: "Unable to read file" }, { status: 502 });
      }
      const content = await resp.text();
      const keywords = pickKeywords(question);
      const snippets = findSnippets(content, keywords);

      let answer: string;
      if (snippets.length) {
        answer = `Here are relevant passages related to your question:\n\n` +
          snippets.map((s) => `• ${s}`).join("\n");
      } else {
        const preview = content.trim().slice(0, 600);
        answer =
          "I couldn't find exact matches. Here's a brief preview of the file to help: \n\n" +
          preview;
      }

      return NextResponse.json({ answer, snippets });
    }

    // PDFs and Office docs: minimal OCR hint for MVP
    if (
      file.type === "application/pdf" ||
      file.type === "application/msword" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const hasOcrKey = !!process.env.OCR_SPACE_API_KEY;
      const answer = hasOcrKey
        ? "OCR is enabled, but full extraction isn't implemented in this build. Try uploading a text version for best results."
        : "This file likely requires OCR to extract text. OCR is not configured; please add OCR_SPACE_API_KEY or upload a text version.";

      return NextResponse.json({ answer, snippets: [] });
    }

    return NextResponse.json({ error: "Unsupported file type for chat" }, { status: 400 });
  } catch (e) {
    console.error("Chat/file handler error", e);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
