"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { File, Folder, Download, Share2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { addToast } from "@heroui/toast";
import type { File as FileType } from "@/lib/db/schema";

interface RecentsProps {
  userId: string;
  limit?: number; // How many recent items to show
  refreshTrigger?: number; // External trigger to refresh data
}

export default function Recents({ userId, limit = 20, refreshTrigger = 0 }: RecentsProps) {
  const [recentFiles, setRecentFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent files
  const fetchRecentFiles = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch all files and filter recent ones
      const response = await axios.get(`/api/files?userId=${userId}`);
      const allFiles = response.data;
      
      // Filter out trashed files and sort by creation date (most recent first)
      const recentItems = allFiles
        .filter((file: FileType) => !file.isTrashed)
        .sort((a: FileType, b: FileType) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, limit);
      
      setRecentFiles(recentItems);
    } catch (error) {
      console.error("Error fetching recent files:", error);
      addToast({
        title: "Error Loading Recent Files",
        description: "We couldn't load your recent files. Please try again later.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  // Fetch files when component mounts or dependencies change
  useEffect(() => {
    fetchRecentFiles();
  }, [fetchRecentFiles, refreshTrigger]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 Bytes";
    const units = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
  };

  // Handle file download (reusing logic from FileList)
  const handleDownloadFile = async (file: FileType) => {
    try {
      addToast({
        title: "Preparing Download",
        description: `Getting "${file.name}" ready for download...`,
        color: "primary",
      });

      if (file.type.startsWith("image/")) {
        const downloadUrl = `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:q-100,orig-true/${file.path}`;
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } else {
        const response = await fetch(file.fileUrl);
        if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }

      addToast({
        title: "Download Ready",
        description: `"${file.name}" is ready to download.`,
        color: "success",
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      addToast({
        title: "Download Failed",
        description: "We couldn't download the file. Please try again later.",
        color: "danger",
      });
    }
  };

  // Handle sharing (placeholder - implement based on your sharing logic)
  const handleShareFile = (file: FileType) => {
    // Implement your sharing logic here
    console.log(`Share ${file.name}`);
    addToast({
      title: "Share Feature",
      description: "Sharing feature coming soon!",
      color: "primary",
    });
  };

  // Open image viewer (reusing logic from FileList)
  const openImageViewer = (file: FileType) => {
    if (file.type.startsWith("image/")) {
      const optimizedUrl = `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:q-90,w-1600,h-1200,fo-auto/${file.path}`;
      window.open(optimizedUrl, "_blank");
    }
  };

  // Handle item click
  const handleItemClick = (file: FileType) => {
    if (file.isFolder) {
      // Handle folder navigation - you might want to pass this up to parent component
      console.log(`Navigate to folder: ${file.name}`);
    } else if (file.type.startsWith("image/")) {
      openImageViewer(file);
    }
  };

  // Get thumbnail URL for images
  const getThumbnailUrl = (file: FileType): string | undefined => {
    if (file.type.startsWith("image/") && file.path) {
      // Use ImageKit transformations for thumbnails
      return `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:w-200,h-200,fo-auto,q-80/${file.path}`;
    }
    return undefined;
  };

  // Get appropriate icon for file type
  const getFileIcon = (file: FileType) => {
    if (file.isFolder) {
      return <Folder className="w-12 h-12 text-blue-500" />;
    } else if (file.type.startsWith("image/")) {
      return <ImageIcon className="w-12 h-12 text-green-500" />;
    } else {
      return <File className="w-12 h-12 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: limit > 10 ? 10 : limit }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 animate-pulse"
            >
              <div className="aspect-square rounded-lg mb-3 bg-gray-200 dark:bg-gray-700"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {recentFiles.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400 italic py-8">
            Upload something, man! 🤘📂
          </div>
        ) : (
          recentFiles.map((file) => {
            const thumbnailUrl = getThumbnailUrl(file);
            
            return (
              <div
                key={file.id}
                className={`group relative bg-[#1E1E1E] rounded-lg shadow-sm hover:shadow-md border border-[#2E2F2F] transition-all duration-200 p-4 ${
                  file.isFolder || file.type.startsWith("image/") ? "cursor-pointer" : ""
                }`}
                onClick={() => handleItemClick(file)}
              >
                {/* Thumbnail or Icon */}
                <div className="aspect-square rounded-lg mb-3 overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {thumbnailUrl ? (
                    <Image
                      src={thumbnailUrl}
                      alt={file.name}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    getFileIcon(file)
                  )}
                </div>

                {/* File/Folder Info */}
                <div className="space-y-1">
                  <h3 className="font-medium text-sm truncate" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(file.createdAt), "MMM d, yyyy")}
                  </p>
                  {!file.isFolder && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      {file.type.split('/')[1] || 'file'}
                      {file.size && ` • ${formatFileSize(file.size)}`}
                    </p>
                  )}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  {!file.isFolder && (
                    <button
                      className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file);
                      }}
                      title="Download"
                    >
                      <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                  )}
                  <button
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareFile(file);
                    }}
                    title="Share"
                  >
                    <Share2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}