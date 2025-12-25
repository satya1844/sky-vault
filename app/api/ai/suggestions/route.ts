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
  return NextResponse.json({ message: "Suggestions disabled" }, { status: 410 });
}
