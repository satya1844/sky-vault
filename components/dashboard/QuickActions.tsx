"use client";

import { useRef, useState } from "react";
import { Upload, FolderPlus, Plus, Sparkles } from "lucide-react";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import axios from "axios";

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
      'text/plain'
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

  // Create new folder
  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName?.trim()) return;

    try {
      const response = await axios.post('/api/folders/create', {
        name: folderName.trim(),
        userId,
        parentId: currentFolderId,
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

  return (
    <div className="p-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept="*/*"
      />

      {/* Show current location */}
      {/* {currentFolderId && currentFolderPath.length > 0 && (
        <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Current location:</span>{' '}
            {currentFolderPath.map(folder => folder.name).join(' > ')}
          </p>
        </div>
      )} */}

      {/* Modern Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Upload Card */}
        <div
          className={`group relative dark:bg-[#1D1D1D] rounded-2xl border dark:border-white/10  p-6 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-lg ${
            isUploading ? 'pointer-events-none opacity-60' : ''
          }`}
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

        {/* AI Magic Card (placeholder) */}
        <div
          className="group dark:bg-[#1D1D1D] rounded-2xl border dark:border-white/10  p-6 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-lg"
          onClick={() => console.log('AI features coming soon!')}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-purple-50 transition-colors">
              <Sparkles className="w-6 h-6 text-gray-600 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-medium dark:text-gray-200 mb-1">AI Magic</h3>
              <p className="text-sm dark:text-gray-400">Smart file actions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alternative: Horizontal Layout (uncomment to use instead) */}
     
    </div>
  );
}