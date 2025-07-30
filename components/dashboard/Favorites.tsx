"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { addToast } from "@heroui/toast";
import { useUser } from "@clerk/nextjs";
import { Grid, List, Star, X } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import type { File as FileType } from "@/lib/db/schema";

export default function Favorites() {
  const { user } = useUser();
  const userId = user?.id;

  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

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
        color: "info",
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
        <h2 className="text-xl font-semibold mb-4 text-white">Favorites</h2>
        <div className="space-y-2">
          {[...Array(10)].map((_, idx) => (
            <div key={idx} className="h-12 w-full rounded bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Star className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-semibold text-white">Favorites</h2>
          <span className="text-sm text-gray-400">({files.length} items)</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${viewMode === "grid" ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-100"} transition-colors`}
            aria-label="Grid view"
          >
            <Grid className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${viewMode === "list" ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"} transition-colors`}
            aria-label="List view"
          >
            <List className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Favorites Yet</h3>
          <p className="text-gray-500">Star your important files to access them quickly here.</p>
        </div>
      ) : (
        <>
          {viewMode === "list" ? (
            <div className="bg-background rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-background border-b border-gray-700">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
      className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-750 transition-colors group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Name column with icon and star */}
      <div className="col-span-6 flex items-center space-x-3 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 relative">
          <Image
            src={thumbnailUrl || '/placeholder-image.jpg'}
            alt={file.name}
            width={32}
            height={32}
            className="rounded object-cover"
          />
        </div>
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <span className="text-white font-medium truncate">{file.name}</span>
          <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 fill-current" />
        </div>
      </div>

      {/* Modified column */}
      <div className="col-span-3 flex items-center">
        <span className="text-gray-400 text-sm">
          {getRelativeTime(file.updatedAt || file.createdAt)}
        </span>
      </div>

      {/* Size column */}
      <div className="col-span-2 flex items-center">
        <span className="text-gray-400 text-sm">
          {file.size ? formatFileSize(file.size) : '--'}
        </span>
      </div>

      {/* Actions column */}
      <div className="col-span-1 flex items-center justify-end">
        {showActions && (
          <button
            onClick={() => onUnstar(file.id)}
            className="p-1 rounded-full bg-red-600 hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remove from favorites"
            title="Remove from favorites"
          >
            <X className="w-4 h-4 text-white" />
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
      className="group relative aspect-square rounded-lg overflow-hidden bg-gray-800 hover:bg-gray-750 transition-all duration-200"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Thumbnail */}
      <div className="w-full h-full relative">
        <Image
          src={thumbnailUrl || '/placeholder-image.jpg'}
          alt={file.name}
          fill
          className="object-cover opacity-75"
        />
        <div className="absolute top-2 left-2">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
        </div>
      </div>

      {/* File Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
        <span className="font-medium truncate text-white text-sm block">
          {file.name}
        </span>
        <span className="text-xs text-gray-300 block mt-1">
          {format(new Date(file.updatedAt || file.createdAt), "MMM d, yyyy")}
        </span>
      </div>

      {/* Unstar Action */}
      {showActions && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onUnstar(file.id)}
            className="p-1 rounded-full bg-red-600 bg-opacity-80 hover:bg-opacity-100 transition-colors"
            aria-label="Remove from favorites"
            title="Remove from favorites"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

function getThumbnailUrl(file: FileType): string {
  if (file.type.startsWith("image/")) {
    return `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:w-200,h-200,fo-auto/${file.path}`;
  }

  switch (file.type) {
    case "application/pdf":
      return "/icons/pdf.png";
    case "application/msword":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "/icons/doc.png";
    case "application/vnd.ms-excel":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "/icons/xls.png";
    case "application/vnd.ms-powerpoint":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return "/icons/ppt.png";
    default:
      return "/icons/file.png";
  }
}