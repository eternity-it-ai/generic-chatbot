import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Branding } from "@/shared/types";

export type BrandingStatus = "loading" | "configured" | "needs_setup" | "error";

export function useBranding() {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [status, setStatus] = useState<BrandingStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const loadBranding = useCallback(async () => {
    setStatus("loading");
    try {
      const b = await invoke<Branding | null>("get_branding");
      if (b && b.configured) {
        setBranding(b);
        setStatus("configured");
      } else {
        setBranding(null);
        setStatus("needs_setup");
      }
      setError(null);
    } catch (e) {
      console.error("Failed to load branding:", e);
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  const reset = useCallback(async () => {
    try {
      await invoke("clear_branding");
      setBranding(null);
      setStatus("needs_setup");
      setError(null);
    } catch (e) {
      console.error("Failed to clear branding:", e);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    // Defer state updates to avoid doing them synchronously in the effect body.
    void Promise.resolve().then(() => loadBranding());
  }, [loadBranding]);

  return {
    branding,
    status,
    error,
    reload: loadBranding,
    reset,
    setBranding,
    setStatus,
  };
}
