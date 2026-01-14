"use client";
import { SidebarDemo } from "./Sidebar";
import Topbar from "./Topbar";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default  function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUser();
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

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

  // Pre-warm common dashboard routes to reduce first-load compile delays
  useEffect(() => {
    const routes = [
      "/dashboard/files",
      "/dashboard/favorites",
      "/dashboard/shared",
      "/dashboard/trash",
      "/dashboard/settings",
      "/dashboard/chatbot",
      "/dashboard/recent",
    ];
    routes.forEach((r) => {
      try {
        router.prefetch(r);
      } catch (e) {
        // Ignore prefetch errors in dev
      }
    });
  }, [router]);

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