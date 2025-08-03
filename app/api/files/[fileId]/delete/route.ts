import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import ImageKit from "imagekit";

// Initialize ImageKit with your credentials
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

export async function DELETE(
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

    // Get the file to be deleted
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete file from ImageKit if it's not a folder
    if (!file.isFolder) {
      try {
        let imagekitFileId = null;

        if (file.fileUrl) {
          const urlWithoutQuery = file.fileUrl.split("?")[0];
          imagekitFileId = urlWithoutQuery.split("/").pop();
        }

        if (!imagekitFileId && file.path) {
          imagekitFileId = file.path.split("/").pop();
        }

        if (imagekitFileId) {
          try {
            // Try to search for the file first
            const searchResults = await imagekit.listFiles({
              name: imagekitFileId,
              limit: 1,
            });

            if (searchResults && searchResults.length > 0) {
              const fileObject = searchResults[0];
              // Check if it's a file object (not a folder) and has fileId
              if ('fileId' in fileObject && fileObject.fileId) {
                await imagekit.deleteFile(fileObject.fileId);
              } else {
                // Fallback to direct deletion
                await imagekit.deleteFile(imagekitFileId);
              }
            } else {
              // If search doesn't work, try direct deletion with the extracted ID
              await imagekit.deleteFile(imagekitFileId);
            }
          } catch (searchError) {
            console.error(`Error searching for file in ImageKit:`, searchError);
            // Try direct deletion as fallback
            try {
              await imagekit.deleteFile(imagekitFileId);
            } catch (deleteError) {
              console.error(`Error deleting file ${imagekitFileId} from ImageKit:`, deleteError);
              // Don't throw here, continue with database deletion
            }
          }
        }
      } catch (error) {
        console.error(`Error deleting file ${fileId} from ImageKit:`, error);
      }
    }

    // Delete file from database
    const [deletedFile] = await db
      .delete(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .returning();

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
      deletedFile,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}