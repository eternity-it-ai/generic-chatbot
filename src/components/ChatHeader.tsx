import React, { useRef } from "react";
import { FilePlus, MessageSquarePlus } from "lucide-react";

interface ChatHeaderProps {
  onNewChat: () => void;
  onNewFile: (file: File) => void;
}

export default function ChatHeader({ onNewChat, onNewFile }: ChatHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onNewFile(file);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800">Chat</h2>
      <div className="flex items-center gap-2">
        <button
          onClick={handleNewFileClick}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <FilePlus className="h-4 w-4" />
          New File
        </button>
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
