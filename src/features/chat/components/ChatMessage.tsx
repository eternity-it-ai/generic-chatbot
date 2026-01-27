import { memo, useState } from "react";
import { Copy, Check, User } from "lucide-react";
import type { Message } from "@/shared/types";
import MarkdonwText from "@/shared/ui/complete/MarkdonwText";
import { copyToClipboard } from "@/shared/utils/clipboard";

interface ChatMessageProps {
  message: Message;
  logoUrl?: string | null;
}

function ChatMessage({ message, logoUrl }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}
      style={{
        animation: "fadeInUp 0.3s ease-out",
      }}
    >
      <div
        className={`flex items-start gap-3 max-w-[80%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden ${
            isUser ? "bg-transparent text-white" : "bg-gray-200 text-gray-600"
          }`}
        >
          {isUser ? (
            logoUrl ? (
              <img
                src={logoUrl}
                alt="User"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-5 w-5" />
            )
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={`group relative rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md"
              : "bg-white text-gray-800 rounded-bl-md border border-gray-100 shadow-sm"
          }`}
          data-selectable="true"
        >
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`absolute top-2 ${
              isUser ? "left-2" : "right-2"
            } opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md ${
              isUser
                ? "bg-blue-500/80 hover:bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
            title="Copy message"
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          <div className="leading-relaxed text-[15px] select-text">
            <MarkdonwText>{message.content}</MarkdonwText>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ChatMessage);
