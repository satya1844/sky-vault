"use client";

import { useState, useCallback, useEffect } from "react";
import { FileUp, FileText, User } from "lucide-react";
import FileUploadForm from "@/components/FileUploadForm";
import FileList from "@/components/FileList";
import UserProfile from "@/components/UserProfile";
import { useSearchParams } from "next/navigation";

interface DashboardContentProps {
  userId: string;
  userName: string;
}

export default function DashboardContent({ userId, userName }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState<"files" | "profile">("files");
  const [currentFolder, setCurrentFolder] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleFileUploadSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleFolderChange = useCallback((folderPath: string) => {
    setCurrentFolder(folderPath);
  }, []);

  const displayName = userName
    ? userName.length > 10
      ? `${userName.split(' ')[0]}${userName.split(' ')[0].length > 10 ? '...' : ''}`
      : userName.split(' ')[0]
    : 'there';

  return (
    <div className="min-h-screen p-6">
      <div className="mb-10">
        <h2 className="text-4xl font-bold text-foreground font-gothic">
          Hello, <span className="text-primary font-orbitron">{displayName}</span>!
        </h2>
        <p className="text-lg text-secondary-foreground mt-2 font-sans">Your images are waiting for you.</p>
      </div>
      <div className="w-full">
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            className={`px-4 py-2 font-orbitron rounded-t-lg focus:outline-none transition border-b-2 ${
              activeTab === "files"
                ? "text-foreground border-primary bg-secondary"
                : "text-secondary-foreground border-transparent hover:text-foreground hover:bg-secondary"
            }`}
            onClick={() => setActiveTab("files")}
            role="tab"
            aria-selected={activeTab === "files"}
            aria-controls="files-panel"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" aria-hidden="true" /> My Files
            </span>
          </button>
          <button
            className={`px-4 py-2 font-orbitron rounded-t-lg focus:outline-none transition border-b-2 ${
              activeTab === "profile"
                ? "text-foreground border-primary bg-secondary"
                : "text-secondary-foreground border-transparent hover:text-foreground hover:bg-secondary"
            }`}
            onClick={() => setActiveTab("profile")}
            role="tab"
            aria-selected={activeTab === "profile"}
            aria-controls="profile-panel"
          >
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" aria-hidden="true" /> Profile
            </span>
          </button>
        </div>
        {activeTab === "files" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {/* Upload Card */}
            <div className="lg:col-span-1 flex flex-col h-full">
              <div className="card min-h-[400px] flex flex-col h-full bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <FileUp className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground font-gothic">Upload</h2>
                </div>
                <FileUploadForm
                  userId={userId}
                  onUploadSuccess={handleFileUploadSuccess}
                  currentFolder={currentFolder}
                />
              </div>
            </div>
            {/* Files Card */}
            <div className="lg:col-span-2 flex flex-col h-full">
              <div className="card min-h-[400px] flex flex-col h-full bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground font-gothic">Your Files</h2>
                </div>
                <FileList
                  userId={userId}
                  refreshTrigger={refreshTrigger}
                  onFolderChange={handleFolderChange}
                />
              </div>
            </div>
          </div>
        )}
        {activeTab === "profile" && (
          <div className="card mt-8 max-w-xl mx-auto bg-card border border-border rounded-xl p-6 shadow-sm">
            <UserProfile />
          </div>
        )}
      </div>
    </div>
  );
}
