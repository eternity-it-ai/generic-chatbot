import { MessageSquare } from "lucide-react";
import type { Message, Metadata } from "@/shared/types";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import LoadingIndicator from "@/shared/components/LoadingIndicator";
import DataHealthBox from "@/features/data-analysis/components/DataHealthBox";
import StatisticsCards from "@/features/data-analysis/components/StatisticsCards";

interface ChatViewProps {
  messages: Message[];
  query: string;
  isLoading: boolean;
  metadata: Metadata;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onQueryChange: (value: string) => void;
  onRunAnalysis: () => Promise<void>;
  onNewChat: () => void;
  onNewFile: (file: File) => void;
}

export default function ChatView({
  messages,
  query,
  isLoading,
  metadata,
  messagesEndRef,
  onQueryChange,
  onRunAnalysis,
  onNewChat,
  onNewFile,
}: ChatViewProps) {
  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <ChatHeader onNewChat={onNewChat} onNewFile={onNewFile} />

      <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-200 space-y-4 flex-shrink-0">
        <DataHealthBox metadata={metadata} />
        <StatisticsCards metadata={metadata} />
      </div>

      <div className="flex-1 min-h-0 w-full overflow-y-auto px-4 sm:px-6 py-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-500 max-w-md">
                Ask questions about your data to get insights and analysis. Try
                asking about trends, patterns, or specific metrics.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
              ))}
              {isLoading && <LoadingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            value={query}
            onChange={onQueryChange}
            onSubmit={onRunAnalysis}
            disabled={isLoading}
            placeholder="Ask about strategy..."
          />
        </div>
      </div>
    </div>
  );
}
