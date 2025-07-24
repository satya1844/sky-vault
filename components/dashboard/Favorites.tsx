"use client";
import {addToast} from "@heroui/toast"
import { useEffect, useState, useMemo, useCallback } from "react";
import { Folder, Star, Trash, X, ExternalLink, StarIcon, EyeClosed } from "lucide-react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,

} from "@heroui/table";
import { Card } from "@heroui/card";
import { formatDistanceToNow, format } from "date-fns";
import type { File as FileType } from "@/lib/db/schema";
import axios from "axios";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import FileEmptyState from "@/components/FileEmptyState";
import FileIcon from "@/components/FileIcon";
import FileActions from "@/components/FileActions";
import FileLoadingState from "@/components/FileLoadingState";
import FileTabs from "@/components/FileTabs";
import FolderNavigation from "@/components/FolderNavigation";
import FileActionButtons from "@/components/FileActionButtons";
import { Tooltip } from "@heroui/tooltip";

interface FileListProps {
  userId: string;
  refreshTrigger?: number;
  onFolderChange?: (folderId: string | null) => void;
  onDeleteSuccess?: () => void;
}





export default function Favorites({
    userId,
    refreshTrigger = 0,
    onFolderChange,
  }: FileListProps)
  {

  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [emptyTrashModalOpen, setEmptyTrashModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);


//fetch the filess
 const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/files?userId=${userId}`;
      if (currentFolder) {
        url += `&parentId=${currentFolder}`;
      }

      const response = await axios.get(url);
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching files:", error);
      addToast({
        title: "Error Loading Files",
        description: "We couldn't load your files. Please try again later.",
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
  }, [userId, currentFolder]);
  useEffect(() => {
    fetchFiles();
  }, [userId, refreshTrigger, currentFolder, fetchFiles]);

  const favoriteFiles = files.filter((file) => file.isStarred && !file.isTrashed);


  return (
    <Card shadow="sm" className="border border-border bg-card overflow-hidden">
  <div className="overflow-x-auto">
    <Table
      aria-label="Favorites table"
      isStriped
      color="default"
      selectionMode="none"
      classNames={{
        base: "min-w-full",
        th: "bg-secondary text-foreground font-medium text-sm",
        td: "py-4",
      }}
    >
      <TableHeader>
        <TableColumn>Name</TableColumn>
        <TableColumn className="hidden sm:table-cell">Type</TableColumn>
        <TableColumn className="hidden md:table-cell">Size</TableColumn>
        <TableColumn className="hidden sm:table-cell">Added</TableColumn>
        <TableColumn width={240}>Actions</TableColumn>
      </TableHeader>
      <TableBody>
        {favoriteFiles.map((file: FileType) => (
          <TableRow
            key={file.id}
            className={`hover:bg-secondary transition-colors ${file.isFolder || file.type.startsWith("image/") ? "cursor-pointer" : ""
              }`}
            onClick={() => {
              // open folders or preview images
              if (file.isFolder) {
                setCurrentFolder(file.id);
                onFolderChange?.(file.id);
              } else if (file.type.startsWith("image/")) {
                window.open(file.fileUrl, "_blank");
              }
            }}
          >
            <TableCell>
              <div className="flex items-center gap-3">
                <FileIcon file={file} />
                <div>
                  <div className="font-medium flex items-center gap-2 text-foreground">
                    <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
                      {file.name}
                    </span>
                    {file.isStarred && (
                      <Tooltip content="Starred">
                        <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                      </Tooltip>
                    )}
                    {file.isFolder && (
                      <Tooltip content="Folder">
                        <Folder className="h-3 w-3 text-secondary-foreground" />
                      </Tooltip>
                    )}
                    {file.type.startsWith("image/") && (
                      <Tooltip content="Click to view image">
                        <ExternalLink className="h-3 w-3 text-secondary-foreground" />
                      </Tooltip>
                    )}
                  </div>
                  <div className="text-xs text-secondary-foreground sm:hidden">
                    {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <div className="text-xs text-secondary-foreground">
                {file.isFolder ? "Folder" : file.type}
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="text-foreground">
                {file.isFolder
                  ? "-"
                  : file.size < 1024
                    ? `${file.size} B`
                    : file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <div>
                <div className="text-foreground">
                  {formatDistanceToNow(new Date(file.createdAt), {
                    addSuffix: true,
                  })}
                </div>
                <div className="text-xs text-secondary-foreground mt-1">
                  {format(new Date(file.createdAt), "MMMM d, yyyy")}
                </div>
              </div>
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <FileActions
                file={file}
                onStar={() => { }} // optional: pass star toggle handler
                onTrash={() => { }} // optional: pass trash handler
                onDelete={() => {
                  setSelectedFile(file);
                  setDeleteModalOpen(true);
                }}
                onDownload={() => window.open(file.fileUrl, "_blank")}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
</Card>

  )

} 