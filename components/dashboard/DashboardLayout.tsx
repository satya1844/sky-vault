"use client";
import { SidebarDemo } from "./Sidebar";
import Topbar from "./Topbar";
import { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      <SidebarDemo open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Topbar onSidebarToggle={() => setSidebarOpen((prev) => !prev)} />
        {children}
      </div>
    </div>
  );
}