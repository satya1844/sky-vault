"use client";

import { useRef, useState } from "react";
import { Upload, FolderPlus, Plus } from "lucide-react";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import axios from "axios";

interface QuickActionsProps {
  userId: string;
  currentFolderId: string | null;
  currentFolderPath: Array<{ id: string; name: string }>;
  onActionComplete: () => void; // Callback to refresh the file list
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

        // Add current folder as parent if we're inside a folder
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

      // Build the location description
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

      // Notify parent to refresh the file list
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
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

      // Build the location description
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

      // Notify parent to refresh the file list
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept="*/*"
      />

      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      
      {/* Show current location */}
      {currentFolderId && currentFolderPath.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Current location:</span>{' '}
            {currentFolderPath.map(folder => folder.name).join(' > ')}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Button
          color="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg justify-start"
          size="lg"
        >
          <Upload className="w-5 h-5 mr-3" />
          {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload Files'}
        </Button>

        <Button
          variant="bordered"
          onClick={handleCreateFolder}
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg justify-start"
          size="lg"
        >
          <FolderPlus className="w-5 h-5 mr-3" />
          Create New Folder
        </Button>

        {/* You can add more quick actions here */}
        {/* 
        <Button
          variant="bordered"
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg justify-start"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-3" />
          Other Action
        </Button>
        */}
      </div>

      {/* Show upload progress if uploading */}
      {isUploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}