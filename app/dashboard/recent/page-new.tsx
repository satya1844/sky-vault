"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { addToast } from "@heroui/toast";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { Grid, List, Star, Trash, Download, Folder, MoreVertical } from "lucide-react";
import Image from "next/image";
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
      setImageSrc('/file.svg');
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

const getThumbnailUrl = (file: FileType): string | undefined => {
  if (file.isFolder || file.type === "folder") {
    return undefined;
  }

  if (file.type?.startsWith("image/") && file.fileUrl) {
    return file.fileUrl;
  }

  return undefined;
};

interface PageProps {
  params: Promise<{ [key: string]: string | string[] | undefined }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Recents({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const limit = resolvedSearchParams?.limit ? parseInt(resolvedSearchParams.limit as string, 10) : 20;
  return <RecentsContent limit={limit} />;
}

function RecentsContent({ limit }: { limit: number }) {
  const { user } = useUser();
  const userId = user?.id;

  const [recentFiles, setRecentFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchRecentFiles = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/recents?limit=${limit}`);
      if (response.status === 200 && Array.isArray(response.data)) {
        setRecentFiles(response.data);
      }
    } catch (error) {
      console.error("Error fetching recent files:", error);
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to load recent files",
        duration: 5000,
      });
      setRecentFiles([]);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchRecentFiles();
  }, [fetchRecentFiles]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleItemClick = useCallback((file: FileType) => {
    if (file.isFolder) {
      window.location.href = `/dashboard/files?path=${encodeURIComponent(file.path)}`;
    } else {
      window.open(file.fileUrl, '_blank');
    }
  }, []);

  const handleStarFile = async (fileId: string) => {
    try {
      const response = await axios.patch(`/api/files/${fileId}/star`);
      if (response.status === 200) {
        setRecentFiles(prev => 
          prev.map(file => 
            file.id === fileId 
              ? { ...file, isStarred: !file.isStarred }
              : file
          )
        );
        addToast({
          type: "success",
          title: "Success",
          message: response.data.isStarred ? "File starred" : "File unstarred",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error starring file:", error);
      addToast({
        type: "error",
        title: "Error", 
        message: "Failed to star file",
        duration: 5000,
      });
    }
  };

  const handleTrashFile = async (fileId: string) => {
    try {
      const response = await axios.patch(`/api/files/${fileId}/trash`);
      if (response.status === 200) {
        setRecentFiles(prev => prev.filter(file => file.id !== fileId));
        addToast({
          type: "success",
          title: "Success",
          message: "File moved to trash",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error moving file to trash:", error);
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to move file to trash",
        duration: 5000,
      });
    }
  };

  const handleDownloadFile = async (file: FileType) => {
    try {
      const link = document.createElement('a');
      link.href = file.fileUrl;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addToast({
        type: "success",
        title: "Success",
        message: "File download started",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to download file",
        duration: 5000,
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-background min-h-screen">
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
    <div className="p-4 md:p-6 bg-background min-h-screen">
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
          >
            <Grid className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 md:p-2 rounded ${viewMode === "list" ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"} transition-colors`}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
          {recentFiles.map(file => (
            <FileGridItem
              key={file.id}
              file={file}
              onStar={handleStarFile}
              onTrash={handleTrashFile}
              onDownload={handleDownloadFile}
              onItemClick={handleItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileGridItemProps {
  file: FileType;
  onStar: (fileId: string) => void;
  onTrash: (fileId: string) => void;
  onDownload: (file: FileType) => void;
  onItemClick: (file: FileType) => void;
}

function FileGridItem({ file, onStar, onTrash, onDownload, onItemClick }: FileGridItemProps) {
  const [showActions, setShowActions] = useState(false);
  const thumbnailUrl = getThumbnailUrl(file);

  return (
    <div
      className="group relative aspect-square rounded-lg md:rounded-xl overflow-hidden bg-gray-800 hover:bg-gray-750 transition-all duration-200 cursor-pointer"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onItemClick(file)}
    >
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
        {file.isStarred && (
          <div className="absolute top-1 md:top-2 left-1 md:left-2">
            <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
        <span className="font-medium truncate text-white text-xs md:text-sm block">
          {file.name}
        </span>
        <span className="text-[10px] md:text-xs text-gray-300 block mt-0.5 md:mt-1">
          {format(new Date(file.updatedAt || file.createdAt), "MMM d, yyyy")}
        </span>
      </div>

      {showActions && (
        <div className="hidden md:flex absolute top-1 md:top-2 right-1 md:right-2 opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStar(file.id);
            }}
            className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          >
            <Star className={`w-3.5 h-3.5 ${file.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-600'}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTrash(file.id);
            }}
            className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          >
            <Trash className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
