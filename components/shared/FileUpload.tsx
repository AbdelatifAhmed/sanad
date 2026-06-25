"use client";

import React, { useState, useCallback, useRef } from "react";
import { Upload, X, File as FileIcon, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  label?: string;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = "image/jpeg, image/png, application/pdf",
  maxSizeMB = 5,
  multiple = false,
  label = "Upload file",
  error,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndProcessFiles = useCallback(
    (files: FileList | File[]) => {
      setLocalError(null);
      const validFiles: File[] = [];
      const newPreviews: string[] = [];
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      Array.from(files).forEach((file) => {
        // Validation: Size
        if (file.size > maxSizeBytes) {
          setLocalError(`File ${file.name} is larger than ${maxSizeMB}MB.`);
          return;
        }

        // Validation: Type (Basic check)
        const allowedTypes = accept.split(",").map((type) => type.trim());
        if (accept !== "*" && !allowedTypes.includes(file.type)) {
          setLocalError(`File ${file.name} is not an allowed type.`);
          return;
        }

        validFiles.push(file);

        // Generate preview for images
        if (file.type.startsWith("image/")) {
          newPreviews.push(URL.createObjectURL(file));
        } else {
          newPreviews.push(""); // Placeholder for non-images
        }
      });

      if (validFiles.length > 0) {
        let finalFiles = validFiles;
        let finalPreviews = newPreviews;

        if (!multiple) {
          finalFiles = [validFiles[0]];
          finalPreviews = [newPreviews[0]];
        } else {
          finalFiles = [...selectedFiles, ...validFiles];
          finalPreviews = [...previews, ...newPreviews];
        }

        setSelectedFiles(finalFiles);
        setPreviews(finalPreviews);
        onFileSelect(finalFiles);
      }
    },
    [accept, maxSizeMB, multiple, onFileSelect, previews, selectedFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        validateAndProcessFiles(e.dataTransfer.files);
      }
    },
    [validateAndProcessFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files.length > 0) {
        validateAndProcessFiles(e.target.files);
      }
    },
    [validateAndProcessFiles]
  );

  const handleRemoveFile = useCallback(
    (indexToRemove: number) => {
      const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
      const updatedPreviews = previews.filter((_, index) => index !== indexToRemove);
      
      setSelectedFiles(updatedFiles);
      setPreviews(updatedPreviews);
      onFileSelect(updatedFiles);
      
      // Clear object URLs to prevent memory leaks
      if (previews[indexToRemove]) {
        URL.revokeObjectURL(previews[indexToRemove]);
      }
    },
    [selectedFiles, previews, onFileSelect]
  );

  const displayError = error || localError;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      
      <div
        className={`relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl transition-colors
          ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50 bg-white"}
          ${displayError ? "border-red-400 bg-red-50" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
        />
        
        <div className="flex flex-col items-center justify-center space-y-3 cursor-pointer">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-600 text-center">
            <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            {accept.replace(/image\//g, "").replace(/application\//g, "").replace(/,/g, ", ")} up to {maxSizeMB}MB
          </p>
        </div>
      </div>

      {displayError && (
        <div className="mt-2 text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {displayError}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3 overflow-hidden">
                {previews[index] ? (
                  <img
                    src={previews[index]}
                    alt={`Preview ${file.name}`}
                    className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-md flex-shrink-0">
                    {file.type.includes("pdf") ? <FileIcon className="w-5 h-5 text-red-500" /> : <ImageIcon className="w-5 h-5 text-gray-400" />}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
