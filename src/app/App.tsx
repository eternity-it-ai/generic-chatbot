import { useState } from "react";
import type { Metadata, Message } from "@/shared/types";
import { storage } from "@/shared/utils/storage";
import { useBranding } from "@/features/branding/hooks/useBranding";
import { useBackend } from "@/shared/hooks/useBackend";
import { useAppSettings } from "./hooks/useAppSettings";
import { useBrandingSync } from "@/features/branding/hooks/useBrandingSync";
import { useFileManagement } from "@/features/file-management/hooks/useFileManagement";
import { useChat } from "@/features/chat/hooks/useChat";
import { useStorageSync } from "@/shared/hooks/useStorageSync";
import { useProductionMode } from "./hooks/useProductionMode";
import AppLayout from "./components/AppLayout";
import ChatView from "@/features/chat/components/ChatView";

export default function App() {
  useProductionMode();

  const { backendCall } = useBackend();
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
    isLoading,
    messagesEndRef,
    onRunAnalysis,
    handleNewChat,
  } = useChat({
    apiKey,
    model,
    metadata,
    backendCall,
  });

  const { csvLoaded, isLoadingCsv, loadingMessage, onFileSelect } =
    useFileManagement({
      apiKey,
      model,
      backendCall,
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

  const showChat = csvLoaded && metadata;

  const handleRunAnalysis = async () => {
    try {
      await onRunAnalysis();
    } catch (error) {
      // Error is already handled in useChat hook
      console.error("Analysis error:", error);
    }
  };

  return (
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
      onApiKeyChange={setApiKey}
      onRememberKeyChange={setRememberKey}
      onModelChange={setModel}
      onResetApp={resetBranding}
      onFileSelect={onFileSelect}
      onBrandingConfigured={(b) => {
        setBranding(b);
        setBrandingStatus("configured");
      }}
    >
      {showChat && metadata && (
        <ChatView
          messages={messages}
          query={query}
          isLoading={isLoading}
          metadata={metadata}
          messagesEndRef={messagesEndRef}
          onQueryChange={setQuery}
          onRunAnalysis={handleRunAnalysis}
          onNewChat={handleNewChat}
          onNewFile={onFileSelect}
        />
      )}
    </AppLayout>
  );
}
