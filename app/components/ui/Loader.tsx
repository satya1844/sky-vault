"use client";
import { Loader2 } from "lucide-react";

export interface LoaderProps {
  message?: string;
  heightClass?: string; // e.g., "h-[70vh]" or "h-screen"
  compact?: boolean; // smaller spinner + text
}

export default function Loader({ message = "Loading…", heightClass = "h-[70vh]", compact = false }: LoaderProps) {
  return (
    <div className={`flex ${heightClass} items-center justify-center`}>
      <div className={`flex items-center gap-3 rounded-xl border border-white/10 bg-[#1d1d1d] px-4 py-3 text-gray-200`}>
        <Loader2 className={`${compact ? "h-4 w-4" : "h-5 w-5"} animate-spin`} />
        <span className={`${compact ? "text-xs" : "text-sm"}`}>{message}</span>
      </div>
    </div>
  );
}
