"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { addToast } from "@heroui/toast";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { Grid, List, Star, Trash, Download } from "lucide-react";
import Image from "next/image";
import type { File as FileType } from "@/lib/db/schema";

interface RecentsProps {
  limit?: number;
}

export default function Recents({ limit = 20 }: RecentsProps) {
  const { user } = useUser();
  const userId = user?.id;

  const [recentFiles, setRecentFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchRecentFiles = useCallback(async () => {
    if (!userId) {
      console.warn("Recents: no userId, skipping fetch");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: allFiles } = await axios.get<FileType[]>(
        `/api/files?userId=${userId}`,
        { withCredentials: true }
      );
      const recentItems = allFiles
        .filter((f) => !f.isTrashed)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, limit);

      setRecentFiles(recentItems);
    } catch (err) {
      console.error("Error fetching recent files:", err);
      addToast({
        title: "Error Loading Recent Files",
        description: "Please try again later.",
        color: "danger",
        classNames: {
          base: `
            custom-toast-width
            bg-zinc-900
            text-white
            px-4
            py-3
            border
            border-zinc-700
            shadow-xl
            flex
            items-start
            gap-3
          `,
          closeButton: `
            hover:bg-white/10
            transition
            p-1
            rounded
            ml-auto
          `,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchRecentFiles();
  }, [fetchRecentFiles]);

  const getThumbnailUrl = (file: FileType): string | undefined => {
    if (file.type.startsWith("image/") && file.path) {
      return `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:w-200,h-200,fo-auto,q-80/${file.path}`;
    }

    // Return file type specific icons
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
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 Bytes";
    const units = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
  };

  const handleStarFile = async (fileId: string) => {
    try {
      await axios.patch(`/api/files/${fileId}/star`, { isStarred: true });
      setRecentFiles(files => 
        files.map(file => 
          file.id === fileId 
            ? { ...file, isStarred: true }
            : file
        )
      );
      addToast({
        title: "File Starred",
        description: "File has been added to favorites.",
        color: "success",
        classNames: {
          base: `
            custom-toast-width
            bg-zinc-900
            text-white
            px-4
            py-3
            border
            border-zinc-700
            shadow-xl
            flex
            items-start
            gap-3
          `,
          closeButton: `
            hover:bg-white/10
            transition
            p-1
            rounded
            ml-auto
          `,
        },
      });
    } catch (error) {
      console.error("Error starring file:", error);
      addToast({
        title: "Error",
        description: "Could not star file.",
        color: "danger",
        classNames: {
          base: `
            custom-toast-width
            bg-zinc-900
            text-white
            px-4
            py-3
            border
            border-zinc-700
            shadow-xl
            flex
            items-start
            gap-3
          `,
          closeButton: `
            hover:bg-white/10
            transition
            p-1
            rounded
            ml-auto
          `,
        },
      });
    }
  };

  const handleTrashFile = async (fileId: string) => {
    try {
      await axios.patch(`/api/files/${fileId}/trash`, { isTrashed: true });
      setRecentFiles(files => files.filter(file => file.id !== fileId));
      addToast({
        title: "File Moved to Trash",
        description: "File has been moved to trash.",
        color: "success",
        classNames: {
          base: `
            custom-toast-width
            bg-zinc-900
            text-white
            px-4
            py-3
            border
            border-zinc-700
            shadow-xl
            flex
            items-start
            gap-3
          `,
          closeButton: `
            hover:bg-white/10
            transition
            p-1
            rounded
            ml-auto
          `,
        },
      });
    } catch (error) {
      console.error("Error trashing file:", error);
      addToast({
        title: "Error",
        description: "Could not move file to trash.",
        color: "danger",
        classNames: {
          base: `
            custom-toast-width
            bg-zinc-900
            text-white
            px-4
            py-3
            border
            border-zinc-700
            shadow-xl
            flex
            items-start
            gap-3
          `,
          closeButton: `
            hover:bg-white/10
            transition
            p-1
            rounded
            ml-auto
          `,
        },
      });
    }
  };

  const handleDownloadFile = async (file: FileType) => {
    try {
      addToast({
        title: "Preparing Download",
        description: `Getting "${file.name}" ready for download...`,
        color: "primary",
        classNames: {
          base: `
            custom-toast-width
            bg-zinc-900
            text-white
            px-4
            py-3
            border
            border-zinc-700
            shadow-xl
            flex
            items-start
            gap-3
          `,
          closeButton: `
            hover:bg-white/10
            transition
            p-1
            rounded
            ml-auto
          `,
        },
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
        classNames: {
          base: `
            custom-toast-width
            bg-zinc-900
            text-white
            px-4
            py-3
            border
            border-zinc-700
            shadow-xl
            flex
            items-start
            gap-3
          `,
          closeButton: `
            hover:bg-white/10
            transition
            p-1
            rounded
            ml-auto
          `,
        },
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      addToast({
        title: "Download Failed",
        description: "We couldn't download the file. Please try again later.",
        color: "danger",
        classNames: {
          base: `
            custom-toast-width
            bg-zinc-900
            text-white
            px-4
            py-3
            border
            border-zinc-700
            shadow-xl
            flex
            items-start
            gap-3
          `,
          closeButton: `
            hover:bg-white/10
            transition
            p-1
            rounded
            ml-auto
          `,
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-gray-900 min-h-screen">
        <h2 className="text-lg md:text-xl font-semibold mb-4 text-white">Recent Files</h2>
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
    <div className="p-4 md:p-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs md:text-sm font-bold">R</span>
          </div>
          <h2 className="text-lg md:text-xl font-semibold text-white">Recent Files</h2>
          <span className="text-xs md:text-sm text-gray-400">({recentFiles.length} items)</span>
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

      {recentFiles.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
            <span className="text-white text-lg md:text-xl font-bold">R</span>
          </div>
          <h3 className="text-base md:text-lg font-medium text-gray-300 mb-2">No Recent Files</h3>
          <p className="text-sm md:text-base text-gray-500">Upload some files to see them here.</p>
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
                {recentFiles.map(file => (
                  <FileListItem
                    key={file.id}
                    file={file}
                    onStar={handleStarFile}
                    onTrash={handleTrashFile}
                    onDownload={handleDownloadFile}
                    formatFileSize={formatFileSize}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
              {recentFiles.map(file => (
                <FileGridItem
                  key={file.id}
                  file={file}
                  onStar={handleStarFile}
                  onTrash={handleTrashFile}
                  onDownload={handleDownloadFile}
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
  onStar: (fileId: string) => void;
  onTrash: (fileId: string) => void;
  onDownload: (file: FileType) => void;
  formatFileSize: (bytes: number) => string;
}

function FileListItem({ file, onStar, onTrash, onDownload, formatFileSize }: FileListItemProps) {
  const [showActions, setShowActions] = useState(false);
  const thumbnailUrl = getThumbnailUrl(file);

  return (
    <div
      className="grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-4 py-2 md:py-3 hover:bg-gray-750 transition-colors group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Name column with icon */}
      <div className="col-span-8 md:col-span-6 flex items-center space-x-2 md:space-x-3 min-w-0">
        <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 relative">
          <Image
            src={thumbnailUrl || '/placeholder-image.jpg'}
            alt={file.name}
            width={32}
            height={32}
            className="rounded object-cover"
          />
        </div>
        <div className="flex items-center space-x-1 md:space-x-2 min-w-0 flex-1">
          <span className="text-white font-medium truncate text-sm md:text-base">{file.name}</span>
          {file.isStarred && (
            <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 flex-shrink-0 fill-current" />
          )}
        </div>
      </div>

      {/* Modified column - Hidden on mobile */}
      <div className="hidden md:flex col-span-3 items-center">
        <span className="text-gray-400 text-sm">
          {format(new Date(file.updatedAt || file.createdAt), "MMM d, yyyy")}
        </span>
      </div>

      {/* Size column - Hidden on mobile */}
      <div className="hidden md:flex col-span-2 items-center">
        <span className="text-gray-400 text-sm">
          {file.size ? formatFileSize(file.size) : '--'}
        </span>
      </div>

      {/* Actions column */}
      <div className="col-span-4 md:col-span-1 flex items-center justify-end space-x-1 md:space-x-2">
        {showActions && (
          <>
            <button
              onClick={() => onDownload(file)}
              className="p-1 md:p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Download file"
              title="Download file"
            >
              <Download className="w-3 h-3 md:w-4 md:h-4 text-white" />
            </button>
            <button
              onClick={() => onStar(file.id)}
              className="p-1 md:p-1.5 rounded-full bg-yellow-600 hover:bg-yellow-700 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Star file"
              title="Star file"
            >
              <Star className="w-3 h-3 md:w-4 md:h-4 text-white" />
            </button>
            <button
              onClick={() => onTrash(file.id)}
              className="p-1 md:p-1.5 rounded-full bg-red-600 hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Move to trash"
              title="Move to trash"
            >
              <Trash className="w-3 h-3 md:w-4 md:h-4 text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface FileGridItemProps {
  file: FileType;
  onStar: (fileId: string) => void;
  onTrash: (fileId: string) => void;
  onDownload: (file: FileType) => void;
}

function FileGridItem({ file, onStar, onTrash, onDownload }: FileGridItemProps) {
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
        <Image
          src={thumbnailUrl || '/placeholder-image.jpg'}
          alt={file.name}
          fill
          className="object-cover opacity-75"
        />
        {file.isStarred && (
          <div className="absolute top-1 md:top-2 left-1 md:left-2">
            <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
          </div>
        )}
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

      {/* Actions */}
      {showActions && (
        <div className="absolute top-1 md:top-2 right-1 md:right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          <button
            onClick={() => onDownload(file)}
            className="p-1 md:p-1.5 rounded-full bg-blue-600 bg-opacity-80 hover:bg-opacity-100 transition-colors"
            aria-label="Download file"
            title="Download file"
          >
            <Download className="w-3 h-3 md:w-4 md:h-4 text-white" />
          </button>
          <button
            onClick={() => onStar(file.id)}
            className="p-1 md:p-1.5 rounded-full bg-yellow-600 bg-opacity-80 hover:bg-opacity-100 transition-colors"
            aria-label="Star file"
            title="Star file"
          >
            <Star className="w-3 h-3 md:w-4 md:h-4 text-white" />
          </button>
          <button
            onClick={() => onTrash(file.id)}
            className="p-1 md:p-1.5 rounded-full bg-red-600 bg-opacity-80 hover:bg-opacity-100 transition-colors"
            aria-label="Move to trash"
            title="Move to trash"
          >
            <Trash className="w-3 h-3 md:w-4 md:h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}