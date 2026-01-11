import { useState, useEffect, useRef } from "react";
import type { Message, Metadata } from "@/shared/types";
import { storage } from "@/shared/utils/storage";

interface UseChatProps {
  apiKey: string;
  model: string;
  metadata: Metadata | null;
  backendCall: (msg: Record<string, unknown>) => Promise<unknown>;
}

export function useChat({ apiKey, model, metadata, backendCall }: UseChatProps) {
  const [query, setQuery] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>(() =>
    storage.getMessages<Message>()
  );
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const onRunAnalysis = async () => {
    if (!apiKey) {
      throw new Error("Please enter an API key first.");
    }
    if (!query.trim()) {
      throw new Error("Please enter a question.");
    }
    if (!metadata) {
      throw new Error("Please generate metadata first.");
    }

    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query;
    setQuery("");
    setIsLoading(true);

    try {
      const res = await backendCall({
        cmd: "run_analysis",
        payload: { openai_api_key: apiKey, model, query: currentQuery },
      });
      const assistantMessage: Message = {
        role: "assistant",
        content: String((res as { answer?: string }).answer ?? ""),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: unknown) {
      const errorMessageText = e instanceof Error ? e.message : String(e);
      const errorMessage: Message = {
        role: "assistant",
        content: `I encountered an error: ${errorMessageText}. Please try rephrasing your question.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
      throw e;
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
    isLoading,
    messagesEndRef,
    onRunAnalysis,
    handleNewChat,
  };
}
