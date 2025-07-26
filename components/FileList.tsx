"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Folder, Star, Trash, X, ExternalLink, StarIcon, EyeClosed, Search, Filter, Grid, List } from "lucide-react";
import { Card } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { addToast } from "@heroui/toast";
import Image from "next/image";

import { formatDistanceToNow, format } from "date-fns";
import type { File as FileType } from "@/lib/db/schema";
import axios from "axios";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import FileEmptyState from "@/components/FileEmptyState";
import FileIcon from "@/components/FileIcon";
import FileLoadingState from "@/components/FileLoadingState";
import FileTabs from "@/components/FileTabs";
import FolderNavigation from "@/components/FolderNavigation";

interface FileListProps {
  userId: string;
  refreshTrigger?: number;
  onFolderChange?: (folderId: string | null) => void;
  onDeleteSuccess?: () => void;
}

export default function FileList({
  userId,
  refreshTrigger = 0,
  onFolderChange,
}: FileListProps) {
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [emptyTrashModalOpen, setEmptyTrashModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/files?userId=${userId}`;
      if (currentFolder) {
        url += `&parentId=${currentFolder}`;
      }

      const response = await axios.get(url);
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching files:", error);
      addToast({
        title: "Error Loading Files",
        description: "We couldn't load your files. Please try again later.",
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
  }, [userId, currentFolder]);

  // Fetch files when userId, refreshTrigger, or currentFolder changes
  useEffect(() => {
    fetchFiles();
  }, [userId, refreshTrigger, currentFolder, fetchFiles]);

  // Filter files based on active tab and search query
  const filteredFiles = useMemo(() => {
    let filtered = files;

    // Filter by tab
    switch (activeTab) {
      case "starred":
        filtered = filtered.filter((file) => file.isStarred && !file.isTrashed);
        break;
      case "trash":
        filtered = filtered.filter((file) => file.isTrashed);
        break;
      case "all":
      default:
        filtered = filtered.filter((file) => !file.isTrashed);
        break;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [files, activeTab, searchQuery]);

  // Count files in trash
  const trashCount = useMemo(() => {
    return files.filter((file) => file.isTrashed).length;
  }, [files]);

  // Count starred files
  const starredCount = useMemo(() => {
    return files.filter((file) => file.isStarred && !file.isTrashed).length;
  }, [files]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 Bytes";
    const units = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
  };

  // Get thumbnail URL for images
  const getThumbnailUrl = (file: FileType): string | undefined => {
    if (file.type.startsWith("image/") && file.path) {
      return `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:w-200,h-200,fo-auto,q-80/${file.path}`;
    }
    return undefined;
  };

  const handleStarFile = async (fileId: string) => {
    try {
      await axios.patch(`/api/files/${fileId}/star`);

      // Update local state
      setFiles(
        files.map((file) =>
          file.id === fileId ? { ...file, isStarred: !file.isStarred } : file
        )
      );

      // Show toast
      const file = files.find((f) => f.id === fileId);
      addToast({
  title: file?.isStarred ? "Removed from Starred" : "Added to Starred",
  description: `"${file?.name}" has been ${file?.isStarred ? "removed from" : "added to"} your starred files.`,
  color: file?.isStarred ? "warning" : "success",
  variant: "bordered",
  radius: "lg",
  timeout: 5000,
  shouldShowTimeoutProgress: true,
  icon: file?.isStarred ? (
    <StarIcon className="w-5 h-5 text-yellow-400" />
  ) : (
    <StarIcon className="w-5 h-5 text-green-400" />
  ),
  closeIcon: <EyeClosed className="w-4 h-4 text-gray-300 hover:text-white transition" />,
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
        title: "Action Failed",
        description: "We couldn't update the star status. Please try again.",
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
      const response = await axios.patch(`/api/files/${fileId}/trash`);
      const responseData = response.data;

      // Update local state
      setFiles(
        files.map((file) =>
          file.id === fileId ? { ...file, isTrashed: !file.isTrashed } : file
        )
      );
      const file = files.find((f) => f.id === fileId);

      // Show toast
      addToast({
        title: responseData.isTrashed ? "Moved to Trash" : "Restored from Trash",
        description: `"${file?.name}" has been ${responseData.isTrashed ? "moved to trash" : "restored"}`,
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
        title: "Action Failed",
        description: "We couldn't update the file status. Please try again.",
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

  const handleDeleteFile = async (fileId: string) => {
    try {
      const fileToDelete = files.find((f) => f.id === fileId);
      const fileName = fileToDelete?.name || "File";

      const response = await axios.delete(`/api/files/${fileId}/delete`);

      if (response.data.success) {
        addToast({
          title: "File Permanently Deleted",
          description: `"${fileName}" has been permanently removed`,
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

        setDeleteModalOpen(false);
      } else {
        throw new Error(response.data.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      addToast({
        title: "Deletion Failed",
        description: "We couldn't delete the file. Please try again later.",
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
    try {
      await axios.delete(`/api/files/empty-trash`);

      // Remove all trashed files from local state
      setFiles(files.filter((file) => !file.isTrashed));

      // Show toast
      addToast({
        title: "Trash Emptied",
        description: `All ${trashCount} items have been permanently deleted`,
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

      // Close modal
      setEmptyTrashModalOpen(false);
    } catch (error) {
      console.error("Error emptying trash:", error);
      addToast({
        title: "Action Failed",
        description: "We couldn't empty the trash. Please try again later.",
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

  // Add this function to handle file downloads
  const handleDownloadFile = async (file: FileType) => {
    try {
      // Show loading toast
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

      // For images, we can use the ImageKit URL directly with optimized settings
      if (file.type.startsWith("image/")) {
        // Create a download-optimized URL with ImageKit
        // Using high quality and original dimensions for downloads
        const downloadUrl = `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:q-100,orig-true/${file.path}`;

        // Fetch the image first to ensure it's available
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }

        // Get the blob data
        const blob = await response.blob();

        // Create a download link
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = file.name;
        document.body.appendChild(link);

        // Remove loading toast and show success toast
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

        // Trigger download
        link.click();

        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } else {
        // For other file types, use the fileUrl directly
        const response = await fetch(file.fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }

        // Get the blob data
        const blob = await response.blob();

        // Create a download link
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = file.name;
        document.body.appendChild(link);

        // Remove loading toast and show success toast
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

        // Trigger download
        link.click();

        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }
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

  // Function to open image in a new tab with optimized view
  const openImageViewer = (file: FileType) => {
    if (file.type.startsWith("image/")) {
      // Create an optimized URL with ImageKit transformations for viewing
      // Using higher quality and responsive sizing for better viewing experience
      const optimizedUrl = `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:q-90,w-1600,h-1200,fo-auto/${file.path}`;
      window.open(optimizedUrl, "_blank");
    }
  };

  // Navigate to a folder
  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolder(folderId);
    setFolderPath([...folderPath, { id: folderId, name: folderName }]);

    // Notify parent component about folder change
    if (onFolderChange) {
      onFolderChange(folderId);
    }
  };

  // Navigate back to parent folder
  const navigateUp = () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      const newFolderId =
        newPath.length > 0 ? newPath[newPath.length - 1].id : null;
      setCurrentFolder(newFolderId);

      // Notify parent component about folder change
      if (onFolderChange) {
        onFolderChange(newFolderId);
      }
    }
  };

  // Navigate to specific folder in path
  const navigateToPathFolder = (index: number) => {
    if (index < 0) {
      setCurrentFolder(null);
      setFolderPath([]);

      // Notify parent component about folder change
      if (onFolderChange) {
        onFolderChange(null);
      }
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      const newFolderId = newPath[newPath.length - 1].id;
      setCurrentFolder(newFolderId);

      // Notify parent component about folder change
      if (onFolderChange) {
        onFolderChange(newFolderId);
      }
    }
  };

  // Handle file or folder click
  const handleItemClick = (file: FileType) => {
    if (file.isFolder) {
      navigateToFolder(file.id, file.name);
    } else if (file.type.startsWith("image/")) {
      openImageViewer(file);
    }
  };

  if (loading) {
    return <FileLoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Tabs for filtering files */}
      <FileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        files={files}
        starredCount={starredCount}
        trashCount={trashCount}
      />

      {/* Folder navigation */}
      {activeTab === "all" && (
        <div className="mb-4">
          <FolderNavigation
            folderPath={folderPath}
            navigateUp={navigateUp}
            navigateToPathFolder={navigateToPathFolder}
          />
        </div>
      )}

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
        

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("grid")}
            className={`${viewMode === "grid" ? "bg-gray-700" : ""} text-white`}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("list")}
            className={`${viewMode === "list" ? "bg-gray-700" : ""} text-white`}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Empty Trash Button for Trash Tab */}
      {activeTab === "trash" && trashCount > 0 && (
        <div className="flex justify-end">
          <Button
            color="danger"
            variant="flat"
            onClick={() => setEmptyTrashModalOpen(true)}
            className="text-white"
          >
            Empty Trash ({trashCount})
          </Button>
        </div>
      )}

      {/* Files Grid/List */}
      {filteredFiles.length === 0 ? (
        <FileEmptyState activeTab={activeTab} />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map((file) => {
            const thumbnailUrl = getThumbnailUrl(file);
            
            return (
              <Card
                key={file.id}
                className={`group relative aspect-square rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden cursor-pointer ${
                  file.isFolder || file.type.startsWith("image/") ? "cursor-pointer" : ""
                }`}
                onClick={() => handleItemClick(file)}
              >
                {/* Background Image with Uniform Blur */}
                <div className="absolute inset-0">
                  {thumbnailUrl ? (
                    <Image
                      src={thumbnailUrl}
                      alt={file.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                      <FileIcon file={file} />
                    </div>
                  )}
                  {/* Uniform blur overlay for better text readability */}
                  <div className="absolute inset-0 bg-black/15 backdrop-blur-[0.5px] group-hover:bg-black/5 group-hover:backdrop-blur-[0.25px] transition-all duration-300"></div>
                </div>

                {/* File/Folder Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-white w-full space-y-2">
                    <button 
                      className="font-semibold text-base text-white truncate w-full text-left hover:text-gray-200 transition-colors"
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
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
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
                          <span>{formatFileSize(file.size)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Actions */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  {!file.isFolder && (
                    <Tooltip content="Download">
                      <button
                        className="p-2 bg-black/50 backdrop-blur-md rounded-full shadow-lg hover:bg-black/70 transition-colors border border-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(file);
                        }}
                        aria-label={`Download ${file.name}`}
                      >
                        <ExternalLink className="w-4 h-4 text-white" />
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip content={file.isStarred ? "Remove from starred" : "Add to starred"}>
                    <button
                      className="p-2 bg-black/50 backdrop-blur-md rounded-full shadow-lg hover:bg-black/70 transition-colors border border-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStarFile(file.id);
                      }}
                      aria-label={file.isStarred ? "Remove from starred" : "Add to starred"}
                    >
                      <Star 
                        className={`w-4 h-4 ${file.isStarred ? 'text-yellow-400 fill-current' : 'text-white'}`} 
                      />
                    </button>
                  </Tooltip>
                  <Tooltip content={file.isTrashed ? "Restore" : "Move to trash"}>
                    <button
                      className="p-2 bg-black/50 backdrop-blur-md rounded-full shadow-lg hover:bg-black/70 transition-colors border border-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrashFile(file.id);
                      }}
                      aria-label={file.isTrashed ? "Restore" : "Move to trash"}
                    >
                      <Trash className="w-4 h-4 text-white" />
                    </button>
                  </Tooltip>
                </div>

                {/* Star indicator for starred files */}
                {file.isStarred && (
                  <div className="absolute top-3 left-3">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="space-y-2">
          {filteredFiles.map((file) => {
            const thumbnailUrl = getThumbnailUrl(file);
            
            return (
              <Card
                key={file.id}
                className={`group relative p-4 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-800/50 transition-all duration-200 cursor-pointer ${
                  file.isFolder || file.type.startsWith("image/") ? "cursor-pointer" : ""
                }`}
                onClick={() => handleItemClick(file)}
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail/Icon */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={file.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <FileIcon file={file} />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white truncate" title={file.name}>
                        {file.name}
                      </h3>
                      {file.isStarred && (
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                      <span>{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</span>
                      {!file.isFolder && (
                        <>
                          <span>•</span>
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            file.type.includes('pdf') ? 'bg-red-500/20 text-red-400' :
                            file.type.includes('png') ? 'bg-green-500/20 text-green-400' :
                            file.type.includes('jpeg') || file.type.includes('jpg') ? 'bg-yellow-500/20 text-yellow-400' :
                            file.type.includes('gif') ? 'bg-purple-500/20 text-purple-400' :
                            file.type.includes('webp') ? 'bg-blue-500/20 text-blue-400' :
                            'bg-white/10 text-white/70'
                          }`}>
                            {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!file.isFolder && (
                      <Tooltip content="Download">
                        <button
                          className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadFile(file);
                          }}
                          aria-label={`Download ${file.name}`}
                        >
                          <ExternalLink className="w-4 h-4 text-white" />
                        </button>
                      </Tooltip>
                    )}
                    <Tooltip content={file.isStarred ? "Remove from starred" : "Add to starred"}>
                      <button
                        className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStarFile(file.id);
                        }}
                        aria-label={file.isStarred ? "Remove from starred" : "Add to starred"}
                      >
                        <Star 
                          className={`w-4 h-4 ${file.isStarred ? 'text-yellow-400 fill-current' : 'text-white'}`} 
                        />
                      </button>
                    </Tooltip>
                    <Tooltip content={file.isTrashed ? "Restore" : "Move to trash"}>
                      <button
                        className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrashFile(file.id);
                        }}
                        aria-label={file.isTrashed ? "Restore" : "Move to trash"}
                      >
                        <Trash className="w-4 h-4 text-white" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Confirm Permanent Deletion"
        description={`Are you sure you want to permanently delete this file?`}
        icon={X}
        iconColor="text-danger"
        confirmText="Delete Permanently"
        confirmColor="danger"
        onConfirm={() => {
          if (selectedFile) {
            handleDeleteFile(selectedFile.id);
          }
        }}
        isDangerous={true}
        warningMessage={`You are about to permanently delete "${selectedFile?.name}". This file will be permanently removed from your account and cannot be recovered.`}
      />

      {/* Empty trash confirmation modal */}
      <ConfirmationModal
        isOpen={emptyTrashModalOpen}
        onOpenChange={setEmptyTrashModalOpen}
        title="Empty Trash"
        description={`Are you sure you want to empty the trash?`}
        icon={Trash}
        iconColor="text-danger"
        confirmText="Empty Trash"
        confirmColor="danger"
        onConfirm={handleEmptyTrash}
        isDangerous={true}
        warningMessage={`You are about to permanently delete all ${trashCount} items in your trash. These files will be permanently removed from your account and cannot be recovered.`}
      />
    </div>
  );
}