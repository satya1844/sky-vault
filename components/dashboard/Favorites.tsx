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

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4">Favorites</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, idx) => (
            <div key={idx} className="h-16 w-full rounded-lg bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Star className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-semibold">Favorites</h2>
          <span className="text-sm text-gray-500">({files.length} items)</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${viewMode === "grid" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
            aria-label="Grid view"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${viewMode === "list" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Favorites Yet</h3>
          <p className="text-gray-500">Star your important files to access them quickly here.</p>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid-view" : "list-view"}>
          {files.map(file => (
            <FileItem
              key={file.id}
              file={file}
              viewMode={viewMode}
              onUnstar={handleUnstar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileItemProps {
  file: FileType;
  viewMode: "grid" | "list";
  onUnstar: (fileId: string) => void;
}

function FileItem({ file, viewMode, onUnstar }: FileItemProps) {
  const [showActions, setShowActions] = useState(false);
  const thumbnailUrl = getThumbnailUrl(file);

  return (
    <div
      className={`
        group relative rounded-lg overflow-hidden transition-all duration-200
        ${viewMode === "grid" 
          ? "aspect-square hover:shadow-lg" 
          : "flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800"}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Thumbnail */}
      <div className={`${viewMode === "grid" ? "w-full h-full" : "w-10 h-10 mr-3 flex-shrink-0"} relative`}>
        <Image
          src={thumbnailUrl || '/placeholder-image.jpg'}
          alt={file.name}
          fill
          className="object-cover rounded opacity-75"
        />
        <div className="absolute top-1 left-1">
          <Star className="w-4 h-4 text-yellow-400" />
        </div>
      </div>

      {/* File Info */}
      <div className={`
        flex flex-col justify-center
        ${viewMode === "grid" ? "absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent" : "flex-grow"}
      `}>
        <span className={`font-medium truncate ${viewMode === "grid" ? "text-white" : "text-gray-800 dark:text-white"}`}>
          {file.name}
        </span>
        <span className={`text-xs ${viewMode === "grid" ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}`}>
          Starred {format(new Date(file.updatedAt || file.createdAt), "MMM d, yyyy")}
        </span>
      </div>

      {/* Unstar Action */}
      {(showActions || viewMode === "list") && (
        <div className={`
          absolute right-2 flex items-center space-x-1
          ${viewMode === "grid" 
            ? "top-2 opacity-0 group-hover:opacity-100 transition-opacity" 
            : "top-1/2 transform -translate-y-1/2"}
        `}>
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
