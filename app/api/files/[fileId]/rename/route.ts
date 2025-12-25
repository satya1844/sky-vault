import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ fileId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await props.params;
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!fileId || !name) {
      return NextResponse.json(
        { error: "Missing or invalid name or fileId" },
        { status: 400 }
      );
    }

    const database = db();
    const [updated] = await database
      .update(files)
      .set({ 
        name,
        updatedAt: new Date()
      })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .returning();
    
    if (!updated) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error renaming file:", error);
    return NextResponse.json({ error: "Failed to rename file" }, { status: 500 });
  }
}
