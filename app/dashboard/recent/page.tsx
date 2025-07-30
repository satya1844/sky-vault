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
    if (bytes === 0) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="h-40 w-full rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h2>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 rounded-l-lg border border-gray-300 dark:border-gray-600 transition-colors ${
            viewMode === "grid" 
              ? "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white" 
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <Grid className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`p-2 rounded-r-lg border border-l-0 border-gray-300 dark:border-gray-600 transition-colors ${
            viewMode === "list" 
              ? "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white" 
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <List className="w-5 h-5" />
        </button>
      </div>

      {viewMode === "list" ? (
        <div className="bg-background rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-background border-b border-white/10">
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
            {recentFiles.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic">
                No recent files found.
              </div>
            ) : (
              recentFiles.map((file) => {
                const thumbnailUrl = getThumbnailUrl(file);
                return (
                  <div
                    key={file.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-750 transition-colors group"
                  >
                    {/* Name column with icon and star */}
                    <div className="col-span-6 flex items-center space-x-3 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 relative">
                        {thumbnailUrl ? (
                          <Image
                            src={thumbnailUrl}
                            alt={file.name}
                            width={32}
                            height={32}
                            className="rounded object-cover"
                            onError={(e) => {
                              console.error('Error loading image:', e);
                              e.currentTarget.src = '/placeholder-image.jpg';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center">
                            <div className="text-gray-400">
                              {file.isFolder ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="text-white font-medium truncate">{file.name}</span>
                        {file.isStarred && (
                          <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 fill-current" />
                        )}
                      </div>
                    </div>

                    {/* Modified column */}
                    <div className="col-span-3 flex items-center">
                      <span className="text-gray-400 text-sm">
                        {format(new Date(file.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>

                    {/* Size column */}
                    <div className="col-span-2 flex items-center">
                      <span className="text-gray-400 text-sm">
                        {file.isFolder ? '--' : file.size ? formatFileSize(file.size) : '--'}
                      </span>
                    </div>

                    {/* Actions column */}
                    <div className="col-span-1 flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStarFile(file.id);
                        }}
                        className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                        title={file.isStarred ? "Remove from starred" : "Add to starred"}
                      >
                        <Star className={`w-4 h-4 ${file.isStarred ? "text-yellow-400 fill-current" : "text-gray-400"}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(file);
                        }}
                        className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrashFile(file.id);
                        }}
                        className="p-1 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                        title="Move to trash"
                      >
                        <Trash className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recentFiles.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 italic py-8">
              No recent files found.
            </div>
          ) : (
            recentFiles.map((file) => {
              const thumbnailUrl = getThumbnailUrl(file);
              return (
                <div
                  key={file.id}
                  className="group relative rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 aspect-square hover:scale-[1.02] bg-white dark:bg-gray-800"
                >
                  {/* Thumbnail or placeholder */}
                  <div className="relative w-full h-full" style={{ paddingBottom: '100%' }}>
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={file.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.error('Error loading image:', e);
                          e.currentTarget.src = '/placeholder-image.jpg';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-background dark:bg-background flex items-center justify-center">
                        <div className="text-gray-200 dark:text-gray-300">
                          {file.isFolder ? (
                            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                          ) : (
                            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Blur overlay for grid view */}
                    <div className="absolute inset-0 bg-black/15 backdrop-blur-[0.5px] group-hover:bg-black/5 group-hover:backdrop-blur-[0.25px] transition-all duration-300"></div>
                  </div>

                  {/* Star indicator for starred files */}
                  {file.isStarred && (
                    <div className="absolute top-2 left-2 z-10">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStarFile(file.id);
                      }}
                      className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                      title={file.isStarred ? "Remove from starred" : "Add to starred"}
                    >
                      <Star className={`w-3.5 h-3.5 ${file.isStarred ? "text-yellow-500 fill-current" : "text-gray-600 dark:text-gray-300"}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrashFile(file.id);
                      }}
                      className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                      title="Move to trash"
                    >
                      <Trash className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file);
                      }}
                      className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>

                  {/* For grid view, put info at bottom overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-[#1d1d1d]/95 backdrop-blur-sm text-gray-900 dark:text-white space-y-1 z-10 border-t border-gray-200/50 dark:border-gray-700/50">
                    <h3 className="font-medium text-sm truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(file.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}