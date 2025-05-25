"use client";

import { File, Star, Trash } from "lucide-react";
import type { File as FileType } from "@/lib/db/schema";

interface FileTabsProps {
  activeTab: string;
  onTabChange: (key: string) => void;
  files: FileType[];
  starredCount: number;
  trashCount: number;
}

export default function FileTabs({
  activeTab,
  onTabChange,
  files,
  starredCount,
  trashCount,
}: FileTabsProps) {
  return (
    <div className="flex items-center gap-4 border-b border-[#2d2f36] mb-4">
      {/* All Files Tab */}
      <button
        className={`flex items-center gap-2 px-2 pb-2 font-semibold border-b-2 transition-all duration-150 ${
          activeTab === "all"
            ? "text-primary border-primary"
            : "text-gray-400 border-transparent hover:text-primary/80"
        }`}
        onClick={() => onTabChange("all")}
      >
        <File className="h-5 w-5" />
        <span>All Files</span>
        <span className="ml-1 bg-[#23272f] text-xs rounded px-2 py-0.5 font-bold text-primary border border-primary/30">
          {files.filter((file) => !file.isTrashed).length}
        </span>
      </button>
      {/* Starred Tab */}
      <button
        className={`flex items-center gap-2 px-2 pb-2 font-semibold border-b-2 transition-all duration-150 ${
          activeTab === "starred"
            ? "text-yellow-500 border-yellow-500"
            : "text-gray-400 border-transparent hover:text-yellow-500/80"
        }`}
        onClick={() => onTabChange("starred")}
      >
        <Star className="h-5 w-5" />
        <span>Starred</span>
        <span className="ml-1 bg-[#23272f] text-xs rounded px-2 py-0.5 font-bold text-yellow-500 border border-yellow-500/30">
          {starredCount}
        </span>
      </button>
      {/* Trash Tab */}
      <button
        className={`flex items-center gap-2 px-2 pb-2 font-semibold border-b-2 transition-all duration-150 ${
          activeTab === "trash"
            ? "text-pink-500 border-pink-500"
            : "text-gray-400 border-transparent hover:text-pink-500/80"
        }`}
        onClick={() => onTabChange("trash")}
      >
        <Trash className="h-5 w-5" />
        <span>Trash</span>
        <span className="ml-1 bg-[#23272f] text-xs rounded px-2 py-0.5 font-bold text-pink-500 border border-pink-500/30">
          {trashCount}
        </span>
      </button>
    </div>
  );
}