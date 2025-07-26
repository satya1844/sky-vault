"use client";
import { addToast } from "@heroui/toast";
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
      <div className=" px-4 grid mt-5 grid-cols-12 gap-4">
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
      
      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        backdrop="blur"
        size="lg"
        classNames={{
          base: "border border-gray-700 bg-black",
          header: "border-b border-gray-700",
          footer: "border-t border-gray-700",
        }}
      >
        <ModalContent className="bg-[#020108] rounded-2xl border-[1px] border-gray-700 max-w-2xl">
          <ModalHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2 ml-1.5">
              <Upload className="h-5 w-5 text-white" />
              <span className="text-white">Upload File</span>
            </div>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onClick={() => {
                setUploadModalOpen(false);
                clearFile();
              }}
              className="text-white hover:bg-gray-800 mr-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </ModalHeader>
          <ModalBody>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                error
                  ? "border-red-500/30 bg-red-900/10"
                  : file
                    ? "border-blue-500/30 bg-blue-900/10"
                    : "border-gray-700 hover:border-gray-500"
              }`}
            >
              {!file ? (
                <div className="space-y-3">
                  <FileUp className="h-12 w-12 mx-auto text-white/70" />
                  <div>
                    <p className="text-white">
                      Drag and drop your file here, or{" "}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-400 cursor-pointer font-medium inline bg-transparent border-0 p-0 m-0"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Files up to 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-900/20 rounded-md">
                        <FileUp className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium truncate max-w-[180px] text-white">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400">
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
                      className="text-white hover:bg-gray-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
      
                  {error && (
                    <div className="bg-red-900/30 text-red-200 p-3 rounded-lg flex items-center gap-2">
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
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 mt-4">
              <h4 className="text-sm font-medium mb-2 text-white">Tips</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Files are private and only visible to you</li>
                <li>• Supported formats: JPG, PNG, GIF, PDF, DOCX, TXT</li>
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
              className="text-white cursor-pointer hover:bg-gray-700 rounded-2xl"
              isDisabled={uploading}
            >
              Cancel
            </Button>
            <Button
              color="default"
              onClick={handleUpload}
              isDisabled={!file || !!error || uploading}
              className="text-white cursor-pointer hover:bg-gray-700 rounded-2xl flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="loader animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                  Uploading... {progress}%
                </>
              ) : (
                <>
                  Upload
                  <ArrowRight className="h-4 w-4 text-white" />
                </>
              )}
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
        <ModalContent className="bg-[#020108] rounded-2xl border-[1px] border-gray-700">
          <ModalHeader className="  ml-1.5 mt-2 flex  gap-2 items-center">
            <FolderPlus className="h-5 w-5 text-white " />
            <span className="text-white">New Folder</span>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-white">
                Enter a name for your folder:
              </p>
              <Input
                type="text"
                placeholder="My Images"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
                className=" text-white placeholder:text-gray-400"
                style={{
                  backgroundColor: "#27272a", // darker background
                  color: "white",            // white text
                  borderColor: "#3f3f46",    // visible border
                  borderRadius: "0.5rem",    // rounded corners
                  padding: "0.75rem 1rem",   // comfortable padding
                }}
              />
            </div>
          </ModalBody>
         <ModalFooter>
  {/* Cancel Button */}
  <Button
    variant="flat"
    color="default"
    onClick={() => setFolderModalOpen(false)}
    className="text-white cursor-pointer hover:bg-gray-700 rounded-2xl"
    isDisabled={creatingFolder}
  >
    Cancel
  </Button>

  {/* Create Button */}
  <Button
    color="default"
    onClick={handleCreateFolder}
    isDisabled={!folderName.trim() || creatingFolder}
    className="text-white cursor-pointer hover:bg-gray-700 rounded-2xl flex items-center gap-2"
  >
    {creatingFolder ? (
      <>
        <span className="loader animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
        Creating...
      </>
    ) : (
      <>
        Create
        <ArrowRight className="h-4 w-4 text-white" />
      </>
    )}
  </Button>
</ModalFooter>



        </ModalContent>
      </Modal>
    </>
  );
}