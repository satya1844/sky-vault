// /app/api/user/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

interface UserStats {
  fileCount: number;
  totalStorage: string;
  sharedCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 KB';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestUserId = searchParams.get('userId');

    // Verify that the requested userId matches the authenticated user
    if (requestUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user's files (excluding trashed files)
    const userFiles = await db()
      .select({
        id: files.id,
        size: files.size,
        isFolder: files.isFolder,
        parentId: files.parentId,
        isTrashed: files.isTrashed
      })
      .from(files)
      .where(and(
        eq(files.userId, userId),
        eq(files.isTrashed, false) // Only count non-trashed files
      ));

    // Calculate file count (excluding folders)
    const fileCount = userFiles.filter(file => !file.isFolder).length;

    // Calculate total storage used
    const totalBytes = userFiles
      .filter(file => !file.isFolder)
      .reduce((total, file) => total + (file.size || 0), 0);
    
    const totalStorage = formatBytes(totalBytes);

    // Calculate shared files count
    // This depends on your sharing implementation
    // For now, let's assume files with parentId are shared, or you have a separate sharing table
    // You'll need to adjust this based on your actual sharing logic
    
    // Option 1: If you have a separate sharing/permissions table
    // const sharedFilesResult = await db
    //   .select({ count: sql`count(*)` })
    //   .from(fileShares) // assuming you have a file shares table
    //   .where(eq(fileShares.ownerId, userId));
    
    // Option 2: Simple approach - count files that might be in shared folders
    // This is a placeholder - adjust based on your sharing logic
    const sharedCount = userFiles.filter(file => 
      file.parentId !== null && !file.isFolder
    ).length;

    // Alternative: If you have a separate sharing mechanism, query that instead
    // const sharedCount = await getSharedFilesCount(userId);

    const stats: UserStats = {
      fileCount,
      totalStorage,
      sharedCount
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    );
  }
}

// Optional: Helper function if you have a separate sharing system
// async function getSharedFilesCount(userId: string): Promise<number> {
//   try {
//     // Example if you have a file_shares table
//     // const result = await db
//     //   .select({ count: sql`count(*)` })
//     //   .from(fileShares)
//     //   .where(eq(fileShares.sharedBy, userId));
//     // 
//     // return Number(result[0]?.count || 0);
//     return 0;
//   } catch (error) {
//     console.error("Error getting shared files count:", error);
//     return 0;
//   }
// }