import { useState, useEffect, useRef, useCallback } from "react";
import type { BotId, Message, Metadata } from "@/shared/types";
import { storage } from "@/shared/utils/storage";
import { showAppError } from "@/shared/errors/toastService";
import { toAppError, ErrorCode } from "@/shared/errors/errorUtils";

interface UseChatProps {
  apiKey: string;
  model: string;
  metadata: Metadata | null;
  backendCall: (msg: Record<string, unknown>) => Promise<unknown>;
}

export function useChat({
  apiKey,
  model,
  metadata,
  backendCall,
}: UseChatProps) {
  const [query, setQuery] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>(() =>
    storage.getMessages<Message>()
  );
  const [botId, setBotId] = useState<BotId>(() => storage.getBotId());
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const onBotChange = useCallback((nextBotId: BotId) => {
    setBotId(nextBotId);
    storage.setBotId(nextBotId);
  }, []);

  const onRunAnalysis = async () => {
    if (!apiKey) {
      const error = toAppError(new Error("Please enter an API key first."), {
        code: ErrorCode.MISSING_API_KEY,
      });
      showAppError(error);
      throw error;
    }
    if (!query.trim()) {
      const error = toAppError(new Error("Please enter a question."), {
        code: ErrorCode.MISSING_QUERY,
      });
      showAppError(error);
      throw error;
    }
    if (!metadata) {
      const error = toAppError(new Error("Please generate metadata first."), {
        code: ErrorCode.MISSING_METADATA,
      });
      showAppError(error);
      throw error;
    }

    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query;
    setQuery("");
    setIsLoading(true);

    try {
      const res = await backendCall({
        cmd: "run_analysis",
        payload: { openai_api_key: apiKey, model, query: currentQuery, bot_id: botId },
      });
      const assistantMessage: Message = {
        role: "assistant",
        content: String((res as { answer?: string }).answer ?? ""),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: unknown) {
      // Show toast notification for error
      const appError = toAppError(e, {
        command: "run_analysis",
        query: currentQuery,
      });
      showAppError(appError);

      // Don't add error message to chat - user sees toast instead
      // Remove the user message since the operation failed
      setMessages((prev) => prev.slice(0, -1));
      throw appError;
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setQuery("");
  };

  return {
    query,
    setQuery,
    messages,
    setMessages,
    botId,
    onBotChange,
    isLoading,
    messagesEndRef,
    onRunAnalysis,
    handleNewChat,
  };
}
