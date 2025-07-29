import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import FileIcon from "@/components/FileIcon";


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
    thumbnailUrl?: string;
    userId: string;
    parentId?: string;
    isFolder: boolean;
    isStarred: boolean;
    isTrashed: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export default function Topbar({ user, onSearch, files = [] }: TopbarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showResults, setShowResults] = React.useState(false);
  
  const getInitial = () => {
    if (user?.firstName) return user.firstName.charAt(0).toUpperCase();
    return "P"; // fallback
  };

  const filteredFiles = React.useMemo(() => {
    if (!searchQuery) return [];
    return files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  const handleSearchFocus = () => {
    setShowResults(true);
  };

  const handleSearchBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => setShowResults(false), 200);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="mt-5 px-4 grid grid-cols-16 gap-4" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
      {/* Search input area - 12 cols */}
      <div className="col-span-12 relative">
        <div className="relative flex-1 max-w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search in SkyVault"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className="pl-10 bg-[#1D1D1D] border-white/10 text-white placeholder-gray-400 rounded-[35px] h-12 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full"
          />
          {showResults && searchQuery && (
            <div className="absolute w-full mt-2 bg-[#1D1D1D] border border-white/10 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="p-2">
                <p className="text-sm text-gray-400 mb-2">Results</p>
                {filteredFiles.length > 0 ? (
                  <div className="space-y-2">
                    {filteredFiles.map(file => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 p-2 hover:bg-white/5 rounded cursor-pointer"
                        onClick={() => {
                          // Handle file selection
                          setShowResults(false);
                          setSearchQuery("");
                        }}
                      >
                        <FileIcon file={file} />
                        <div>
                          <p className="text-sm text-white">{file.name}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="w-24 h-24 mx-auto mb-4">
                      <img
                        src="/window.svg"
                        alt="No results"
                        className="w-full h-full"
                      />
                    </div>
                    <p className="text-gray-400">No results found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Medium button - 3 cols */}
      <div className="col-span-3 bg-[#1D1D1D] rounded-[35px] h-12"></div>
      
      {/* Small profile circle - 1 col */}
      <a href="/dashboard/profile" className="col-span-1 bg-[#1D1D1D] rounded-full h-12 w-12 flex items-center justify-center text-white font-medium">
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
  );
}