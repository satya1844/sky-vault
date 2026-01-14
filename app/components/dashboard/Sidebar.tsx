"use client";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconX, IconHome, IconFolder, IconClock, IconShare, IconStar, IconTrash, IconSettings, IconUserBolt } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {useUser} from "@clerk/nextjs";
import { Pacifico } from 'next/font/google';
import {useEffect, useState as useStateImport} from "react";
interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

// ============================================
// SIDEBAR - Main component
// ============================================

export function SidebarDemo({ 
  open: openProp, 
  setOpen: setOpenProp,
  refreshTrigger
}: { 
  open?: boolean; 
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  refreshTrigger?: number; // Pass timestamp when upload completes
}) {
  const [openState, setOpenState] = useState(false);

  const { user } = useUser();

  const [usedStorageGB, setUsedStorageGB] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);


  // Use props if provided, otherwise use local state
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;
  const TOTAL_STORAGE_GB = 3; // Total storage in GB


  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      setIsLoadingStats(true);
      const res = await fetch("/api/user/stats");
      
      if (!res.ok) throw new Error("Failed to fetch user stats");
      
      const data = await res.json();
      
      // Parse the formatted storage string (handles KB, MB, GB, TB)
      const storageString = data.totalStorage;
      
      // Match pattern like "512 MB", "2.5 GB", "1.2 TB", etc.
      const match = storageString.match(/^([\d.]+)\s*(Bytes|KB|MB|GB|TB)$/i);
      
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        
        // Convert to GB
        const conversionMap: Record<string, number> = {
          'BYTES': 1 / (1024 ** 3),
          'KB': 1 / (1024 ** 2),
          'MB': 1 / 1024,
          'GB': 1,
          'TB': 1024,
        };
        
        const gbValue = value * conversionMap[unit];
        setUsedStorageGB(gbValue);
      } else {
        console.warn("Could not parse storage format:", storageString);
        setUsedStorageGB(0);
      }
    } catch (err) {
      console.error("User stats error:", err);
      setUsedStorageGB(0);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch on mount and when refreshTrigger changes
  useEffect(() => {
    fetchUserStats();
  }, [refreshTrigger]);

  // Format display value (show MB if < 1 GB)
  const getDisplayStorage = () => {
    if (usedStorageGB === null) return "0 MB";
    
    if (usedStorageGB < 1) {
      const mb = usedStorageGB * 1024;
      return `${mb.toFixed(0)} MB`;
    }
    return `${usedStorageGB.toFixed(1)} GB`;
  };

  // Calculate progress percentage
  const progressPercent = usedStorageGB ? Math.min((usedStorageGB / TOTAL_STORAGE_GB) * 100, 100) : 0;

  //get user's display name
  const userName = user?.firstName || "Human";


  // All navigation links
  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <IconHome className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "My Files",
      href: "/dashboard/files",
      icon: <IconFolder className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Recent Uploads",
      href: "/dashboard/recent",
      icon: <IconClock className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Chatbot",
      href: "/dashboard/chatbot",
      icon: <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Shared Files",
      href: "/dashboard/shared",
      icon: <IconShare className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Favorites",
      href: "/dashboard/favorites",
      icon: <IconStar className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Trash",
      href: "/dashboard/trash",
      icon: <IconTrash className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile/tablet, always visible on desktop */}
      
      <div className="hidden lg:block sticky top-0 h-screen">
        <Logo />
        <div className="bg-[#1D1D1D] rounded-[35px] h-max m-5 px-4 py-2 mb-25 w-[240px]">
          
         

          {user && (
            <div className="mt-3 px-3 ">
              <p className="text-sm text-neutral-300">Greetings, <span className="font-extrabold text-white text-2xl ">{userName}</span></p>
            </div>
          )}

          {/* Storage Section */}
          <div className="mt-4 px-3">
            <p className="text-xs text-neutral-400">Storage used</p>

            {isLoadingStats ? (
              <div className="mt-2 h-4 bg-neutral-700 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-sm text-white font-semibold">
                  {getDisplayStorage()}{" "}
                  <span className="text-neutral-400">/ {TOTAL_STORAGE_GB} GB</span>
                </p>

                {/* Single smooth progress bar */}
                <div className="mt-2 w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </>
            )}
          </div>



          <nav className="flex flex-col gap-1 mt-6">
            {links.map((link) => (
              <SidebarLink key={link.href} link={link} />
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile/Tablet Overlay Sidebar - Slides in from left when open */}
      <AnimatePresence>
        {open && (
          <>
            {/* Dark overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            
            {/* Sidebar panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed h-full w-[280px] md:w-[320px] inset-y-0 left-0 bg-white dark:bg-neutral-900 p-6 z-50 lg:hidden"
            >
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 text-neutral-800 dark:text-neutral-200"
              >
                <IconX className="h-6 w-6" />
              </button>
              
              <Logo />
              <nav className="flex flex-col gap-1 mt-6">
                {links.map((link) => (
                  <SidebarLink key={link.href} link={link} onClick={() => setOpen(false)} />
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// SIDEBAR LINK - Individual navigation link
// ============================================

const SidebarLink = ({ 
  link, 
  onClick 
}: { 
  link: Links;
  onClick?: () => void;
}) => {
  const pathname = usePathname();
  const isActive = pathname === link.href;

 

  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
        isActive && "bg-neutral-100 dark:bg-neutral-800"
      )}
    >
      {link.icon}
      <span className="text-neutral-700 dark:text-neutral-200 text-sm">
        {link.label}
      </span>
    </Link>
  );
};

// ============================================
// LOGO - App logo and title
// ============================================
const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
}); 

const Logo = () => {
  return (
    <a
      href="/dashboard"
      className="flex items-center space-x-2 pt-5 px-5 text-black dark:text-white justify-center"
    >
      <div className="h-8 w-8 shrink-0">
        <img 
          src="/favicon.ico" 
          alt="Sky Vault Logo" 
          //make it in cloud shape
          

          className="h-full w-full object-contain rounded-full"
          
        />
      </div>
      <span className={`font-medium  ${pacifico.className}  text-lg`}>Sky Vault</span>
    </a>
  );
};




export default SidebarDemo;
