import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Branding } from "@/shared/types";
import { storage } from "@/shared/utils/storage";

interface UseBrandingSyncProps {
  branding: Branding | null;
  brandingStatus: string;
}

export function useBrandingSync({
  branding,
  brandingStatus,
}: UseBrandingSyncProps) {
  const [companyName, setCompanyName] = useState(() =>
    storage.getCompanyName()
  );
  const [companyUrl, setCompanyUrl] = useState(() => storage.getCompanyUrl());
  const [logoUrl, setLogoUrl] = useState<string | null>(() =>
    storage.getLogoUrl()
  );

  // Sync branding results into local UI state
  useEffect(() => {
    const syncBranding = async () => {
      if (branding && brandingStatus === "configured") {
        if (branding.payload.companyName)
          setCompanyName(branding.payload.companyName);
        if (branding.payload.companyDomain) {
          setCompanyUrl(branding.payload.companyDomain);

          try {
            // Priority 1: Check for local logo as data URL
            const logoDataUrl = await invoke<string | null>(
              "get_logo_data_url"
            );
            if (logoDataUrl) {
              setLogoUrl(logoDataUrl);
            } else {
              // Priority 2: Derive from domain
              const cleanDomain = branding.payload.companyDomain
                .replace("https://", "")
                .replace("http://", "")
                .split("/")[0];
              setLogoUrl(
                `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`
              );
            }
          } catch (e) {
            console.error("Error getting local logo path:", e);
            // Fallback to domain derivation
            const cleanDomain = branding.payload.companyDomain
              .replace("https://", "")
              .replace("http://", "")
              .split("/")[0];
            setLogoUrl(
              `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`
            );
          }
        }
      }
    };

    syncBranding();
  }, [branding, brandingStatus]);

  return {
    companyName,
    setCompanyName,
    companyUrl,
    setCompanyUrl,
    logoUrl,
    setLogoUrl,
  };
}
