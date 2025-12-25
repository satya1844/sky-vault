"use client";
import { cn } from "@/lib/utils";
import React, { createContext, useContext, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { IconBrandTabler, IconUserBolt, IconSettings, IconArrowLeft, IconHome, IconFolder, IconClock, IconShare, IconStar, IconTrash, IconLogout } from "@tabler/icons-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
  isMobile: boolean;
  isTablet: boolean;
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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate, isMobile, isTablet }}>
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
      <TabletSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate, isMobile, isTablet } = useSidebar();
  
  // Only render on desktop (lg and above)
  if (isMobile || isTablet) return null;
  
  return (
    <>
      <motion.div
        className={cn(
          "sticky bg-[#1D1D1D] rounded-[35px] top-0 h-screen m-5 px-4 py-4 hidden lg:flex lg:flex-col w-[300px] shrink-0",
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

export const TabletSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen, isMobile, isTablet } = useSidebar();
  
  // Only render on tablet
  if (!isTablet) return null;
  
  return (
    <>
      <div
        className={cn(
          "h-12 px-4 py-3 flex flex-row lg:hidden md:flex items-center justify-between bg-background dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700"
        )}
        {...props}
      >
        {/* Removed hamburger menu button from here */}
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
              "fixed h-full w-[280px] inset-y-0 left-0 bg-white dark:bg-neutral-900 p-6 z-[100] flex flex-col justify-between shadow-xl",
              className
            )}
          >
            <div
              className="absolute right-4 top-4 z-50 text-neutral-800 dark:text-neutral-200"
              onClick={() => setOpen(!open)}
            >
              <IconX className="h-6 w-6" />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen, isMobile } = useSidebar();
  
  // Always call useEffect to follow Rules of Hooks
  React.useEffect(() => {
    if (!isMobile) return;
    if (open) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [open, isMobile]);
  
  // Only render on mobile
  if (!isMobile) return null;
  
  return (
    <>
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
              "fixed h-full w-1/2 inset-y-0 left-0 bg-white dark:bg-neutral-900 p-6 z-[100] flex flex-col justify-between",
              className
            )}
          >
            <div
              className="absolute right-4 top-4 z-50 text-neutral-800 dark:text-neutral-200"
              onClick={() => setOpen(!open)}
            >
              <IconX className="h-6 w-6" />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
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
  const { open, animate, isMobile, isTablet } = useSidebar();
  const pathname = usePathname();
  const isActive = pathname === link.href;
  const { signOut } = useClerk();
  
  // Handle logout click
  const handleClick = (e: React.MouseEvent) => {
    if (link.href === "/sign-out") {
      e.preventDefault();
      signOut();
    }
  };

  if (link.href === "/sign-out") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center justify-start gap-3 group/sidebar py-3 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors w-full text-left",
          className
        )}
        {...props}
      >
        {link.icon}

        <motion.span
          animate={{
            display: animate ? (open ? "inline-block" : "none") : "inline-block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className={cn(
            "text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0",
            isMobile && "text-base",
            isTablet && "text-sm"
          )}
        >
          {link.label}
        </motion.span>
      </button>
    );
  }

  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar py-3 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
        isActive && "bg-neutral-100 dark:bg-neutral-800",
        className
      )}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0",
          isMobile && "text-base",
          isTablet && "text-sm"
        )}
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

export default Sidebar;

export function SidebarDemo({ open: openProp, setOpen: setOpenProp }: { open?: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) {
  // Move all hooks inside the component
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [openState, setOpenState] = useState(false);

  // Use controlled props if provided, otherwise fallback to local state
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

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
      label: "Chatbot",
      href: "/dashboard/chatbot",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
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
      <SidebarBody className="justify-between gap-6 lg:gap-10">
        <div className="flex flex-col gap-4">
          <Logo />
          <nav className="flex flex-col gap-1 mt-6">
            {links.map((link) => (
              <SidebarLink key={link.href} link={link} />
            ))}
          </nav>
        </div>
        {/* You can add additional sidebar content here, e.g., user info, sign out, etc. */}
      </SidebarBody>
      {/* Mobile Sidebar - Rendered separately */}
      <MobileSidebar className="justify-between gap-6 lg:gap-10">
        <div className="flex flex-col gap-4">
          <Logo />
          <nav className="flex flex-col gap-1 mt-6">
            {links.map((link) => (
              <SidebarLink key={link.href} link={link} />
            ))}
          </nav>
        </div>
        {/* You can add additional sidebar content here, e.g., user info, sign out, etc. */}
      </MobileSidebar>
    </Sidebar>
  );
}

// Update the Logo component
export const Logo = () => {
  return (
    <a
      href="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-2 lg:py-1 text-sm font-normal text-black dark:text-white"
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
        className="font-medium whitespace-pre text-lg lg:text-xl"
      >
        Sky Vault
      </motion.span>
    </a>
  );
};