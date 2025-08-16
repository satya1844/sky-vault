"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Folder, Star, Trash, X, ExternalLink, StarIcon, EyeClosed, Filter, Grid, List, MoreVertical, Edit } from "lucide-react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { addToast } from "@heroui/toast";
import Image from "next/image";
import React from "react";
import { formatDistanceToNow, format } from "date-fns";
import type { File as FileType } from "@/lib/db/schema";
import axios from "axios";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import * as Dialog from "@radix-ui/react-dialog";
import FileEmptyState from "@/components/FileEmptyState";
import FileIcon from "@/components/FileIcon";
import FileLoadingState from "@/components/FileLoadingState";
import FileTabs from "@/components/FileTabs";
import FolderNavigation from "@/components/FolderNavigation";

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

interface FileListProps {
  userId: string;
  refreshTrigger?: number;
  onFolderChange?: (folderId: string | null, folderPath: Array<{ id: string; name: string }>) => void;
  onDeleteSuccess?: () => void;
  // Add these new props to handle external operations
  externalRefreshTrigger?: number;
}

export default function FileList({
  userId,
  refreshTrigger = 0,
  onFolderChange,
  externalRefreshTrigger = 0,
}: FileListProps) {

  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([]);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [emptyTrashModalOpen, setEmptyTrashModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  // Rename handler
  const handleRenameFile = async () => {
    if (!selectedFile || !renameValue.trim()) return;
    
    const trimmedName = renameValue.trim();
    
    // Validate name
    if (trimmedName === selectedFile.name) {
      setRenameModalOpen(false);
      setSelectedFile(null);
      setRenameValue("");
      return;
    }
    
    if (trimmedName.length === 0) {
      addToast({
        title: "Invalid Name",
        description: "File name cannot be empty.",
        color: "danger",
        classNames: toastClassNames
      });
      return;
    }
    
    if (trimmedName.length > 255) {
      addToast({
        title: "Name Too Long",
        description: "File name must be less than 255 characters.",
        color: "danger",
        classNames: toastClassNames
      });
      return;
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      addToast({
        title: "Invalid Characters",
        description: "File name cannot contain: < > : \" / \\ | ? *",
        color: "danger",
        classNames: toastClassNames
      });
      return;
    }
    
    try {
      const response = await axios.patch(`/api/files/${selectedFile.id}/rename`, { name: trimmedName });
      const updated = response.data;
      
      // Update local state
      setFiles(files.map(f => f.id === selectedFile.id ? { ...f, name: updated.name } : f));
      
      // Show success toast
      addToast({
        title: "File Renamed",
        description: `Successfully renamed to "${updated.name}"`,
        color: "success",
        classNames: toastClassNames
      });
      
      // Close modal and reset
      setRenameModalOpen(false);
      setSelectedFile(null);
      setRenameValue("");
    } catch (error: any) {
      console.error("Error renaming file:", error);
      const errorMessage = error.response?.data?.error || "Could not rename file. Please try again.";
      addToast({
        title: "Rename Failed",
        description: errorMessage,
        color: "danger",
        classNames: toastClassNames
      });
    }
  };

  // Handle Enter key in rename input
  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameFile();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setRenameModalOpen(false);
      setSelectedFile(null);
      setRenameValue("");
    }
  };
  const [activeMobileMenuId, setActiveMobileMenuId] = useState<string | null>(null);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/files?userId=${userId}`;
      if (currentFolder) {
        url += `&parentId=${currentFolder}`;
      }

      console.log('Fetching files from:', url, 'Current folder:', currentFolder);

      const response = await axios.get(url);
      console.log('Files response:', response.data);
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching files:", error);
      const errorMessage = error instanceof Error ? error.message : "We couldn't load your files";
      addToast({
        title: "Error Loading Files",
        description: `${errorMessage}. Please try again later.`,
        color: "danger",
        classNames: toastClassNames
      });
    } finally {
      setLoading(false);
    }
  }, [userId, currentFolder]);

  // Fetch files when userId, refreshTrigger, currentFolder, or externalRefreshTrigger changes
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles, externalRefreshTrigger]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMobileMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Common toast styles
  const toastClassNames = {
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
  };

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

    return filtered;
  }, [files, activeTab]);

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

  // Navigate to a folder
  const navigateToFolder = useCallback((folderId: string, folderName: string) => {
    console.log('Navigating to folder:', folderId, folderName);
    const newPath = [...folderPath, { id: folderId, name: folderName }];
    setCurrentFolder(folderId);
    setFolderPath(newPath);

    // Notify parent component about folder change with the new path
    if (onFolderChange) {
      onFolderChange(folderId, newPath);
    }
  }, [folderPath, onFolderChange]);

  // Navigate back to parent folder (from FolderNavigation component)
  const navigateUp = useCallback(() => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      const newFolderId = newPath.length > 0 ? newPath[newPath.length - 1].id : null;
      setCurrentFolder(newFolderId);

      console.log('Navigating up to:', newFolderId);

      // Notify parent component about folder change
      if (onFolderChange) {
        onFolderChange(newFolderId, newPath);
      }
    }
  }, [folderPath, onFolderChange]);

  // Navigate to specific folder in path (from FolderNavigation component)
  const navigateToPathFolder = useCallback((index: number) => {
    if (index < 0) {
      // Navigate to root
      setCurrentFolder(null);
      setFolderPath([]);
      console.log('Navigating to root');

      // Notify parent component about folder change
      if (onFolderChange) {
        onFolderChange(null, []);
      }
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      const newFolderId = newPath[newPath.length - 1].id;
      setCurrentFolder(newFolderId);

      console.log('Navigating to path folder:', newFolderId);

      // Notify parent component about folder change
      if (onFolderChange) {
        onFolderChange(newFolderId, newPath);
      }
    }
  }, [folderPath, onFolderChange]);

  // Handle file or folder click
  const handleItemClick = (file: FileType) => {
    console.log('FileList: Item clicked:', file.name, 'isFolder:', file.isFolder, 'type:', file.type);
    console.log('FileList: File object:', file);
    
    if (file.isFolder) {
      console.log('FileList: Navigating to folder...');
      // Navigate to the clicked folder
      navigateToFolder(file.id, file.name);
    } else if (file.type.startsWith("image/")) {
      console.log('FileList: Opening image viewer...');
      openImageViewer(file);
    } else {
      console.log('FileList: Non-image file clicked, no action taken');
    }
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
        await fetchFiles(); // Refresh the list
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

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Loading...</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
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
    <div className="bg-background min-h-screen">
      {/* Header Section */}
      <div className="border-b border-gray-200 bg-[#020108] sticky top-0 z-10">
        <div className="px-6 py-4">
          {/* Tabs for filtering files */}
          <div className="flex space-x-1 dark:bg-[#1D1D1D] rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-100 hover:text-gray-400"
                }`}
            >
              All files
            </button>
            <button
              onClick={() => setActiveTab("starred")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "starred"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-100 hover:text-gray-400"
                }`}
            >
              Starred ({starredCount})
            </button>
            <button
              onClick={() => setActiveTab("trash")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "trash"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-100 hover:text-gray-400"
                }`}
            >
              Trash ({trashCount})
            </button>
          </div>

          {/* Folder navigation */}
          {activeTab === "all" && (
            <div className="mt-4">
              <FolderNavigation
                folderPath={folderPath}
                navigateUp={navigateUp}
                navigateToPathFolder={navigateToPathFolder}
              />
            </div>
          )}

          {/* Search and View Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`${viewMode === "grid" ? "bg-gray-100" : ""} text-gray-700 hover:bg-gray-100 rounded-lg`}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`${viewMode === "list" ? "bg-gray-100" : ""} text-gray-700 hover:bg-gray-100 rounded-lg`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Empty Trash Button for Trash Tab */}
          {activeTab === "trash" && trashCount > 0 && (
            <div className="flex justify-end mt-4">
              <Button
                color="danger"
                variant="flat"
                onClick={() => setEmptyTrashModalOpen(true)}
                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 rounded-lg"
              >
                Empty trash ({trashCount})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Files Grid/List */}
        {filteredFiles.length === 0 ? (
          <FileEmptyState activeTab={activeTab} />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => {
              const thumbnailUrl = getThumbnailUrl(file);

              return (
                <div
                  key={file.id}
                  className="group relative aspect-square rounded-2xl border border-white/10 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden cursor-pointer bg-gray-800"
                  onClick={(e) => {
                    console.log('DIV clicked for file:', file.name);
                    console.log('Event target:', e.target);
                    console.log('Event current target:', e.currentTarget);
                    handleItemClick(file);
                  }}
                >
                  {/* Background image or icon */}
                  <div className="absolute inset-0">
                    {file.isFolder || file.type === "folder" ? (
                      <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                        <Folder className="w-12 h-12 text-blue-500" />
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
                        <FileIcon file={file} />
                      </div>
                    )}

                    {/* Uniform blur overlay */}
                    <div className="absolute inset-0 bg-black/15 backdrop-blur-[0.5px] group-hover:bg-black/5 group-hover:backdrop-blur-[0.25px] transition-all duration-300 pointer-events-none"></div>
                  </div>

                  {/* Hover actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                    {/* Desktop hover actions */}
                    <div className="hidden md:flex gap-1">
                      {!file.isFolder && (
                        <Tooltip content="Download">
                          <button
                            className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors pointer-events-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(file);
                            }}
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                        </Tooltip>
                      )}
                      <Tooltip content="Rename">
                        <button
                          className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors pointer-events-auto"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedFile(file);
                            setRenameValue(file.name);
                            setRenameModalOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </Tooltip>
                      <Tooltip content={file.isStarred ? "Remove from starred" : "Add to starred"}>
                        <button
                          className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors pointer-events-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStarFile(file.id);
                          }}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${file.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-600'}`}
                          />
                        </button>
                      </Tooltip>
                      <Tooltip content={file.isTrashed ? "Restore" : "Move to trash"}>
                        <button
                          className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors pointer-events-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrashFile(file.id);
                          }}
                        >
                          <Trash className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </Tooltip>
                      {activeTab === "trash" && (
                        <Tooltip content="Delete permanently">
                          <button
                            className="p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors pointer-events-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(file);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <X className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* Mobile actions button - always visible on mobile */}
                  <div className="md:hidden absolute top-2 right-2 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMobileMenuId(activeMobileMenuId === file.id ? null : file.id);
                      }}
                      className="p-1.5 bg-black/50 rounded-full backdrop-blur-sm border border-white/20"
                      aria-label="More actions"
                    >
                      <MoreVertical className="w-3 h-3 text-white" />
                    </button>
                  </div>

                  {/* Mobile actions menu */}
                  {activeMobileMenuId === file.id && (
                    <div className="md:hidden absolute top-10 right-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30 min-w-[120px]">
                      {!file.isFolder && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadFile(file);
                            setActiveMobileMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      )}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedFile(file);
                          setRenameValue(file.name);
                          setRenameModalOpen(true);
                          setActiveMobileMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStarFile(file.id);
                          setActiveMobileMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Star className={`w-4 h-4 ${file.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                        <span>{file.isStarred ? 'Unstar' : 'Star'}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrashFile(file.id);
                          setActiveMobileMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Trash className="w-4 h-4" />
                        <span>{file.isTrashed ? 'Restore' : 'Move to trash'}</span>
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedFile(file);
                          setRenameValue(file.name);
                          setRenameModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Rename</span>
                      </button>
                      {activeTab === "trash" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(file);
                            setDeleteModalOpen(true);
                            setActiveMobileMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Delete permanently</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Star icon on top left */}
                  {file.isStarred && (
                    <div className="absolute top-2 left-2 z-10 pointer-events-none">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    </div>
                  )}

                  {/* Bottom Meta Info Card */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-[#1d1d1d] bg-opacity-95 text-white space-y-1 z-10 pointer-events-none">
                    <h3
                      className="font-medium text-sm truncate"
                      title={file.name}
                    >
                      {file.name}
                    </h3>
                    <div className="text-xs text-gray-400">
                      {format(new Date(file.createdAt), "MMM d, yyyy")}
                    </div>
                    {/* {!file.isFolder && file.size && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${file.type.includes('pdf') ? 'bg-red-500/20 text-red-400' :
                            file.type.includes('png') ? 'bg-green-500/20 text-green-400' :
                              file.type.includes('jpeg') || file.type.includes('jpg') ? 'bg-yellow-500/20 text-yellow-400' :
                                file.type.includes('gif') ? 'bg-purple-500/20 text-purple-400' :
                                  file.type.includes('webp') ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-white/10 text-white/70'
                          }`}>
                          {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    )} */}
                  </div>
                </div>

              );
            })}
          </div>
        ) : (
          // List View - Dropbox style
          <div className=" rounded-lg  overflow-hidden text-white">
            {/* Table Header */}
            <div className="bg-[#1d1d1d] border-b border-white/10 px-4 py-3">
              <div className="flex items-center text-xs font-medium text-white uppercase tracking-wider">
                <div className="flex-1">Name</div>
                <div className="w-32 text-right">Modified</div>
                <div className="w-24 text-right">Size</div>
                <div className="w-16"></div>
              </div>
            </div>

            {/* File List */}
            <div className="divide-y divide-white/10">
              {filteredFiles.map((file) => {
                const thumbnailUrl = getThumbnailUrl(file);

                return (
                  <div
                    key={file.id}
                    className="group flex items-center px-4 py-3 hover:border hover:border-white/80 cursor-pointer transition-colors"
                    onClick={(e) => {
                      console.log('List item clicked for file:', file.name);
                      e.preventDefault();
                      e.stopPropagation();
                      handleItemClick(file);
                    }}
                  >
                    {/* File Icon/Thumbnail and Name */}
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-8 h-8 rounded flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden bg-gray-100">
                        {file.isFolder || file.type === "folder" ? (
                          <Folder className="w-6 h-6 text-blue-500" />
                        ) : thumbnailUrl ? (
                          <SafeImage
                            src={thumbnailUrl}
                            alt={file.name}
                            width={32}
                            height={32}
                            className="object-cover w-full h-full rounded"
                          />
                        ) : (
                          <FileIcon file={file} />
                        )}
                      </div>

                      <div className="flex items-center min-w-0 flex-1">
                        <span className="font-medium text-white truncate" title={file.name}>
                          {file.name}
                        </span>
                        {file.isStarred && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Modified Date */}
                    <div className="w-32 text-right text-sm text-gray-500">
                      {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                    </div>

                    {/* File Size */}
                    <div className="w-24 text-right text-sm text-gray-500">
                      {!file.isFolder && file.size ? formatFileSize(file.size) : "--"}
                    </div>

                    {/* Actions */}
                    <div className="w-16 flex items-center justify-end">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        {!file.isFolder && (
                          <Tooltip content="Download">
                            <button
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadFile(file);
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        )}
                        <Tooltip content="Rename">
                          <button
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(file);
                              setRenameValue(file.name);
                              setRenameModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content={file.isStarred ? "Remove from starred" : "Add to starred"}>
                          <button
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStarFile(file.id);
                            }}
                          >
                            <Star
                              className={`w-4 h-4 ${file.isStarred ? 'text-yellow-500 fill-current' : ''}`}
                            />
                          </button>
                        </Tooltip>
                        <Tooltip content={file.isTrashed ? "Restore" : "Move to trash"}>
                          <button
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTrashFile(file.id);
                            }}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        {/* Permanent Delete Button for Trash Tab */}
                        {activeTab === "trash" && (
                          <Tooltip content="Delete permanently">
                            <button
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(file);
                                setDeleteModalOpen(true);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete permanently?"
        description={`"${selectedFile?.name}" will be permanently deleted. You can't undo this action.`}
        icon={X}
        iconColor="text-red-500"
        confirmText="Delete permanently"
        confirmColor="danger"
        onConfirm={() => {
          if (selectedFile) {
            handleDeleteFile(selectedFile.id);
          }
        }}
        isDangerous={true}
        warningMessage={`You are about to permanently delete "${selectedFile?.name}". This file will be permanently removed from your account and cannot be recovered.`}
      />

      {/* Rename Modal */}
      <Dialog.Root open={renameModalOpen} onOpenChange={setRenameModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 w-full max-w-md border border-zinc-700">
            <Dialog.Title className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Rename {selectedFile?.isFolder ? 'Folder' : 'File'}
            </Dialog.Title>
            <Dialog.Description className="mb-4 text-gray-600 dark:text-gray-400">
              Enter a new name for "{selectedFile?.name}".
            </Dialog.Description>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                placeholder="Enter new name"
                autoFocus
                maxLength={255}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="flat" 
                onClick={() => {
                  setRenameModalOpen(false);
                  setSelectedFile(null);
                  setRenameValue("");
                }}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button 
                color="primary" 
                onClick={handleRenameFile}
                disabled={!renameValue.trim() || renameValue.trim() === selectedFile?.name}
                className="px-4 py-2"
              >
                Rename
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Empty trash confirmation modal */}
      <ConfirmationModal
        isOpen={emptyTrashModalOpen}
        onOpenChange={setEmptyTrashModalOpen}
        title="Empty trash?"
        description={`All ${trashCount} items in your trash will be permanently deleted. You can't undo this action.`}
        icon={Trash}
        iconColor="text-red-500"
        confirmText="Empty trash"
        confirmColor="danger"
        onConfirm={handleEmptyTrash}
        isDangerous={true}
        warningMessage={`You are about to permanently delete all ${trashCount} items in your trash. These files will be permanently removed from your account and cannot be recovered.`}
      />
    </div>
  );
}