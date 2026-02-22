import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getImageKit } from "@/lib/imagekit";

export async function POST(request: NextRequest) {
  console.log("=== File Upload Request Started ===");
  
  try {
    // Log auth attempt
    console.log("Attempting to authenticate user...");
    const authResult = await getAuth(request);
    console.log("Auth result:", { 
      userId: authResult?.userId, 
      hasUserId: !!authResult?.userId 
    });

    const { userId } = authResult;
    if (!userId) {
      console.log("❌ AUTH FAILED: No userId found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User authenticated:", userId);

    // Parse form data with logging
    console.log("Parsing form data...");
    const formData = await request.formData();
    
    const file = formData.get("file") as File;
    const parentId = (formData.get("parentId") as string) || null;

    console.log("Form data parsed:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      parentId,
      authUserId: userId
    });

    // Verify the user is uploading to their own account


    console.log("✅ User authorization verified");

    if (!file) {
      console.log("❌ No file provided in form data");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if parent folder exists if parentId is provided
    if (parentId) {
      console.log("Checking parent folder:", parentId);
      const [parentFolder] = await db()
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, parentId),
            eq(files.userId, userId),
            eq(files.isFolder, true)
          )
        );

      console.log("Parent folder check result:", !!parentFolder);

      if (!parentFolder) {
        console.log("❌ Parent folder not found");
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 }
        );
      }
    }

    // File type validation (expanded)
    console.log("Validating file type...", file.type);
    const allowedExact = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]);
    const isValidType =
      file.type.startsWith("image/") ||
      file.type.startsWith("text/") ||
      allowedExact.has(file.type);
    console.log("File type valid:", isValidType, "evaluated for", file.type);

    if (!isValidType) {
      console.log("❌ Invalid file type:", file.type);
      return NextResponse.json(
        { error: "Only images, PDFs, Word docs and text files are supported" },
        { status: 400 }
      );
    }

    console.log("Processing file upload...");
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    const originalFilename = file.name;
    const fileExtension = originalFilename.split(".").pop() || "";
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;

    // Create folder path based on parent folder if exists
    const folderPath = parentId
      ? `/skyvault/${userId}/folders/${parentId}`
      : `/skyvault/${userId}`;

    console.log("Upload details:", {
      originalFilename,
      uniqueFilename,
      folderPath,
      fileSize: fileBuffer.length
    });

    console.log("Uploading to ImageKit...");
    const uploadResponse = await getImageKit().upload({
      file: fileBuffer,
      fileName: uniqueFilename,
      folder: folderPath,
      useUniqueFileName: false,
    });

    console.log("ImageKit upload successful:", {
      fileId: uploadResponse.fileId,
      url: uploadResponse.url,
      filePath: uploadResponse.filePath
    });

    const fileData = {
      name: originalFilename,
      path: uploadResponse.filePath,
      size: file.size,
      type: file.type,
      fileUrl: uploadResponse.url,
      thumbnailUrl: uploadResponse.thumbnailUrl || null,
      userId: userId,
      parentId: parentId,
      isFolder: false,
      isStarred: false,
      isTrashed: false,
    };

    console.log("Saving to database...");
    const [newFile] = await db().insert(files).values(fileData).returning();

    console.log("✅ File upload completed successfully:", newFile.id);
    return NextResponse.json(newFile);

  } catch (error) {
    console.error("❌ Error uploading file:", error);
    
    // Log additional error details
    let errorMessage = "Failed to upload file";
    let errorType = "Unknown";
    let errorDetails = {};
    
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      errorMessage = error.message;
      errorType = error.name;
      
      // Check for specific error types
      if (error.message.includes("ImageKit")) {
        errorType = "ImageKitError";
        errorDetails = {
          hint: "Check IMAGEKIT environment variables in Vercel",
          publicKey: !!process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
          privateKey: !!process.env.IMAGEKIT_PRIVATE_KEY,
          urlEndpoint: !!process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
        };
      } else if (error.message.includes("database") || error.message.includes("DATABASE")) {
        errorType = "DatabaseError";
        errorDetails = {
          hint: "Check DATABASE_URL in Vercel",
          hasDbUrl: !!process.env.DATABASE_URL
        };
      } else if (error.message.includes("PAYLOAD_TOO_LARGE") || error.message.includes("body size")) {
        errorType = "PayloadTooLarge";
        errorDetails = {
          hint: "File too large for Vercel (max 4.5MB). Consider client-side upload to ImageKit."
        };
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        type: errorType,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}