import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getImageKit, isImageKitConfigured } from "@/lib/imagekit";

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if ImageKit is properly configured
    if (!isImageKitConfigured()) {
      return NextResponse.json(
        { error: "ImageKit not configured" },
        { status: 503 }
      );
    }

    // Get authentication parameters from ImageKit
    const authParams = getImageKit().getAuthenticationParameters();

    return NextResponse.json(authParams);
  } catch (error) {
    console.error("Error generating ImageKit auth params:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication parameters" },
      { status: 500 }
    );
  }
}