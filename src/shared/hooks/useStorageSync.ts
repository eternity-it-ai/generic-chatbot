import { useEffect } from "react";
import { storage } from "@/shared/utils/storage";
import type { Metadata, Message } from "@/shared/types";
import { toAppError, ErrorCode } from "@/shared/errors/errorUtils";
import { showAppError } from "@/shared/errors/toastService";

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
    try {
      if (rememberKey && apiKey) {
        storage.setApiKey(apiKey);
      } else if (!rememberKey) {
        storage.setApiKey(null);
      }
      storage.setRememberKey(rememberKey);
    } catch (error) {
      const appError = toAppError(error, { code: ErrorCode.STORAGE_ERROR, operation: "saveApiKey" });
      showAppError(appError);
    }
  }, [apiKey, rememberKey]);

  useEffect(() => {
    try {
      storage.setModel(model);
    } catch (error) {
      const appError = toAppError(error, { code: ErrorCode.STORAGE_ERROR, operation: "saveModel" });
      showAppError(appError);
    }
  }, [model]);

  useEffect(() => {
    try {
      storage.setCompanyName(companyName);
    } catch (error) {
      const appError = toAppError(error, { code: ErrorCode.STORAGE_ERROR, operation: "saveCompanyName" });
      showAppError(appError);
    }
  }, [companyName]);

  useEffect(() => {
    try {
      storage.setCompanyUrl(companyUrl);
    } catch (error) {
      const appError = toAppError(error, { code: ErrorCode.STORAGE_ERROR, operation: "saveCompanyUrl" });
      showAppError(appError);
    }
  }, [companyUrl]);

  useEffect(() => {
    try {
      storage.setLogoUrl(logoUrl);
    } catch (error) {
      const appError = toAppError(error, { code: ErrorCode.STORAGE_ERROR, operation: "saveLogoUrl" });
      showAppError(appError);
    }
  }, [logoUrl]);

  useEffect(() => {
    try {
      storage.setCsvName(csvName);
    } catch (error) {
      const appError = toAppError(error, { code: ErrorCode.STORAGE_ERROR, operation: "saveCsvName" });
      showAppError(appError);
    }
  }, [csvName]);

  useEffect(() => {
    try {
      storage.setCsvBase64(csvBase64);
    } catch (error) {
      const appError = toAppError(error, { code: ErrorCode.STORAGE_ERROR, operation: "saveCsvBase64" });
      showAppError(appError);
    }
  }, [csvBase64]);

  useEffect(() => {
    try {
      storage.setCsvLoaded(csvLoaded);
    } catch (error) {
      const appError = toAppError(error, { code: ErrorCode.STORAGE_ERROR, operation: "saveCsvLoaded" });
      showAppError(appError);
    }
  }, [csvLoaded]);

  useEffect(() => {
    try {
      storage.setMetadata(metadata);
    } catch (error) {
      const appError = toAppError(error, { code: ErrorCode.STORAGE_ERROR, operation: "saveMetadata" });
      showAppError(appError);
    }
  }, [metadata]);

  useEffect(() => {
    try {
      storage.setMessages(messages);
    } catch (error) {
      const appError = toAppError(error, { code: ErrorCode.STORAGE_ERROR, operation: "saveMessages" });
      showAppError(appError);
    }
  }, [messages]);
}
