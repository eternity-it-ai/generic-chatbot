import React, { useEffect, useRef } from "react";
import { Button } from "@/shared/ui/button";
import { Send } from "lucide-react";
import type { BotId } from "@/shared/types";
import { BOT_DEFINITIONS } from "@/shared/constants/bots";
import BotPersonaSelect from "./BotPersonaSelect";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  botId: BotId;
  onBotChange: (botId: BotId) => void;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  botId,
  onBotChange,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  };

  return (
    <div className="w-full px-4 py-4 bg-linear-to-t from-white via-white to-transparent">
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-white rounded-3xl border border-gray-200/80 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 focus-within:border-gray-300 focus-within:shadow-xl focus-within:shadow-black/10">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={BOT_DEFINITIONS[botId].inputPlaceholder}
              rows={1}
              className="w-full border-0 focus:ring-0 resize-none bg-transparent text-[15px] leading-relaxed placeholder:text-gray-400 px-6 pt-5 pb-14 max-h-[200px] focus:outline-none rounded-3xl overflow-auto"
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 ">
            <div className="flex-1"></div>

            <div className="flex items-center gap-1">
              <BotPersonaSelect
                botId={botId}
                disabled={disabled}
                onBotChange={onBotChange}
              />
              
              <Button
                onClick={onSubmit}
                disabled={disabled || !value.trim()}
                className="h-9 w-9 p-0 rounded-lg bg-black hover:bg-gray-800 disabled:bg-gray-200 text-white shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 disabled:text-gray-400"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mt-3 px-1">
          <div className="text-xs text-gray-500">
            {value.length > 0 ? (
              <span className="text-gray-400">{value.length} characters</span>
            ) : (
              <>
                <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-600 bg-white border border-gray-200 rounded shadow-sm">
                  Enter
                </kbd>
                <span className="ml-1.5 text-gray-400">to send</span>
                <span className="mx-2 text-gray-300">•</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-600 bg-white border border-gray-200 rounded shadow-sm">
                  Shift + Enter
                </kbd>
                <span className="ml-1.5 text-gray-400">for new line</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}