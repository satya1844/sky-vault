import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Move a file or folder to a new parent folder.
 * PATCH /api/files/:fileId/move
 * Body: { parentId: string | null }
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ fileId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await props.params;
    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { parentId } = body as { parentId?: string | null };

    // Fetch file to move
    const [file] = await db()
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));
    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

    if (parentId === fileId) {
      return NextResponse.json({ error: "Cannot move into itself" }, { status: 400 });
    }

    let newParent: any = null;
    if (parentId) {
      const [parent] = await db()
        .select()
        .from(files)
        .where(and(eq(files.id, parentId), eq(files.userId, userId), eq(files.isFolder, true)));
      if (!parent) return NextResponse.json({ error: "Destination folder not found" }, { status: 404 });
      newParent = parent;
    }

    // Update parentId only (path recomputation can be added later if needed)
    const [updated] = await db()
      .update(files)
      .set({ parentId: parentId ?? null })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .returning();

    return NextResponse.json({ success: true, file: updated, destination: newParent ? { id: newParent.id, name: newParent.name } : null });
  } catch (e) {
    console.error("Move file error", e);
    return NextResponse.json({ error: "Failed to move file" }, { status: 500 });
  }
}
