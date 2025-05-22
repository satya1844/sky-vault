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

    // Get the current file
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Toggle the isTrashed status (move to trash or restore)
    const [updatedFile] = await db
      .update(files)
      .set({ isTrashed: !file.isTrashed })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .returning();

    const action = updatedFile.isTrashed ? "moved to trash" : "restored";
    return NextResponse.json({
      ...updatedFile,
      message: `