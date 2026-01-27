import type { ReactNode } from "react";
import TitleBar from "@/shared/components/TitleBar";
import CenterLoading from "@/shared/components/CenterLoading";
import SetupScreen from "@/features/branding/components/SetupScreen";
import SettingsSidebar from "@/features/settings/components/SettingsSidebar";
import WelcomeScreen from "@/features/welcome/components/WelcomeScreen";
import OnboardingScreen from "@/features/onboarding/components/OnboardingScreen";
import { ErrorBanner } from "@/shared/components/ErrorBanner";
import type { Branding, Metadata } from "@/shared/types";
import type { AppError } from "@/shared/errors/errorTypes";

interface AppLayoutProps {
  brandingStatus: string;
  branding: Branding | null;
  logoUrl: string | null;
  companyName: string;
  onboardingCompleted: boolean;
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
  onTestApiKey: (args: { apiKey: string; model: string }) => Promise<void>;
  onCompleteOnboarding: () => void;
  onResetApp: () => void;
  onFileSelect: (file: File) => void;
  onBrandingConfigured: (branding: Branding) => void;
  criticalError?: AppError | null;
  onDismissCriticalError?: () => void;
  onRetryCriticalError?: () => void;
  apiKeyError?: string | null;
  children?: ReactNode;
}

export default function AppLayout({
  brandingStatus,
  branding,
  logoUrl,
  companyName,
  onboardingCompleted,
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
  onTestApiKey,
  onCompleteOnboarding,
  onResetApp,
  onFileSelect,
  onBrandingConfigured,
  criticalError,
  onDismissCriticalError,
  onRetryCriticalError,
  apiKeyError,
  children,
}: AppLayoutProps) {
  // Onboarding is implemented, but temporarily disabled per request.
  // Flip this to `true` when you want onboarding enabled again.
  const ENABLE_ONBOARDING = false;

  const renderContent = () => {
    if (brandingStatus === "loading") {
      return <CenterLoading message="Initializing application..." />;
    }

    if (brandingStatus !== "configured") {
      return (
        <SetupScreen onConfigured={onBrandingConfigured} onReset={onResetApp} />
      );
    }

    if (ENABLE_ONBOARDING && !onboardingCompleted) {
      return (
        <OnboardingScreen
          apiKey={apiKey}
          rememberKey={rememberKey}
          model={model}
          onApiKeyChange={onApiKeyChange}
          onRememberKeyChange={onRememberKeyChange}
          onModelChange={onModelChange}
          onTest={onTestApiKey}
          onContinue={onCompleteOnboarding}
        />
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
          apiKeyError={apiKeyError}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          {criticalError && (
            <div className="px-6 pt-4">
              <ErrorBanner
                error={criticalError}
                onDismiss={onDismissCriticalError}
                onRetry={onRetryCriticalError}
              />
            </div>
          )}
          <div className="flex-1 overflow-auto flex flex-col">
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
