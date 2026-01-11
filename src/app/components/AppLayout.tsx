import type { ReactNode } from "react";
import TitleBar from "@/shared/components/TitleBar";
import CenterLoading from "@/shared/components/CenterLoading";
import SetupScreen from "@/features/branding/components/SetupScreen";
import SettingsSidebar from "@/features/settings/components/SettingsSidebar";
import WelcomeScreen from "@/features/welcome/components/WelcomeScreen";
import type { Branding, Metadata } from "@/shared/types";

interface AppLayoutProps {
  brandingStatus: string;
  branding: Branding | null;
  logoUrl: string | null;
  companyName: string;
  isLoadingCsv: boolean;
  loadingMessage: string;
  showChat: boolean;
  apiKey: string;
  rememberKey: boolean;
  model: string;
  metadata: Metadata | null;
  onApiKeyChange: (key: string) => void;
  onRememberKeyChange: (remember: boolean) => void;
  onModelChange: (model: string) => void;
  onResetApp: () => void;
  onFileSelect: (file: File) => void;
  onBrandingConfigured: (branding: Branding) => void;
  children?: ReactNode;
}

export default function AppLayout({
  brandingStatus,
  branding,
  logoUrl,
  companyName,
  isLoadingCsv,
  loadingMessage,
  showChat,
  apiKey,
  rememberKey,
  model,
  metadata,
  onApiKeyChange,
  onRememberKeyChange,
  onModelChange,
  onResetApp,
  onFileSelect,
  onBrandingConfigured,
  children,
}: AppLayoutProps) {
  const renderContent = () => {
    if (brandingStatus === "loading") {
      return <CenterLoading message="Initializing application..." />;
    }

    if (brandingStatus !== "configured") {
      return (
        <SetupScreen onConfigured={onBrandingConfigured} onReset={onResetApp} />
      );
    }

    return (
      <div className="flex flex-1 overflow-hidden pt-10">
        <SettingsSidebar
          apiKey={apiKey}
          rememberKey={rememberKey}
          model={model}
          metadata={metadata}
          onApiKeyChange={onApiKeyChange}
          onRememberKeyChange={onRememberKeyChange}
          onModelChange={onModelChange}
          branding={branding}
          logoUrl={logoUrl}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-scroll flex flex-col">
            {isLoadingCsv ? (
              <CenterLoading message={loadingMessage} />
            ) : !showChat ? (
              <div className="flex-1 overflow-y-auto">
                <WelcomeScreen
                  onFileSelect={onFileSelect}
                  branding={branding || undefined}
                  logoUrl={logoUrl}
                />
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden relative">
      <TitleBar
        companyName={companyName}
        logoUrl={logoUrl}
        onSignOut={onResetApp}
      />
      {renderContent()}
    </div>
  );
}
