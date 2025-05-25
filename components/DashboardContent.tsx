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

export default function DashboardContent({
  userId,
  userName,
}: DashboardContentProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<string>("files");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  // Set the active tab based on URL parameter
  useEffect(() => {
    if (tabParam === "profile") {
      setActiveTab("profile");
    } else {
      setActiveTab("files");
    }
  }, [tabParam]);

  const handleFileUploadSuccess = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleFolderChange = useCallback((folderId: string | null) => {
    setCurrentFolder(folderId);
  }, []);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-foreground">
          Hello, <span className="text-primary">{userName?.length > 10 ? `${userName?.substring(0, 10)}...` : userName?.split(" ")[0] || "there"}</span>!
        </h2>
        <p className=" text-lg text-yellow-500 mt-2">Your images are waiting for you.</p>
      </div>

      <div className="w-full">
        <div className="flex gap-4 mb-6">
          <button
            className={`px-4 py-2 font-semibold rounded-t-lg focus:outline-none transition border-b-2 ${activeTab === "files" ? "text-primary border-primary" : "text-gray-400 border-transparent"}`}
            onClick={() => setActiveTab("files")}
          >
            <span className="flex items-center gap-2"><FileText className="h-5 w-5" /> My Files</span>
          </button>
          <button
            className={`px-4 py-2 font-semibold rounded-t-lg focus:outline-none transition border-b-2 ${activeTab === "profile" ? "text-primary border-primary" : "text-gray-400 border-transparent"}`}
            onClick={() => setActiveTab("profile")}
          >
            <span className="flex items-center gap-2"><User className="h-5 w-5" /> Profile</span>
          </button>
        </div>

        {activeTab === "files" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Upload Card */}
            <div className="lg:col-span-1 flex flex-col h-full">
              <div className="card min-h-[400px] flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <FileUp className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Upload</h2>
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
              <div className="card min-h-[400px] flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Your Files</h2>
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
          <div className="card mt-8 max-w-xl mx-auto">
            <UserProfile />
          </div>
        )}
      </div>
    </>
  );
}