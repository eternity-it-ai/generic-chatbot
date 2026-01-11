import React, { useRef, useEffect } from "react";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { Send, Sparkles } from "lucide-react";

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="w-full px-4 py-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
          {/* Decorative gradient border effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 rounded-2xl opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 pointer-events-none" />

          <div className="relative flex-1 flex items-center px-4 py-2">
            <Sparkles className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              rows={1}
              className="flex-1 border-0 focus:ring-0 resize-none bg-transparent text-[15px] leading-relaxed placeholder:text-gray-400 px-0 py-2 max-h-[160px] focus:outline-none focus:border-0"
            />
          </div>

          <div className="relative pr-2 pb-2">
            <Button
              onClick={onSubmit}
              disabled={disabled || !value.trim()}
              className="h-10 w-10 p-0 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Hint text */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="text-xs text-gray-400">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
              Enter
            </kbd>
            <span className="ml-1">to send</span>
            <span className="mx-2">•</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
              Shift
            </kbd>
            <span className="mx-0.5">+</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
              Enter
            </kbd>
            <span className="ml-1">for new line</span>
          </div>
          <div className="text-xs text-gray-400">
            {value.length > 0 && `${value.length} characters`}
          </div>
        </div>
      </div>
    </div>
  );
}
