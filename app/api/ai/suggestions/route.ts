import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Heuristic AI Suggestions Endpoint
 * ---------------------------------
 * Returns a list of simple rule-based suggestions that feel "smart" without
 * requiring an ML model. This creates an integration point we can later
 * enhance with embeddings / LLM ranking.
 *
 * Query params:
 *  - userId: authenticated user id (must match Clerk auth)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      return NextResponse.json({ suggestions: [] }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId || userId !== authUserId) {
      return NextResponse.json({ suggestions: [] }, { status: 403 });
    }

    // Fetch lightweight file metadata (exclude trashed)
    const userFiles = await db()
      .select({
        id: files.id,
        name: files.name,
        size: files.size,
        type: files.type,
        parentId: files.parentId,
        isFolder: files.isFolder,
        isTrashed: files.isTrashed,
        updatedAt: files.updatedAt,
        createdAt: files.createdAt,
      })
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.isTrashed, false)));

    const now = Date.now();
    const rootItems = userFiles.filter(f => !f.parentId && !f.isFolder);
    const images = userFiles.filter(f => !f.isFolder && f.type.startsWith("image/"));
    const largeOld = userFiles.filter(
      f =>
        !f.isFolder &&
        f.size > 5_000_000 &&
        now - new Date(f.updatedAt as unknown as string).getTime() > 30 * 24 * 3600 * 1000
    );

    // Duplicate heuristic (same lowercase name + size) ignoring folders
    const dupBuckets = new Map<string, { ids: string[]; name: string; size: number }>();
    for (const f of userFiles) {
      if (f.isFolder) continue;
      const key = `${f.name.toLowerCase()}|${f.size}`;
      const bucket = dupBuckets.get(key) || { ids: [], name: f.name, size: f.size };
      bucket.ids.push(f.id);
      dupBuckets.set(key, bucket);
    }
    const duplicateGroups = [...dupBuckets.values()].filter(g => g.ids.length > 1);
    const duplicateCount = duplicateGroups.reduce((acc, g) => acc + g.ids.length, 0);

    type Suggestion = {
      id: string;
      label: string;
      detail: string;
      action: { type: string; target?: string };
      priority: number;
      meta?: any;
    };

    const suggestions: Suggestion[] = [];

    if (rootItems.length >= 10) {
      suggestions.push({
        id: "organize-root",
        label: "Organize root files",
        detail: `${rootItems.length} files are in the root. Consider grouping them into folders.`,
        action: { type: "NAVIGATE", target: "root" },
        priority: 3,
        meta: {
          samples: rootItems.slice(0, 8).map(f => ({ id: f.id, name: f.name, size: f.size })),
          total: rootItems.length,
        },
      });
    }

    if (duplicateCount > 0) {
      // Build sample groups with file objects (limit groups & files per group)
      const sampleGroups = duplicateGroups.slice(0, 5).map(g => ({
        name: g.name,
        size: g.size,
        files: g.ids.map(id => {
          const f = userFiles.find(uf => uf.id === id);
          return f ? { id: f.id, name: f.name, size: f.size, parentId: f.parentId } : { id };
        }).slice(0, 6),
        count: g.ids.length,
      }));
      suggestions.push({
        id: "dedupe",
        label: "Review possible duplicates",
        detail: `${duplicateCount} duplicate candidates found across ${duplicateGroups.length} groups.`,
        action: { type: "OPEN_DEDUPE" },
        priority: 4,
        meta: { groups: sampleGroups, totalGroups: duplicateGroups.length, totalFiles: duplicateCount },
      });
    }

    if (images.length >= 5) {
      suggestions.push({
        id: "tag-images",
        label: "Tag your images",
        detail: `${images.length} images could be auto-tagged (future feature).`,
        action: { type: "OPEN_IMAGES" },
        priority: 1,
        meta: {
          samples: images.slice(0, 12).map(f => ({ id: f.id, name: f.name, size: f.size })),
          total: images.length,
        },
      });
    }

    if (largeOld.length > 0) {
      suggestions.push({
        id: "archive-large-old",
        label: "Archive large inactive files",
        detail: `${largeOld.length} large files haven't changed in 30+ days.`,
        action: { type: "OPEN_ARCHIVE" },
        priority: 2,
        meta: {
          samples: largeOld.slice(0, 10).map(f => ({ id: f.id, name: f.name, size: f.size })),
          total: largeOld.length,
        },
      });
    }

    suggestions.sort((a, b) => b.priority - a.priority);

    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error("AI suggestions error", e);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
