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
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
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
        description: "Failed to restore file from trash.",
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
      const fileToDelete = files.find((f) => f.id === fileId);
      const fileName = fileToDelete?.name || "File";

      await axios.delete(`/api/files/${fileId}/delete`);
      setFiles(files => files.filter(file => file.id !== fileId));
      
      addToast({
        title: "File Permanently Deleted",
        description: `"${fileName}" has been permanently removed.`,
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
      console.error("Error deleting file permanently:", error);
      addToast({
        title: "Error",
        description: "Failed to delete file permanently.",
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
    if (files.length === 0) return;

    setEmptyingTrash(true);
    try {
      // Delete all trashed files
      const deletePromises = files.map(file => 
        axios.delete(`/api/files/${file.id}/delete`)
      );
      
      await Promise.all(deletePromises);
      setFiles([]);
      setShowEmptyTrashModal(false);
      
      addToast({
        title: "Trash Emptied",
        description: `${files.length} files have been permanently deleted.`,
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
        description: "Failed to empty trash. Some files may not have been deleted.",
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

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4">Trash</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="h-16 w-full rounded-lg bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Trash2 className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold">Trash</h2>
          <span className="text-sm text-gray-500">({files.length} items)</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {files.length > 0 && (
            <button
              onClick={() => setShowEmptyTrashModal(true)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Empty Trash
            </button>
          )}
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
          <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Trash is empty</h3>
          <p className="text-gray-500">Deleted files will appear here.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Files in trash will be automatically deleted after 30 days.
              </p>
            </div>
          </div>
          
          <div className={viewMode === "grid" ? "grid-view" : "list-view"}>
            {files.map((file) => (
              <FileItem 
                key={file.id} 
                file={file} 
                viewMode={viewMode}
                onRestore={handleRestoreFile}
                onDelete={handleDeletePermanently}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty Trash Confirmation Modal */}
      {showEmptyTrashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold">Empty Trash</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to permanently delete all {files.length} files in trash? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEmptyTrashModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                disabled={emptyingTrash}
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                disabled={emptyingTrash}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {emptyingTrash ? "Emptying..." : "Empty Trash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FileItemProps {
  file: FileType;
  viewMode: "grid" | "list";
  onRestore: (fileId: string) => void;
  onDelete: (fileId: string) => void;
}

function FileItem({ file, viewMode, onRestore, onDelete }: FileItemProps) {
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
      <div className={`
        relative 
        ${viewMode === "grid" ? "w-full h-full" : "w-10 h-10 mr-3 flex-shrink-0"}
      `}>
        <Image
          src={thumbnailUrl || '/placeholder-image.jpg'}
          alt={file.name}
          fill
          className="object-cover rounded opacity-75"
        />
        {/* Overlay to indicate trashed state */}
        <div className="absolute inset-0 bg-gray-900 bg-opacity-20 flex items-center justify-center">
          <Trash2 className="w-4 h-4 text-white opacity-70" />
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
          Deleted {format(new Date(file.updatedAt || file.createdAt), "MMM d, yyyy")}
        </span>
      </div>

      {/* Actions */}
      {(showActions || viewMode === "list") && (
        <div className={`
          absolute right-2 flex items-center space-x-1
          ${viewMode === "grid" 
            ? "top-2 opacity-0 group-hover:opacity-100 transition-opacity" 
            : "top-1/2 transform -translate-y-1/2"}
        `}>
          <button
            onClick={() => onRestore(file.id)}
            className="p-1 rounded-full bg-green-600 bg-opacity-80 hover:bg-opacity-100 transition-colors"
            aria-label="Restore file"
            title="Restore file"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => onDelete(file.id)}
            className="p-1 rounded-full bg-red-600 bg-opacity-80 hover:bg-opacity-100 transition-colors"
            aria-label="Delete permanently"
            title="Delete permanently"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

function getThumbnailUrl(file: FileType): string {
  if (file.type.startsWith('image/')) {
    return `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:w-200,h-200,fo-auto/${file.path}`;
  }
  // Return default icons for other file types
  switch (file.type) {
    case 'application/pdf':
      return '/icons/pdf.png';
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '/icons/doc.png';
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return '/icons/xls.png';
    case 'application/vnd.ms-powerpoint':
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return '/icons/ppt.png';
    default:
      return '/icons/file.png';
  }
}