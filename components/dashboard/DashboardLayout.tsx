"use client";
import { SidebarDemo } from "./Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <SidebarDemo />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}