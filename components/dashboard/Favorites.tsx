"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { addToast } from "@heroui/toast";
import { useUser } from "@clerk/nextjs";
import { Grid, List, Star, X, Folder } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
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

export default function Favorites() {
  const { user } = useUser();
  const userId = user?.id;

  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchStarredFiles = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: allFiles } = await axios.get<FileType[]>(`/api/files?userId=${userId}`);
      const starred = allFiles.filter(file => file.isStarred);
      setFiles(starred);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
      addToast({
        title: "Error Loading Favorites",
        description: "Something went wrong while loading your favorites.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStarredFiles();
  }, [fetchStarredFiles]);

  const handleUnstar = async (fileId: string) => {
    try {
      await axios.patch(`/api/files/${fileId}/star`, { isStarred: false });
      setFiles(files => files.filter(f => f.id !== fileId));
      addToast({
        title: "Removed from Favorites",
        description: "File is no longer starred.",
        color: "primary",
      });
    } catch (error) {
      console.error("Error unstarring file:", error);
      addToast({
        title: "Error",
        description: "Could not remove from favorites.",
        color: "danger",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const fileDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - fileDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return format(fileDate, "MMM d, yyyy");
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-gray-900 min-h-screen">
        <h2 className="text-lg md:text-xl font-semibold mb-4 text-white">Favorites</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg md:rounded-xl shadow-sm p-3 md:p-4 animate-pulse aspect-square"
            >
              <div className="aspect-square rounded-lg mb-2 md:mb-3 bg-gray-700"></div>
              <div className="space-y-1 md:space-y-2">
                <div className="h-3 md:h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-2 md:h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
          <h2 className="text-lg md:text-xl font-semibold text-white">Favorites</h2>
          <span className="text-xs md:text-sm text-gray-400">({files.length} items)</span>
        </div>

        <div className="flex items-center space-x-1 md:space-x-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 md:p-2 rounded ${viewMode === "grid" ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"} transition-colors`}
            aria-label="Grid view"
          >
            <Grid className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 md:p-2 rounded ${viewMode === "list" ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"} transition-colors`}
            aria-label="List view"
          >
            <List className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <Star className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-medium text-gray-300 mb-2">No Favorites Yet</h3>
          <p className="text-sm md:text-base text-gray-500">Star your important files to access them quickly here.</p>
        </div>
      ) : (
        <>
          {viewMode === "list" ? (
            <div className="bg-background rounded-lg overflow-hidden">
              {/* Table Header - Hidden on mobile */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-background border-b border-gray-700">
                <div className="col-span-6">
                  <span className="text-sm font-medium text-gray-300 uppercase tracking-wide">NAME</span>
                </div>
                <div className="col-span-3">
                  <span className="text-sm font-medium text-gray-300 uppercase tracking-wide">MODIFIED</span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm font-medium text-gray-300 uppercase tracking-wide">SIZE</span>
                </div>
                <div className="col-span-1"></div>
              </div>
              
              {/* File List */}
              <div className="divide-y divide-white/10">
                {files.map(file => (
                  <FileListItem
                    key={file.id}
                    file={file}
                    onUnstar={handleUnstar}
                    formatFileSize={formatFileSize}
                    getRelativeTime={getRelativeTime}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
              {files.map(file => (
                <FileGridItem
                  key={file.id}
                  file={file}
                  onUnstar={handleUnstar}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface FileListItemProps {
  file: FileType;
  onUnstar: (fileId: string) => void;
  formatFileSize: (bytes: number) => string;
  getRelativeTime: (date: string) => string;
}

function FileListItem({ file, onUnstar, formatFileSize, getRelativeTime }: FileListItemProps) {
  const [showActions, setShowActions] = useState(false);
  const thumbnailUrl = getThumbnailUrl(file);

  return (
    <div
      className="grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-4 py-2 md:py-3 hover:bg-gray-750 transition-colors group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Name column with icon and star */}
      <div className="col-span-8 md:col-span-6 flex items-center space-x-2 md:space-x-3 min-w-0">
        <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 relative">
          {file.isFolder || file.type === "folder" ? (
            <Folder className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
          ) : (
            <SafeImage
              src={thumbnailUrl || '/file.svg'}
              alt={file.name}
              width={32}
              height={32}
              className="rounded object-cover"
            />
          )}
        </div>
        <div className="flex items-center space-x-1 md:space-x-2 min-w-0 flex-1">
          <span className="text-white font-medium truncate text-sm md:text-base">{file.name}</span>
          <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 flex-shrink-0 fill-current" />
        </div>
      </div>

      {/* Modified column - Hidden on mobile */}
      <div className="hidden md:flex col-span-3 items-center">
        <span className="text-gray-400 text-sm">
          {getRelativeTime(file.updatedAt ? file.updatedAt.toISOString() : file.createdAt.toISOString())}
        </span>
      </div>

      {/* Size column - Hidden on mobile */}
      <div className="hidden md:flex col-span-2 items-center">
        <span className="text-gray-400 text-sm">
          {file.size ? formatFileSize(file.size) : '--'}
        </span>
      </div>

      {/* Actions column */}
      <div className="col-span-4 md:col-span-1 flex items-center justify-end">
        {showActions && (
          <button
            onClick={() => onUnstar(file.id)}
            className="p-1 md:p-1.5 rounded-full bg-red-600 hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remove from favorites"
            title="Remove from favorites"
          >
            <X className="w-3 h-3 md:w-4 md:h-4 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

interface FileGridItemProps {
  file: FileType;
  onUnstar: (fileId: string) => void;
}

function FileGridItem({ file, onUnstar }: FileGridItemProps) {
  const [showActions, setShowActions] = useState(false);
  const thumbnailUrl = getThumbnailUrl(file);

  return (
    <div
      className="group relative aspect-square rounded-lg md:rounded-xl overflow-hidden bg-gray-800 hover:bg-gray-750 transition-all duration-200"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Thumbnail */}
      <div className="w-full h-full relative">
        {file.isFolder || file.type === "folder" ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <Folder className="w-12 h-12 md:w-16 md:h-16 text-blue-500" />
          </div>
        ) : (
          <SafeImage
            src={thumbnailUrl || '/file.svg'}
            alt={file.name}
            width={200}
            height={200}
            className="object-cover opacity-75 w-full h-full"
          />
        )}
        <div className="absolute top-1 md:top-2 left-1 md:left-2">
          <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
        </div>
      </div>

      {/* File Info */}
      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
        <span className="font-medium truncate text-white text-xs md:text-sm block">
          {file.name}
        </span>
        <span className="text-[10px] md:text-xs text-gray-300 block mt-0.5 md:mt-1">
          {format(new Date(file.updatedAt || file.createdAt), "MMM d, yyyy")}
        </span>
      </div>

      {/* Unstar Action */}
      {showActions && (
        <div className="absolute top-1 md:top-2 right-1 md:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onUnstar(file.id)}
            className="p-1 md:p-1.5 rounded-full bg-red-600 bg-opacity-80 hover:bg-opacity-100 transition-colors"
            aria-label="Remove from favorites"
            title="Remove from favorites"
          >
            <X className="w-3 h-3 md:w-4 md:h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

function getThumbnailUrl(file: FileType): string | undefined {
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
}