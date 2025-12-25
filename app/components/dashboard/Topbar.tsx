'use client';

import * as React from "react";
import { Search, Menu, X, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import FileIcon from "@/components/FileIcon";
import { cn } from "@/lib/utils";
import { IconMenu2 } from "@tabler/icons-react";

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

const ActionsButton = ({
  children,
  className,
  onClick,
  variant = "default",
}: {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "mobile";
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-white rounded-[35px] border border-neutral-100 dark:bg-black dark:border-white/[0.2] hover:border-neutral-200 group/btn overflow-hidden relative flex items-center justify-center transition-all duration-200",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-200%] before:animate-shimmer hover:before:translate-x-[200%]",
        variant === "default" ? "h-12 px-6" : "h-10 px-4 text-sm",
        className
      )}
    >
      <div className="absolute inset-0 dark:bg-dot-white/[0.1] bg-dot-black/[0.1]" />
      <div className="relative z-40 text-white font-medium">{children}</div>
    </button>
  );
};

export default function Topbar({ user, onSearch, files = [], onSidebarToggle }: TopbarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showResults, setShowResults] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Handle clicks outside search results
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle escape key to close search results
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowResults(false);
        searchInputRef.current?.blur();
      }
    };
    
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, []);
    
    const getInitial = () => {
    if (user?.firstName) return user.firstName.charAt(0).toUpperCase();
    return "P"; // fallback
  };

  const filteredFiles = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    return files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      setShowResults(true);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Show results immediately when typing
    if (value.trim()) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
    
    onSearch?.(value);
  };

  const handleResultClick = (file: any) => {
    setShowResults(false);
    setSearchQuery("");
    // You can add additional logic here for handling file selection
    console.log("Selected file:", file);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowResults(false);
    searchInputRef.current?.focus();
  };

  const SearchResults = ({ className = "" }: { className?: string }) => (
    showResults && (
      <div className={cn("absolute w-full mt-2 bg-[#1D1D1D] border border-white/10 rounded-lg shadow-lg overflow-hidden z-[200]", className)}>
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Results</p>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {filteredFiles.length > 0 ? (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filteredFiles.slice(0, 10).map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer transition-colors"
                  onClick={() => handleResultClick(file)}
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
    )
  );

  return (
    <div className="w-full ">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="px-6 py-2 flex items-center justify-between gap-4">
          {/* Search Bar - Takes up most of the space */}
          <div className="flex-1 max-w-2xl relative" ref={searchRef}>
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search in SkyVault"
              value={searchQuery}
              onChange={handleSearch}
              onFocus={handleSearchFocus}
              className="pl-12 bg-[#1D1D1D] border-white/10 text-white placeholder-gray-400 rounded-[35px] h-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <SearchResults />
          </div>

          {/* Actions and Profile - Fixed width */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <ActionsButton onClick={() => setShowDropdown((prev) => !prev)}>
                Actions
              </ActionsButton>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-[#1D1D1D] border border-white/10 rounded-xl shadow-lg z-50">
                  <ul className="py-2 text-sm text-white">
                    <li
                      onClick={() => {
                        setShowDropdown(false);
                        console.log("AI Generator Clicked");
                      }}
                      className="px-4 py-2 hover:bg-white/10 cursor-pointer"
                    >
                      ✨ AI Actions
                    </li>
                    <li
                      onClick={() => {
                        setShowDropdown(false);
                        console.log("Create Folder");
                      }}
                      className="px-4 py-2 hover:bg-white/10 cursor-pointer"
                    >
                      📁 Create Folder
                    </li>
                    <li
                      onClick={() => {
                        setShowDropdown(false);
                        console.log("Upload File");
                      }}
                      className="px-4 py-2 hover:bg-white/10 cursor-pointer"
                    >
                      📤 Upload File
                    </li>
                  </ul>
                </div>
              )}
            </div>
            
            <a
              href="/dashboard/profile"
              className="bg-[#1D1D1D] rounded-full h-10 w-10 flex items-center justify-center text-white font-medium"
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="User Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                getInitial()
              )}
            </a>
          </div>
        </div>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:block lg:hidden">
        <div className="px-4 py-2 flex items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="flex-1 max-w-lg relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search in SkyVault"
              value={searchQuery}
              onChange={handleSearch}
              onFocus={handleSearchFocus}
              className="pl-10 bg-[#1D1D1D] border-white/10 text-white placeholder-gray-400 rounded-[35px] h-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <SearchResults />
          </div>

          {/* Actions and Profile */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              <ActionsButton 
                onClick={() => setShowDropdown((prev) => !prev)}
                variant="mobile"
              >
                Actions
              </ActionsButton>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1D1D1D] border border-white/10 rounded-xl shadow-lg z-50">
                  <ul className="py-2 text-sm text-white">
                    <li
                      onClick={() => {
                        setShowDropdown(false);
                        console.log("AI Generator Clicked");
                      }}
                      className="px-3 py-2 hover:bg-white/10 cursor-pointer"
                    >
                      ✨ AI Actions
                    </li>
                    <li
                      onClick={() => {
                        setShowDropdown(false);
                        console.log("Create Folder");
                      }}
                      className="px-3 py-2 hover:bg-white/10 cursor-pointer"
                    >
                      📁 Create Folder
                    </li>
                    <li
                      onClick={() => {
                        setShowDropdown(false);
                        console.log("Upload File");
                      }}
                      className="px-3 py-2 hover:bg-white/10 cursor-pointer"
                    >
                      📤 Upload File
                    </li>
                  </ul>
                </div>
              )}
            </div>
            
            <a
              href="/dashboard/profile"
              className="bg-[#1D1D1D] rounded-full h-10 w-10 flex items-center justify-center text-white font-medium"
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="User Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                getInitial()
              )}
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Horizontal like the reference image */}
      <div className="md:hidden w-full">
        <div className="px-4 py-2 flex items-center justify-between gap-2 w-full flex-nowrap overflow-x-hidden">
          {/* Sidebar Toggle Button - Only show if onSidebarToggle is provided */}
          {onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              title="Open menu"
            >
              <IconMenu2 className="w-5 h-5" />
            </button>
          )}

          {/* Search Bar - Takes most space */}
          <div className="flex-1 min-w-0 relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearch}
              onFocus={handleSearchFocus}
              className="pl-10 bg-[#1D1D1D] border-white/10 text-white placeholder-gray-400 rounded-[35px] h-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <SearchResults />
          </div>

          {/* Add Person Icon - Like the reference image */}
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            title="Add user or invite"
          >
            <UserPlus className="w-5 h-5" />
          </button>
          
          {/* User Avatar - Like the reference image */}
          <a
            href="/dashboard/profile"
            className="bg-blue-600 rounded-full h-10 w-10 flex items-center justify-center text-white font-medium"
          >
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="User Avatar"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              getInitial()
            )}
          </a>
        </div>

        {/* Dropdown for mobile actions */}
        {showDropdown && (
          <div className="md:hidden px-4 pb-3">
            <div className="bg-[#1D1D1D] border border-white/10 rounded-xl shadow-lg">
              <ul className="py-2 text-sm text-white">
                <li
                  onClick={() => {
                    setShowDropdown(false);
                    console.log("Invite User");
                  }}
                  className="px-4 py-3 hover:bg-white/10 cursor-pointer"
                >
                  👤 Invite User
                </li>
                <li
                  onClick={() => {
                    setShowDropdown(false);
                    console.log("AI Generator Clicked");
                  }}
                  className="px-4 py-3 hover:bg-white/10 cursor-pointer"
                >
                  ✨ AI Actions
                </li>
                <li
                  onClick={() => {
                    setShowDropdown(false);
                    console.log("Create Folder");
                  }}
                  className="px-4 py-3 hover:bg-white/10 cursor-pointer"
                >
                  📁 Create Folder
                </li>
                <li
                  onClick={() => {
                    setShowDropdown(false);
                    console.log("Upload File");
                  }}
                  className="px-4 py-3 hover:bg-white/10 cursor-pointer"
                >
                  📤 Upload File
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}