"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { addToast } from "@heroui/toast";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { Grid, List, RefreshCw, X, Trash2, AlertTriangle } from "lucide-react";
import Image from "next/image";
import type { File as FileType } from "@/lib/db/schema";

interface TrashProps {
  limit?: number;
}

export default function Trash({ limit = 50 }: TrashProps) {
  const { user } = useUser();
  const userId = user?.id;

  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);
  const [emptyingTrash, setEmptyingTrash] = useState(false);

  const fetchTrashedFiles = useCallback(async () => {
    if (!userId) {
      console.warn("Trash: no userId, skipping fetch");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: allFiles } = await axios.get<FileType[]>(
        `/api/files?userId=${userId}`,
        { withCredentials: true }
      );

      // Filter to show only trashed files
      const trashedFiles = allFiles.filter(file => file.isTrashed);
      setFiles(trashedFiles.slice(0, limit));
    } catch (err) {
      console.error("Error fetching trashed files:", err);
      addToast({
        title: "Error Loading Trash",
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
    fetchTrashedFiles();
  }, [fetchTrashedFiles]);

  const handleRestoreFile = async (fileId: string) => {
    try {
      await axios.patch(`/api/files/${fileId}/restore`);
      setFiles(files => files.filter(file => file.id !== fileId));
      addToast({
        title: "File Restored",
        description: "File has been restored from trash.",
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
      console.error("Error restoring file:", error);
      addToast({
        title: "Error",
        description: "Could not restore file.",
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

  const handleDeletePermanently = async (fileId: string) => {
    try {
      await axios.delete(`/api/files/${fileId}/trash`);
      setFiles(files => files.filter(file => file.id !== fileId));
      addToast({
        title: "File Deleted",
        description: "File has been permanently deleted.",
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
      console.error("Error deleting file:", error);
      addToast({
        title: "Error",
        description: "Could not delete file.",
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

  const handleEmptyTrash = async () => {
    setEmptyingTrash(true);
    try {
      await axios.delete(`/api/files/empty-trash?userId=${userId}`);
      setFiles([]);
      setShowEmptyTrashModal(false);
      addToast({
        title: "Trash Emptied",
        description: "All files have been permanently deleted.",
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
      console.error("Error emptying trash:", error);
      addToast({
        title: "Error",
        description: "Could not empty trash.",
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
      setEmptyingTrash(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 Bytes";
    const units = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-gray-900 min-h-screen">
        <h2 className="text-lg md:text-xl font-semibold mb-4 text-white">Trash</h2>
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
          <Trash2 className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
          <h2 className="text-lg md:text-xl font-semibold text-white">Trash</h2>
          <span className="text-xs md:text-sm text-gray-400">({files.length} items)</span>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
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
          {files.length > 0 && (
            <button
              onClick={() => setShowEmptyTrashModal(true)}
              className="p-1.5 md:p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
              aria-label="Empty trash"
            >
              <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <Trash2 className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-medium text-gray-300 mb-2">Trash is Empty</h3>
          <p className="text-sm md:text-base text-gray-500">Deleted files will appear here.</p>
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
                  <span className="text-sm font-medium text-gray-300 uppercase tracking-wide">DELETED</span>
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
                    onRestore={handleRestoreFile}
                    onDelete={handleDeletePermanently}
                    formatFileSize={formatFileSize}
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
                  onRestore={handleRestoreFile}
                  onDelete={handleDeletePermanently}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty Trash Modal */}
      {showEmptyTrashModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-white">Empty Trash</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to permanently delete all files in trash? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEmptyTrashModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                disabled={emptyingTrash}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 rounded text-white transition-colors flex items-center justify-center"
              >
                {emptyingTrash ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Emptying...
                  </>
                ) : (
                  "Empty Trash"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FileListItemProps {
  file: FileType;
  onRestore: (fileId: string) => void;
  onDelete: (fileId: string) => void;
  formatFileSize: (bytes: number) => string;
}

function FileListItem({ file, onRestore, onDelete, formatFileSize }: FileListItemProps) {
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
        </div>
      </div>

      {/* Deleted column - Hidden on mobile */}
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
              onClick={() => onRestore(file.id)}
              className="p-1 md:p-1.5 rounded-full bg-green-600 hover:bg-green-700 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Restore file"
              title="Restore file"
            >
              <RefreshCw className="w-3 h-3 md:w-4 md:h-4 text-white" />
            </button>
            <button
              onClick={() => onDelete(file.id)}
              className="p-1 md:p-1.5 rounded-full bg-red-600 hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Delete permanently"
              title="Delete permanently"
            >
              <X className="w-3 h-3 md:w-4 md:h-4 text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface FileGridItemProps {
  file: FileType;
  onRestore: (fileId: string) => void;
  onDelete: (fileId: string) => void;
}

function FileGridItem({ file, onRestore, onDelete }: FileGridItemProps) {
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
        <div className="absolute top-1 md:top-2 left-1 md:left-2">
          <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
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

      {/* Actions */}
      {showActions && (
        <div className="absolute top-1 md:top-2 right-1 md:right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          <button
            onClick={() => onRestore(file.id)}
            className="p-1 md:p-1.5 rounded-full bg-green-600 bg-opacity-80 hover:bg-opacity-100 transition-colors"
            aria-label="Restore file"
            title="Restore file"
          >
            <RefreshCw className="w-3 h-3 md:w-4 md:h-4 text-white" />
          </button>
          <button
            onClick={() => onDelete(file.id)}
            className="p-1 md:p-1.5 rounded-full bg-red-600 bg-opacity-80 hover:bg-opacity-100 transition-colors"
            aria-label="Delete permanently"
            title="Delete permanently"
          >
            <X className="w-3 h-3 md:w-4 md:h-4 text-white" />
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