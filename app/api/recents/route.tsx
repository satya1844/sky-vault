import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // your DB client (e.g., drizzle)
import { files } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const limit = parseInt(searchParams.get("limit") || "4");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const recentFiles = await db()
      .select()
      .from(files)
      .where(eq(files.userId, userId))
      .orderBy(desc(files.createdAt))
      .limit(limit);

    return NextResponse.json(recentFiles);
  } catch (error) {
    console.error("Failed to fetch recent files:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
