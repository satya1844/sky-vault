"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Recents from "@/components/dashboard/recents";
import FileList from "@/components/FileList";
import Topbar from "./dashboard/Topbar";
import QuickActions from "./dashboard/QuickActions";

type User = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
  username?: string | null;
  emailAddress?: string;
};

interface DashboardProps {
  user?: User;
}

const DashboardContent: React.FC<DashboardProps> = ({ user }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [fileListRefreshTrigger, setFileListRefreshTrigger] = useState(0);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState<Array<{ id: string; name: string }>>([]);

  // Callback to handle folder navigation
  const handleFolderChange = useCallback(
    (folderId: string | null, folderPath: Array<{ id: string; name: string }>) => {
      setCurrentFolderId(folderId);
      setCurrentFolderPath(folderPath);
    },
    []
  );

  // Callback when a file/folder is created/deleted/uploaded
  const handleActionComplete = useCallback(() => {
    setFileListRefreshTrigger(prev => prev + 1);  }, []);

  // Search: fetch all files on mount or refresh
  useEffect(() => {
    const fetchAllFiles = async () => {
      if (!user?.id) return;
      try {
        const response = await axios.get(`/api/files?userId=${user.id}`);
        setFiles(response.data);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchAllFiles();
  }, [user?.id, refreshTrigger]);

  // Return fallback if user is not logged in
  if (!user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
  {/* Topbar is rendered in DashboardLayout, not here */}

      {/* Action buttons: Upload, Create Folder */}
      <QuickActions
        userId={user.id}
        currentFolderId={currentFolderId}
        currentFolderPath={currentFolderPath}
        onActionComplete={handleActionComplete}
      />

      {/* Recent Files */}
      <Recents
        userId={user.id}
        limit={5}
      />

      {/* Main File List View */}
      <FileList
        userId={user.id}
        externalRefreshTrigger={fileListRefreshTrigger}
        onFolderChange={handleFolderChange}
      />
    </div>
  );
};

export default DashboardContent;
