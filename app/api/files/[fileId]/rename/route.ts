import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, context: any) {
  const { params } = context;
  const { name } = await req.json();
  if (!name || !params.fileId) {
    return NextResponse.json({ error: "Missing name or fileId" }, { status: 400 });
  }
  
  try {
    const database = db();
    const [updated] = await database
      .update(files)
      .set({ 
        name: name.trim(),
        updatedAt: new Date()
      })
      .where(eq(files.id, params.fileId))
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
