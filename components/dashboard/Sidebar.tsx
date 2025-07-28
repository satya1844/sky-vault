"use client";
import { cn } from "@/lib/utils";
import React, { createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { IconBrandTabler, IconUserBolt, IconSettings, IconArrowLeft, IconHome, IconFolder, IconClock, IconShare, IconStar, IconTrash, IconLogout } from "@tabler/icons-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children?: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "sticky bg-[#1D1D1D] rounded-[35px] top-0 h-screen m-5 px-4 py-4 hidden md:flex md:flex-col w-[300px] shrink-0",
          className
        )}
        animate={{
          width: animate ? (open ? "300px" : "60px") : "300px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-neutral-800 dark:text-neutral-200"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  
  // Handle logout click
  const handleClick = (e: React.MouseEvent) => {
    if (link.href === "/sign-out") {
      e.preventDefault();
      // You'll need to pass handleSignOut as a prop or use a different approach
      console.log("Logout clicked");
    }
  };

  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </a>
  );
};

export default Sidebar;

export function SidebarDemo() {
  // Move all hooks inside the component
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [open, setOpen] = useState(false);

  // Move handleSignOut inside the component
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Optional: Make API call to backend for additional cleanup
      // await axios.post('/api/auth/signout', { userId: user.id });
      
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error during sign out:", error);
      // Still proceed with Clerk signout even if API fails
      try {
        await signOut();
      } catch (fallbackError) {
        console.error("Fallback signout also failed:", fallbackError);
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <IconHome className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "My Files",
      href: "/dashboard/files",
      icon: (
        <IconFolder className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Recent Uploads",
      href: "/dashboard/recent",
      icon: (
        <IconClock className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Shared Files",
      href: "/dashboard/shared",
      icon: (
        <IconShare className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Favorites",
      href: "/dashboard/favorites",
      icon: (
        <IconStar className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Trash",
      href: "/dashboard/trash",
      icon: (
        <IconTrash className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  return (
    <Sidebar open={open} setOpen={setOpen} animate={false}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <Logo />
          {/* Storage Usage Indicator */}
          <div className="mt-6 px-4">
            <div className="space-y-1" title="You have 3.5 GB remaining">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-600 dark:text-neutral-400">Storage Used</span>
                <span className="text-neutral-900 dark:text-neutral-200">65%</span>
              </div>
              <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[65%] rounded-full"></div>
              </div>
              <p className="text-xs text-neutral-500">6.5 GB of 10 GB used</p>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
            {/* Custom logout button */}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center justify-start gap-2 group/sidebar py-2 text-left w-full bg-transparent border-none cursor-pointer"
            >
              <IconLogout className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
              <span className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre">
                {isSigningOut ? "Signing out..." : "Logout"}
              </span>
            </button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
          <SidebarLink
            link={{
              label: user?.fullName || user?.emailAddresses?.[0]?.emailAddress || "User",
              href: "/dashboard/profile",
              icon: (
                <img
                  src={user?.imageUrl || "https://via.placeholder.com/32"}
                  className="h-7 w-7 shrink-0 rounded-full"
                  width={28}
                  height={28}
                  alt="Profile"
                />
              ),
            }}
            className="truncate"
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

// Update the Logo component
export const Logo = () => {
  return (
    <a
      href="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="h-8 w-8 shrink-0">
        <img 
          src="/cloud.jpg" 
          alt="Sky Vault Logo" 
          className="h-full w-full object-contain"
        />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-xl"
      >
        Sky Vault
      </motion.span>
    </a>
  );
};