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
    return undefined;
  };

  const handleStarFile = async (fileId: string) => {
    try {
      await axios.patch(`/api/files/${fileId}/star`);
      setRecentFiles(files =>
        files.map(file =>
          file.id === fileId ? { ...file, isStarred: !file.isStarred } : file
        )
      );
      addToast({
        title: "File Updated",
        description: "File star status has been updated.",
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
        description: "Failed to update file star status.",
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
      await axios.patch(`/api/files/${fileId}/trash`);
      setRecentFiles(files => files.filter(file => file.id !== fileId));
      addToast({
        title: "File Trashed",
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
        description: "Failed to move file to trash.",
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
      const response = await axios.get(`/api/files/${file.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
      addToast({
        title: "Error",
        description: "Failed to download file.",
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
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="h-40 w-full rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 ${viewMode === "grid" ? "bg-gray-300" : ""}`}
        >
          <Grid className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`p-2 ${viewMode === "list" ? "bg-gray-300" : ""}`}
        >
          <List className="w-5 h-5" />
        </button>
      </div>
      <div
        className={`grid ${
          viewMode === "grid"
            ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            : "grid-cols-1 gap-2"
        }`}
      >
        {recentFiles.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 italic py-8">
            No recent files found.
          </div>
        ) : (
          recentFiles.map((file) => {
            const thumbnailUrl = getThumbnailUrl(file);
            return (
              <div
                key={file.id}
                className={`group relative rounded-2xl shadow hover:shadow-xl transition overflow-hidden ${
                  viewMode === "grid"
                    ? "aspect-square hover:scale-105"
                    : "flex gap-4 p-4 items-center bg-white dark:bg-gray-800"
                }`}
              >
                {/* Thumbnail or placeholder */}
                <div
                  className={`relative ${
                    viewMode === "grid" ? "w-full h-full" : "w-24 h-24 rounded-lg overflow-hidden"
                  }`}
                  style={viewMode === "grid" ? { paddingBottom: '100%' } : {}}
                >
                  <Image
                    src={thumbnailUrl || '/placeholder-image.jpg'}
                    alt={file.name}
                    fill={viewMode === "grid"}
                    width={viewMode === "list" ? 96 : undefined}
                    height={viewMode === "list" ? 96 : undefined}
                    className="object-cover"
                    onError={(e) => {
                      console.error('Error loading image:', e);
                      e.currentTarget.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>

                {/* Info for list view */}
                {viewMode === "list" && (
                  <div className="flex flex-col flex-grow">
                    <span className="text-base font-semibold">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(file.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className={`absolute ${viewMode === "grid" ? "top-2 right-2" : "right-4"} flex gap-2`}>
                  <button
                    onClick={() => handleStarFile(file.id)}
                    className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <Star className={`w-4 h-4 ${file.isStarred ? "text-yellow-400 fill-yellow-400" : "text-white"}`} />
                  </button>
                  <button
                    onClick={() => handleTrashFile(file.id)}
                    className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <Trash className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => handleDownloadFile(file)}
                    className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* For grid view, put date at bottom overlay like before */}
                {viewMode === "grid" && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                    <div className="text-xs text-white truncate">{file.name}</div>
                    <div className="text-xs text-gray-200">
                      {format(new Date(file.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}