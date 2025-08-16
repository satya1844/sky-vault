"use client";
import { SidebarDemo } from "./Sidebar";
import Topbar from "./Topbar";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUser();
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all files for the user
  useEffect(() => {
    const fetchAllFiles = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`/api/files?userId=${user.id}`);
        const data = await response.json();
        setFiles(data);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };
    fetchAllFiles();
  }, [user?.id]);

  return (
    <div className="min-h-screen flex bg-background">
      <SidebarDemo open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Topbar
          user={user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          } : undefined}
          files={files}
          onSearch={setSearchQuery}
          onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
        />
        {/* Pass files and searchQuery to children if needed */}
        {children}
      </div>
    </div>
  );
}