"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { File, Folder, Download, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { addToast } from "@heroui/toast";
import type { File as FileType } from "@/lib/db/schema";



// Custom Image component with error handling
const SafeImage = ({ src, alt, width, height, className }: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc('/file.svg'); // Fallback to existing file icon
    }
  };

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
};

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

  // Sharing feature not implemented; UI removed to avoid confusion.

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
    // Check if it's a folder first
    if (file.isFolder || file.type === "folder") {
      return undefined; // Return undefined for folders so we can render the folder icon component
    }

    // For images, try to use the original URL without transformation first
    if (file.type?.startsWith("image/") && file.fileUrl) {
      // Use original URL to avoid 404s from transformations
      return file.fileUrl;
    }

    // Return file type specific icons (use existing SVG files)
    switch (file.type) {
      case "application/pdf":
        return "/file.svg"; // Use existing file icon
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return "/file.svg";
      case "application/vnd.ms-excel":
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        return "/file.svg";
      case "application/vnd.ms-powerpoint":
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        return "/file.svg";
      case "application/zip":
      case "application/x-zip-compressed":
        return "/file.svg";
      case "text/plain":
        return "/file.svg";
      default:
        return "/file.svg";
    }
  };

  // Get appropriate icon for file type
  const getFileIcon = (file: FileType) => {
    if (file.isFolder) {
      return <Folder className="w-8 h-8 text-blue-500" />;
    } else if (file.type.startsWith("image/")) {
      return <ImageIcon className="w-8 h-8 text-green-500" />;
    } else {
      return <File className="w-8 h-8 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4 text-white">Recent Activity</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
          {Array.from({ length: limit > 12 ? 12 : limit }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 md:p-4 animate-pulse aspect-square"
            >
              <div className="aspect-square rounded-lg mb-2 md:mb-3 bg-gray-200 dark:bg-gray-700"></div>
              <div className="space-y-1 md:space-y-2">
                <div className="h-3 md:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-2 md:h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-semibold mb-4 text-white">Recent Activity</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
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
                className={`group relative aspect-square rounded-lg md:rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden ${
                  file.isFolder || file.type.startsWith("image/") ? "cursor-pointer" : ""
                }`}
                onClick={() => handleItemClick(file)}
              >
                {/* Background Image with Uniform Blur */}
                <div className="absolute inset-0">
                  {file.isFolder || file.type === "folder" ? (
                    <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                      <Folder className="w-8 h-8 text-blue-500" />
                    </div>
                  ) : thumbnailUrl ? (
                    <SafeImage
                      src={thumbnailUrl}
                      alt={file.name}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}
                  {/* Uniform blur overlay for better text readability */}
                  <div className="absolute inset-0 bg-black/15 backdrop-blur-[0.5px] group-hover:bg-black/5 group-hover:backdrop-blur-[0.25px] transition-all duration-300"></div>
                </div>

                {/* File/Folder Info Overlay - Compact for mobile */}
                <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
                  <div className="text-white w-full space-y-1 md:space-y-2">
                    <button 
                      className="font-medium text-sm md:text-base text-white truncate w-full text-left hover:text-gray-200 transition-colors"
                      title={file.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(file);
                      }}
                      aria-label={`Open ${file.name}`}
                    >
                    {file.name}
                    </button>
                    <div className="text-xs text-gray-400">
                    {format(new Date(file.createdAt), "MMM d, yyyy")}
                    </div>
                  {!file.isFolder && (
                      <div className="flex items-center gap-1 md:gap-2 text-xs text-gray-400">
                        <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-medium ${
                          file.type.includes('pdf') ? 'bg-red-500/20 text-red-400' :
                          file.type.includes('png') ? 'bg-green-500/20 text-green-400' :
                          file.type.includes('jpeg') || file.type.includes('jpg') ? 'bg-yellow-500/20 text-yellow-400' :
                          file.type.includes('gif') ? 'bg-purple-500/20 text-purple-400' :
                          file.type.includes('webp') ? 'bg-blue-500/20 text-blue-400' :
                          'bg-white/10 text-white/70'
                        }`}>
                          {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                        {file.size && (
                          <span className="text-[10px] md:text-xs">{formatFileSize(file.size)}</span>
                        )}
                      </div>
                  )}
                  </div>
                </div>

                {/* Hover Actions - Smaller on mobile */}
                <div className="absolute top-2 md:top-3 right-2 md:right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 md:gap-2">
                  {!file.isFolder && (
                    <button
                      className="p-1.5 md:p-2 bg-black/50 backdrop-blur-md rounded-full shadow-lg hover:bg-black/70 transition-colors border border-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file);
                      }}
                      title="Download"
                      aria-label={`Download ${file.name}`}
                    >
                      <Download className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </button>
                  )}
                  {/* Share action removed until implemented */}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}