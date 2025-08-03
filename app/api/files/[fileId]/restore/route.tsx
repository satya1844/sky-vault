import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Get the current file (only trashed files can be restored)
    const [file] = await db()
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId), eq(files.isTrashed, true)));

    if (!file) {
      return NextResponse.json({ error: "Trashed file not found" }, { status: 404 });
    }

    // Restore the file (update isTrashed status to false)
    const [updatedFile] = await db()
      .update(files)
      .set({ 
        isTrashed: false,
        updatedAt: new Date()
      })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .returning();

    return NextResponse.json({
      success: true,
      message: "File restored successfully",
      file: updatedFile
    });
  } catch (error) {
    console.error("Error restoring file:", error);
    return NextResponse.json(
      { error: "Failed to restore file" },
      { status: 500 }
    );
  }
}