import React, { useRef, useState } from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFile?: string;
  disabled?: boolean;
}

export default function FileUpload({
  onFileSelect,
  acceptedFile,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-all duration-200
        ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFile || ".csv"}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-4">
        <div
          className={`
          w-16 h-16 rounded-full flex items-center justify-center
          transition-all duration-200
          ${
            isDragging
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
          }
        `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <div>
          <p className="text-lg font-medium text-gray-700">
            {isDragging ? "Drop your file here" : "Click or drag to upload"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {acceptedFile ? `Accepted: ${acceptedFile}` : "CSV files only"}
          </p>
        </div>
      </div>
    </div>
  );
}
