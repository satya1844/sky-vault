"use client";
import { SidebarDemo } from "./Sidebar";
import Topbar from "./Topbar";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUser();

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
          onSidebarToggle={() => setSidebarOpen((prev) => !prev)} 
        />
        {children}
      </div>
    </div>
  );
}