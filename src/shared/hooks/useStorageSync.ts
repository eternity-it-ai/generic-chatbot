import { useEffect } from "react";
import { storage } from "@/shared/utils/storage";
import type { Metadata, Message } from "@/shared/types";

interface UseStorageSyncProps {
  apiKey: string;
  rememberKey: boolean;
  model: string;
  companyName: string;
  companyUrl: string;
  logoUrl: string | null;
  csvName: string;
  csvBase64: string;
  csvLoaded: boolean;
  metadata: Metadata | null;
  messages: Message[];
}

export function useStorageSync({
  apiKey,
  rememberKey,
  model,
  companyName,
  companyUrl,
  logoUrl,
  csvName,
  csvBase64,
  csvLoaded,
  metadata,
  messages,
}: UseStorageSyncProps) {
  // Save to localStorage whenever values change
  useEffect(() => {
    if (rememberKey && apiKey) {
      storage.setApiKey(apiKey);
    } else if (!rememberKey) {
      storage.setApiKey(null);
    }
    storage.setRememberKey(rememberKey);
  }, [apiKey, rememberKey]);

  useEffect(() => {
    storage.setModel(model);
  }, [model]);

  useEffect(() => {
    storage.setCompanyName(companyName);
  }, [companyName]);

  useEffect(() => {
    storage.setCompanyUrl(companyUrl);
  }, [companyUrl]);

  useEffect(() => {
    storage.setLogoUrl(logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    storage.setCsvName(csvName);
  }, [csvName]);

  useEffect(() => {
    storage.setCsvBase64(csvBase64);
  }, [csvBase64]);

  useEffect(() => {
    storage.setCsvLoaded(csvLoaded);
  }, [csvLoaded]);

  useEffect(() => {
    storage.setMetadata(metadata);
  }, [metadata]);

  useEffect(() => {
    storage.setMessages(messages);
  }, [messages]);
}
