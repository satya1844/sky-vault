// Example: How to use the Recents component in your dashboard or main page

"use client";

import { useState } from "react";
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

  // Function to trigger refresh when files are uploaded/modified
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Early return if no user
  if (!user?.id) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      {/* Recent Activity Section - Shows latest 4 items */}
      <Topbar/>
      <QuickActions onUploadSuccess={handleRefresh} userId={user.id} />
      <Recents 
        userId={user.id} // Now guaranteed to be string
        limit={4} // Show only 4 most recent items
        refreshTrigger={refreshTrigger}
      />

      {/* Main File List */}
      <FileList 
        userId={user.id} // Now guaranteed to be string
        refreshTrigger={refreshTrigger}
          onDeleteSuccess={() => setRefreshTrigger(prev => prev + 1)}
// 👈 toggle to refetch

        onFolderChange={(folderId) => {
          // Handle folder navigation if needed
          console.log("Navigated to folder:", folderId);
        }}
      />

      {/* Example: Button to trigger refresh */}
      <button 
        onClick={handleRefresh}
        className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg"
      >
        Refresh
      </button>
    </div>
  );
}
export default DashboardContent;
