import { useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { BackendResponse } from "@/shared/types";

export function useBackend() {
  const backendCall = useMemo(() => {
    return async (msg: Record<string, unknown>) => {
      const line = await invoke<string>("backend_call", {
        msgJson: JSON.stringify(msg),
      });

      const parsed = JSON.parse(line) as BackendResponse;
      if (!parsed.ok) throw new Error(parsed.error);
      return parsed.result;
    };
  }, []);

  return { backendCall };
}
