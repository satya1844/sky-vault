"use client";
import {addToast} from "@heroui/toast";
import { useState, useRef } from "react";
import { Upload, FolderPlus, Sparkles, X, FileUp, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { Input } from "@heroui/input";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import axios from "axios";
import { useAuth } from "@clerk/nextjs"; // Add this import

interface QuickActionsProps {
  userId: string;
  currentFolder?: string | null;
  onUploadSuccess?: () => void;
}

export default function QuickActions({ 
  userId, 
  currentFolder = null, 
  onUploadSuccess 
}: QuickActionsProps) {
  // Add this line to get the auth token
  const { getToken } = useAuth();

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Folder creation state
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit");
        return;
      }

      setFile(selectedFile);
      setError(null);
      setUploadModalOpen(true);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];

      // Validate file size (5MB limit)
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit");
        return;
      }

      setFile(droppedFile);
      setError(null);
      setUploadModalOpen(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      // Get the authentication token from Clerk
      const token = await getToken();
      
      if (!token) {
        setError("Authentication failed. Please try logging in again.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      
      if (currentFolder) {
        formData.append("parentId", currentFolder);
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      await axios.post("/api/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`, // Add the auth header
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        },
      });

      addToast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded successfully.`,
        color: "success",
      });

      // Clear the file after successful upload
      clearFile();
      setUploadModalOpen(false);

      // Call the onUploadSuccess callback if provided
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      
      // More specific error handling
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setError("Authentication failed. Please refresh the page and try again.");
        } else if (error.response?.status === 400) {
          setError("Invalid file or request. Please check your file and try again.");
        } else {
          setError("Failed to upload file. Please try again.");
        }
      } else {
        setError("Failed to upload file. Please try again.");
      }
      
      addToast({
        title: "Upload Failed",
        description: "We couldn't upload your file. Please try again.",
        color: "danger",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      addToast({
        title: "Invalid Folder Name",
        description: "Please enter a valid folder name.",
        color: "danger",
      });
      return;
    }

    try {
      // Get the authentication token from Clerk
      const token = await getToken();
      
      if (!token) {
        addToast({
          title: "Authentication Failed",
          description: "Please refresh the page and try again.",
          color: "danger",
        });
        return;
      }

      setCreatingFolder(true);

      await axios.post("/api/folders/create", {
        name: folderName.trim(),
        userId: userId,
        parentId: currentFolder,
      }, {
        headers: {
          "Authorization": `Bearer ${token}`, // Add the auth header
        },
      });

      addToast({
        title: "Folder Created",
        description: `Folder "${folderName}" has been created successfully.`,
        color: "success",
      });

      // Reset folder name and close modal
      setFolderName("");
      setFolderModalOpen(false);

      // Call the onUploadSuccess callback to refresh the file list
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        addToast({
          title: "Authentication Failed",
          description: "Please refresh the page and try again.",
          color: "danger",
        });
      } else {
        addToast({
          title: "Folder Creation Failed",
          description: "We couldn't create the folder. Please try again.",
          color: "danger",
        });
      }
    } finally {
      setCreatingFolder(false);
    }
  };

  return (
    <>
      <div className="mt-3 px-4 grid mt-5 grid-cols-12 gap-4">
        {/* Upload File - 4 cols */}
        <div 
          className="col-span-4 bg-[#1D1D1D] rounded-[30px] h-16 flex items-center justify-center cursor-pointer hover:bg-[#252525] transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="text-white text-sm font-medium">Upload File</span>
        </div>
        
        {/* Create Folder - 4 cols */}
        <div 
          className="col-span-4 bg-[#1D1D1D] rounded-[30px] h-16 flex items-center justify-center cursor-pointer hover:bg-[#252525] transition-colors"
          onClick={() => setFolderModalOpen(true)}
        >
          <span className="text-white text-sm font-medium">New Folder</span>
        </div>
        
        {/* AI Magic - 4 cols */}
        <div 
          className="col-span-4 bg-[#1D1D1D] rounded-[30px] h-16 flex items-center justify-center cursor-pointer hover:bg-[#252525] transition-colors"
          onClick={() => console.log("AI clicked")}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Hidden file input */}
      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.docx,.txt,image/*"
      />

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        backdrop="blur"
        size="lg"
        classNames={{
          base: "border border-border bg-black",
          header: "border-b border-border",
          footer: "border-t border-border",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex gap-2 items-center">
            <Upload className="h-5 w-5 text-primary" />
            <span className="text-foreground">Upload File</span>
          </ModalHeader>
          <ModalBody>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                error
                  ? "border-danger/30 bg-danger/5"
                  : file
                    ? "border-primary/30 bg-primary/5"
                    : "border-border hover:border-primary/50"
              }`}
            >
              {!file ? (
                <div className="space-y-3">
                  <FileUp className="h-12 w-12 mx-auto text-primary/70" />
                  <div>
                    <p className="text-secondary-foreground">
                      Drag and drop your image here, or{" "}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary cursor-pointer font-medium inline bg-transparent border-0 p-0 m-0"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-secondary-foreground mt-1">Images up to 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <FileUp className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium truncate max-w-[180px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-secondary-foreground">
                          {file.size < 1024
                            ? `${file.size} B`
                            : file.size < 1024 * 1024
                              ? `${(file.size / 1024).toFixed(1)} KB`
                              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                        </p>
                      </div>
                    </div>
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      onClick={clearFile}
                      className="text-secondary-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {error && (
                    <div className="bg-red-900 text-red-200 p-3 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {uploading && (
                    <Progress
                      value={progress}
                      color="primary"
                      size="sm"
                      showValueLabel={true}
                      className="max-w-full"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Upload tips */}
            <div className="bg-card p-4 rounded-lg border border-border mt-4">
              <h4 className="text-sm font-medium mb-2 text-foreground">Tips</h4>
              <ul className="text-xs text-secondary-foreground space-y-1">
                <li>• Images are private and only visible to you</li>
                <li>• Supported formats: JPG, PNG, GIF, WebP</li>
                <li>• Maximum file size: 5MB</li>
              </ul>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              color="default"
              onClick={() => {
                setUploadModalOpen(false);
                clearFile();
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleUpload}
              isLoading={uploading}
              isDisabled={!file || !!error}
              endContent={!uploading && <ArrowRight className="h-4 w-4" />}
            >
              {uploading ? `Uploading... ${progress}%` : "Upload Image"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        isOpen={folderModalOpen}
        onOpenChange={setFolderModalOpen}
        backdrop="blur"
        classNames={{
          base: "border border-border bg-black",
          header: "border-b border-border",
          footer: "border-t border-border",
        }}
      >
        <ModalContent className="bg-[#262626] rounded-2xl border-[1px] border-gray-700">
          <ModalHeader className="flex  gap-2 items-center">
            <FolderPlus className="h-5 w-5 text-primary" />
            <span className="text-foreground">New Folder</span>
          </ModalHeader>
          <ModalBody>
            <div className="bg- space-y-4">
              <p className="text-sm text-secondary-foreground">
                Enter a name for your folder:
              </p>
              <Input
                type="text"
                placeholder="My Images"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
                className="bg-white text-white rounded-xl"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              color="default"
              onClick={() => setFolderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleCreateFolder}
              isLoading={creatingFolder}
              isDisabled={!folderName.trim()}
              endContent={!creatingFolder && <ArrowRight className="h-4 w-4" />}
            >
              Create
            </Button>
          </ModalFooter>


        </ModalContent>
      </Modal>
    </>
  );
}