"use client";

import { useRef, useState, useEffect } from "react";
import { Upload, FolderPlus, Plus, Sparkles } from "lucide-react";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input } from "@heroui/input";
import axios from "axios";
import { useRouter } from "next/navigation";
interface QuickActionsProps {
  userId: string;
  currentFolderId: string | null;
  currentFolderPath: Array<{ id: string; name: string }>;
  onActionComplete: () => void;
}

// Common toast styles
const toastClassNames = {
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
};

export default function QuickActions({
  userId,
  currentFolderId,
  currentFolderPath,
  onActionComplete,
}: QuickActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Folder creation modal state
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState("");
  // AI Suggestions state
  interface AISuggestion {
    id: string;
    label: string;
    detail: string;
    action: { type: string; target?: string };
    priority: number;
    meta?: any;
  }
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch AI-driven suggestions for the current folder
  const refreshSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const { data } = await axios.get("/api/ai/suggestions", {
        params: { userId, folderId: currentFolderId },
      });
      setAiSuggestions(data?.suggestions ?? []);
    } catch (error) {
      console.error("Failed to fetch AI suggestions", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    refreshSuggestions();
  }, [currentFolderId]);

  // Fetch heuristic suggestions
  
 

 
  // Duplicate Review State
  const [duplicateReview, setDuplicateReview] = useState<{ open: boolean; suggestion: AISuggestion | null }>({ open: false, suggestion: null });
  const [selectedForDeletion, setSelectedForDeletion] = useState<Record<string, boolean>>({});
  const toggleSelectDuplicate = (fileId: string) => {
    setSelectedForDeletion(prev => ({ ...prev, [fileId]: !prev[fileId] }));
  };
  const [processingDelete, setProcessingDelete] = useState(false);
  const executeDuplicateDeletion = async () => {
    const ids = Object.entries(selectedForDeletion).filter(([, v]) => v).map(([id]) => id);
    if (!ids.length) return;
    setProcessingDelete(true);
    try {
      for (const id of ids) {
        await fetch(`/api/files/${id}/delete`, { method: 'DELETE' });
      }
      setDuplicateReview({ open: false, suggestion: null });
      setSelectedForDeletion({});
      onActionComplete();
      refreshSuggestions();
    } catch (e) {
      console.error('Duplicate deletion failed', e);
    } finally {
      setProcessingDelete(false);
    }
  };

  // Image Tagging Placeholder
  const [imageTagging, setImageTagging] = useState<{ open: boolean; suggestion: AISuggestion | null }>({ open: false, suggestion: null });
  const simulateTagging = async () => {
    // Placeholder: simulate latency
    setTaggingProgress(0);
    for (let p = 0; p <= 100; p += 10) {
      await new Promise(r => setTimeout(r, 120));
      setTaggingProgress(p);
    }
    setImageTagging({ open: false, suggestion: null });
  };
  const [taggingProgress, setTaggingProgress] = useState(0);

  // Archive Panel Placeholder
  const [archivePanel, setArchivePanel] = useState<{ open: boolean; suggestion: AISuggestion | null }>({ open: false, suggestion: null });
  const [archiveSelection, setArchiveSelection] = useState<Record<string, boolean>>({});
  const toggleArchiveSelect = (id: string) => setArchiveSelection(prev => ({ ...prev, [id]: !prev[id] }));
  const [processingArchive, setProcessingArchive] = useState(false);
  const simulateArchive = async () => {
    const ids = Object.entries(archiveSelection).filter(([, v]) => v).map(([id]) => id);
    if (!ids.length) return;
    setProcessingArchive(true);
    // For now just log; in future call an archive API
    await new Promise(r => setTimeout(r, 800));
    setProcessingArchive(false);
    setArchivePanel({ open: false, suggestion: null });
    setArchiveSelection({});
    refreshSuggestions();
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Validate file types and sizes
    const maxFileSize = 50 * 1024 * 1024; // 50MB limit
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/csv'
    ];

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        addToast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported file type. Please upload only images, PDFs, Word documents, or text files.`,
          color: "danger",
          classNames: toastClassNames
        });
        return;
      }
      if (file.size > maxFileSize) {
        addToast({
          title: "File Too Large",
          description: `${file.name} exceeds the 50MB size limit.`,
          color: "danger",
          classNames: toastClassNames
        });
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);

        if (currentFolderId) {
          formData.append('parentId', currentFolderId);
          console.log('Uploading to folder:', currentFolderId);
        }

        const response = await axios.post('/api/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              ((progressEvent.loaded || 0) * 100) / (progressEvent.total || 1)
            );
            setUploadProgress((i / selectedFiles.length) * 100 + (progress / selectedFiles.length));
          },
        });

        console.log('Upload response:', response.data);
      }

      let locationDescription = '';
      if (currentFolderId && currentFolderPath.length > 0) {
        const folderNames = currentFolderPath.map(folder => folder.name).join(' > ');
        locationDescription = ` to folder: ${folderNames}`;
      } else {
        locationDescription = ' to root folder';
      }

      addToast({
        title: "Upload Successful",
        description: `${selectedFiles.length} file(s) uploaded successfully${locationDescription}`,
        color: "success",
        classNames: toastClassNames
      });

      onActionComplete();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload files";
      addToast({
        title: "Upload Failed",
        description: `${errorMessage}. Please try again.`,
        color: "danger",
        classNames: toastClassNames
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const event = {
        target: { files: e.dataTransfer.files }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(event);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Create new folder - opens modal
  const handleCreateFolder = () => {
    setFolderNameInput("");
    setCreateFolderModalOpen(true);
  };

  // Submit folder creation from modal
  const submitCreateFolder = async () => {
    const folderName = folderNameInput.trim();
    if (!folderName) return;

    try {
      setCreateFolderModalOpen(false);
      
      const response = await axios.post('/api/folders/create',
       {
        name: folderName,
        userId,
        parentId: currentFolderId,
      },{
        withCredentials: true,
      });

      let locationDescription = '';
      if (currentFolderId && currentFolderPath.length > 0) {
        const folderNames = currentFolderPath.map(folder => folder.name).join(' > ');
        locationDescription = ` in folder: ${folderNames}`;
      } else {
        locationDescription = ' in root folder';
      }

      addToast({
        title: "Folder Created",
        description: `Folder "${folderName}" created successfully${locationDescription}`,
        color: "success",
        classNames: toastClassNames
      });

      setFolderNameInput("");
      onActionComplete();
    } catch (error) {
      console.error('Create folder error:', error);
      const errorMessage = error instanceof Error ? error.message : "Could not create the folder";
      addToast({
        title: "Failed to Create Folder",
        description: `${errorMessage}. Please try again.`,
        color: "danger",
        classNames: toastClassNames
      });
    }
  };

  // Handle Enter key in folder name input
  const handleFolderNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitCreateFolder();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCreateFolderModalOpen(false);
      setFolderNameInput("");
    }
  };
  const router = useRouter();


  const handleAIChatNavigation = () => {
    router.push('/dashboard/chatbot');
  };

  return (
  <div className="p-6 space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept="*/*"
      />

      {/* Responsive Quick Actions */}
      {/* Mobile: horizontal scrollable row */}
      <div className="flex gap-3 z-0 overflow-x-auto pb-2 sm:hidden">
        {/* Upload Card */}
        <div
          className={`min-w-[140px] max-w-[160px] flex-shrink-0 group relative dark:bg-[#1D1D1D] rounded-xl border dark:border-white/10 p-3 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-lg ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <Upload className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-medium dark:text-gray-200 mb-0.5 text-sm">
                {isUploading ? 'Uploading...' : 'Upload'}
              </h3>
              <p className="text-xs text-gray-500">
                {isUploading ? `${Math.round(uploadProgress)}%` : 'Add files'}
              </p>
            </div>
          </div>
          {/* Upload Progress */}
          {isUploading && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-xl overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
        {/* Create Folder Card */}
        <div
          className="min-w-[140px] max-w-[160px] flex-shrink-0 group dark:bg-[#1D1D1D] rounded-xl border dark:border-white/10 p-3 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-lg"
          onClick={handleCreateFolder}
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-yellow-50 transition-colors">
              <FolderPlus className="w-5 h-5 text-gray-600 group-hover:text-yellow-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-medium dark:text-gray-200 mb-0.5 text-sm">Folder</h3>
              <p className="text-xs dark:text-gray-400">Organize</p>
            </div>
          </div>
        </div>
        {/* AI Card */}
        <div
          className="min-w-[140px] max-w-[160px] flex-shrink-0 group dark:bg-[#1D1D1D] rounded-xl border dark:border-white/10 p-3 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-lg"
          onClick={handleAIChatNavigation}
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-purple-50 transition-colors">
              <Sparkles className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-medium dark:text-gray-200 mb-0.5 text-sm">AI</h3>
              <p className="text-xs dark:text-gray-400">Smart</p>
            </div>
          </div>
        </div>
      </div>

  {/* Tablet/Desktop: grid layout */}
  <div className="hidden sm:grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Upload Card */}
        <div
          className={`group relative dark:bg-[#1D1D1D] rounded-2xl border dark:border-white/10  p-6 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-lg ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <Upload className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-medium dark:text-gray-200 mb-1">
                {isUploading ? 'Uploading...' : 'Upload or drop'}
              </h3>
              <p className="text-sm text-gray-500">
                {isUploading ? `${Math.round(uploadProgress)}%` : 'Add files to this folder'}
              </p>
            </div>
          </div>
          {/* Upload Progress */}
          {isUploading && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-2xl overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
        {/* Create Folder Card */}
        <div
          className="group dark:bg-[#1D1D1D] rounded-2xl border dark:border-white/10 p-6 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-lg"
          onClick={handleCreateFolder}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-yellow-50 transition-colors">
              <FolderPlus className="w-6 h-6 text-gray-600 group-hover:text-yellow-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-medium dark:text-gray-200 mb-1">Create folder</h3>
              <p className="text-sm dark:text-gray-400">Organize your files</p>
            </div>
          </div>
        </div>
        {/* AI Card */}
        <div
          className="group dark:bg-[#1D1D1D] rounded-2xl border dark:border-white/10  p-6 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-lg"
          onClick={handleAIChatNavigation}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-purple-50 transition-colors">
              <Sparkles className="w-6 h-6 text-gray-600 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-medium dark:text-gray-200 mb-1">Chat with AI </h3>
              <p className="text-sm dark:text-gray-400">Smart file actions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Folder Modal */}
      <Modal
        isOpen={createFolderModalOpen}
        onOpenChange={(open) => {
          setCreateFolderModalOpen(open);
          if (!open) setFolderNameInput("");
        }}
        backdrop="blur"
        classNames={{
          base: "border border-default-200 bg-zinc-900",
          header: "border-b border-default-200",
          footer: "border-t border-default-200",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-white">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-yellow-500" />
                  Create New Folder
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Folder Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter folder name"
                    value={folderNameInput}
                    onChange={(e) => setFolderNameInput(e.target.value)}
                    onKeyDown={handleFolderNameKeyDown}
                    autoFocus
                    maxLength={255}
                    classNames={{
                      input: "bg-zinc-800 text-white",
                      inputWrapper: "bg-zinc-800 border-zinc-700",
                    }}
                  />
                  {currentFolderPath.length > 0 && (
                    <p className="text-xs text-gray-400">
                      Location: {currentFolderPath.map(f => f.name).join(' > ')}
                    </p>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={() => {
                    onClose();
                    setFolderNameInput("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={submitCreateFolder}
                  isDisabled={!folderNameInput.trim()}
                >
                  Create Folder
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      
  

    
    </div>
  );
}