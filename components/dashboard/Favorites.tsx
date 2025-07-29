"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { addToast } from "@heroui/toast";
import FileList from "@/components/FileList";
import type { File as FileType } from "@/lib/db/schema";

interface FavoritesProps {
  userId: string;
}

export default function Favorites({ userId }: FavoritesProps) {
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStarredFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/files?userId=${userId}&starred=true`);
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching starred files:", error);
      addToast({
        title: "Error Loading Favorites",
        description: "We couldn't load your favorite files. Please try again later.",
        color: "danger",
        classNames: {
          base: `
            custom-toast-width
            bg-zinc-900
            text-white
            px-4
            py-3
            border
            border-zinc-700
            shadow-xl
            flex
            items-start
            gap-3
          `,
          closeButton: `
            hover:bg-white/10
            transition
            p-1
            rounded
            ml-auto
          `,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStarredFiles();
  }, [fetchStarredFiles]);

  if (loading) {
    return <div>Loading...</div>; // You can replace this with a loading component
  }

  return (
    <FileList
      userId={userId}
      
      refreshTrigger={0} // You can use this to trigger a refresh if needed
    />
  );
}