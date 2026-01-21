import { useState, useEffect, useMemo } from "react";
import type { Metadata } from "@/shared/types";
import { storage } from "@/shared/utils/storage";
import { useBranding } from "@/features/branding/hooks/useBranding";
import { useBackend } from "@/shared/hooks/useBackend";
import { useAppSettings } from "./hooks/useAppSettings";
import { useBrandingSync } from "@/features/branding/hooks/useBrandingSync";
import { useFileManagement } from "@/features/file-management/hooks/useFileManagement";
import { useChat } from "@/features/chat/hooks/useChat";
import { useStorageSync } from "@/shared/hooks/useStorageSync";
import { useProductionMode } from "./hooks/useProductionMode";
import { useErrorHandler } from "@/shared/hooks/useErrorHandler";
import AppLayout from "./components/AppLayout";
import ChatView from "@/features/chat/components/ChatView";
import { Toaster } from "@/shared/ui/sonner";
import { toAppError } from "@/shared/errors/errorUtils";

export default function App() {
  useProductionMode();

  const { backendCall } = useBackend();
  const { criticalError, handleError, clearCriticalError, retryCriticalError } =
    useErrorHandler();
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Wrap backendCall to track critical errors and API key errors
  const wrappedBackendCall = useMemo(
    () => async (msg: Record<string, unknown>) => {
      try {
        return await backendCall(msg);
      } catch (error) {
        const appError = toAppError(error);

        // Track API key errors for inline display
        if (appError.category === "api_key") {
          setApiKeyError(appError.message);
        }

        // Handle critical errors
        handleError(appError, { trackCritical: true, showToast: false }); // Don't show toast here, hooks will
        throw appError;
      }
    },
    [backendCall, handleError]
  );
  const {
    branding,
    status: brandingStatus,
    reset: resetBranding,
    setBranding,
    setStatus: setBrandingStatus,
  } = useBranding();

  const { apiKey, setApiKey, model, setModel, rememberKey, setRememberKey } =
    useAppSettings();

  const { companyName, companyUrl, logoUrl } = useBrandingSync({
    branding,
    brandingStatus,
  });

  const [metadata, setMetadata] = useState<Metadata | null>(() =>
    storage.getMetadata<Metadata>()
  );

  const {
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
  } = useChat({
    apiKey,
    model,
    metadata,
    backendCall: wrappedBackendCall,
  });

  const { csvLoaded, isLoadingCsv, loadingMessage, onFileSelect } =
    useFileManagement({
      apiKey,
      model,
      backendCall: wrappedBackendCall,
      onMetadataGenerated: setMetadata,
      onMessagesSet: setMessages,
    });

  // Get csvName and csvBase64 from storage for sync
  const csvName = storage.getCsvName();
  const csvBase64 = storage.getCsvBase64();

  // Sync all state to localStorage
  useStorageSync({
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
  });

  const showChat = Boolean(csvLoaded && metadata);

  // Track API key errors from backend calls
  useEffect(() => {
    // Clear API key error when user changes the key
    if (apiKeyError) {
      const timer = setTimeout(() => setApiKeyError(null), 5000); // Auto-clear after 5s
      return () => clearTimeout(timer);
    }
  }, [apiKey, apiKeyError]);

  const handleRunAnalysis = async () => {
    try {
      await onRunAnalysis();
    } catch (error) {
      // Error is already handled in useChat hook
      console.error("Analysis error:", error);
    }
  };

  const handleRetryCriticalError = () => {
    retryCriticalError();
    // Could trigger a backend health check or retry the last operation
  };

  return (
    <>
      <Toaster />
      <AppLayout
        brandingStatus={brandingStatus}
        branding={branding}
        logoUrl={logoUrl}
        companyName={companyName}
        isLoadingCsv={isLoadingCsv}
        loadingMessage={loadingMessage}
        showChat={showChat}
        apiKey={apiKey}
        rememberKey={rememberKey}
        model={model}
        metadata={metadata}
        onApiKeyChange={(key) => {
          setApiKey(key);
          setApiKeyError(null); // Clear error when user types
        }}
        onRememberKeyChange={setRememberKey}
        onModelChange={setModel}
        onResetApp={resetBranding}
        onFileSelect={onFileSelect}
        onBrandingConfigured={(b) => {
          setBranding(b);
          setBrandingStatus("configured");
        }}
        criticalError={criticalError}
        onDismissCriticalError={clearCriticalError}
        onRetryCriticalError={handleRetryCriticalError}
        apiKeyError={apiKeyError}
      >
        {showChat && metadata && (
          <ChatView
            messages={messages}
            query={query}
            isLoading={isLoading}
            metadata={metadata}
            messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
            onQueryChange={setQuery}
            onRunAnalysis={handleRunAnalysis}
            onNewChat={handleNewChat}
            onNewFile={onFileSelect}
            botId={botId}
            onBotChange={onBotChange}
            logoUrl={logoUrl}
          />
        )}
      </AppLayout>
    </>
  );
}
