import React, { useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Ask about strategy...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="flex gap-3 items-end p-4 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="w-full px-4 py-3 pr-12 min-h-[48px] max-h-[200px] text-[15px] leading-relaxed resize-none rounded-2xl border-gray-300 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="absolute right-3 bottom-3 text-xs text-gray-400 pointer-events-none">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
      <Button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="px-5 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-medium shadow-md hover:shadow-lg transition-all"
      >
        <Send className="h-5 w-5 mr-2" />
        <span className="hidden sm:inline">Send</span>
      </Button>
    </div>
  );
}
