'use client';

import * as React from "react";
import { IconMenu2 } from "@tabler/icons-react";
import SearchBar from "./SearchBar";
import UserAvatar from "./UserAvatar";

interface TopbarProps {
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string;
  };
  onSearch?: (query: string) => void;
  files?: Array<{
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
  onSidebarToggle?: () => void;
}

export default function Topbar({ user, onSearch, files = [], onSidebarToggle }: TopbarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showResults, setShowResults] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close search on Escape key
  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowResults(false);
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, []);

  const filteredFiles = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    return files.filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [files, searchQuery]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setShowResults(!!value.trim());
    onSearch?.(value);
  };

  const handleResultClick = (file: any) => {
    setShowResults(false);
    setSearchQuery("");
    console.log("Selected file:", file);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowResults(false);
  };

  return (
    <div className="w-full">
      {/* Desktop Layout */}
      <div className="hidden lg:block px-6 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-2xl" ref={searchRef}>
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={handleSearch}
              onFocus={() => searchQuery.trim() && setShowResults(true)}
              onClear={clearSearch}
              showResults={showResults}
              filteredFiles={filteredFiles}
              onResultClick={handleResultClick}
              variant="desktop"
              inputRef={searchInputRef}
            />
          </div>
          <UserAvatar user={user} variant="desktop" />
        </div>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:block lg:hidden px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 max-w-lg" ref={searchRef}>
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={handleSearch}
              onFocus={() => searchQuery.trim() && setShowResults(true)}
              onClear={clearSearch}
              showResults={showResults}
              filteredFiles={filteredFiles}
              onResultClick={handleResultClick}
              variant="tablet"
              inputRef={searchInputRef}
            />
          </div>
          <UserAvatar user={user} variant="desktop" />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="px-4 py-2 flex items-center gap-2">
          {onSidebarToggle && (
            <button onClick={onSidebarToggle} className="p-2 text-white hover:bg-white/10 rounded-full">
              <IconMenu2 className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0" ref={searchRef}>
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={handleSearch}
              onFocus={() => searchQuery.trim() && setShowResults(true)}
              onClear={clearSearch}
              showResults={showResults}
              filteredFiles={filteredFiles}
              onResultClick={handleResultClick}
              variant="mobile"
              inputRef={searchInputRef}
            />
          </div>
          <UserAvatar user={user} variant="mobile" />
        </div>
      </div>
    </div>
  );
}
