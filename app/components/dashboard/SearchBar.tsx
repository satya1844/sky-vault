'use client';

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import FileIcon from "@/components/FileIcon";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onFocus: () => void;
  onClear: () => void;
  showResults: boolean;
  filteredFiles: Array<{
    id: string;
    name: string;
    type: string;
    path: string;
    size: number;
    fileUrl: string;
    thumbnailUrl: string | null;
    userId: string;
    parentId: string | null;
    isFolder: boolean;
    isStarred: boolean;
    isTrashed: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  onResultClick: (file: any) => void;
  variant?: "desktop" | "tablet" | "mobile";
  inputRef?: React.RefObject<HTMLInputElement> | React.MutableRefObject<HTMLInputElement | null>;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  onFocus,
  onClear,
  showResults,
  filteredFiles,
  onResultClick,
  variant = "desktop",
  inputRef,
}: SearchBarProps) {
  // Styling based on variant
  const searchIconSize = variant === "mobile" ? "w-4 h-4" : "w-4 h-4";
  const searchIconLeft = variant === "mobile" ? "left-3" : variant === "tablet" ? "left-3" : "left-4";
  const inputPadding = variant === "mobile" ? "pl-10" : variant === "tablet" ? "pl-10" : "pl-12";
  const clearButtonRight = variant === "mobile" ? "right-3" : variant === "tablet" ? "right-3" : "right-4";
  const placeholder = variant === "mobile" ? "Search" : "Search in SkyVault";

  return (
    <div className="relative">
      <Search className={cn("absolute top-1/2 transform -translate-y-1/2 text-gray-400", searchIconSize, searchIconLeft)} />
      <Input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={onFocus}
        className={cn(
          inputPadding,
          "bg-[#1D1D1D] border-white/10 text-white placeholder-gray-400 rounded-[35px] h-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full"
        )}
      />
      {searchQuery && (
        <button
          onClick={onClear}
          className={cn(
            "absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors",
            clearButtonRight
          )}
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute w-full mt-2 bg-[#1D1D1D] border border-white/10 rounded-lg shadow-lg overflow-hidden z-[200]">
          <div className="p-2">
            {/* Header with clear button */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Results</p>
              {searchQuery && (
                <button
                  onClick={onClear}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Results list or empty state */}
            {filteredFiles.length > 0 ? (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredFiles.slice(0, 10).map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer transition-colors"
                    onClick={() => onResultClick(file)}
                  >
                    <FileIcon file={file} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {filteredFiles.length > 10 && (
                  <div className="p-2 text-center">
                    <p className="text-xs text-gray-400">
                      Showing 10 of {filteredFiles.length} results
                    </p>
                  </div>
                )}
              </div>
            ) : searchQuery.trim() ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 opacity-50">
                  <Search className="w-full h-full text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">No results found for "{searchQuery}"</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
