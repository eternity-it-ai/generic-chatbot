import { useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { BackendResponse } from "@/shared/types";
import { toAppError } from "@/shared/errors/errorUtils";
import type { AppError } from "@/shared/errors/errorTypes";
import { ErrorCode } from "@/shared/errors/errorTypes";
import { storage } from "@/shared/utils/storage";

export interface BackendCallOptions {
  cmd: string;
  payload?: Record<string, unknown>;
}

export function useBackend() {
  const backendCall = useMemo(() => {
    return async (
      msg: Record<string, unknown>,
      options?: { suppressErrors?: boolean }
    ): Promise<unknown> => {
      const callOnce = async (m: Record<string, unknown>): Promise<unknown> => {
        const line = await invoke<string>("backend_call", {
          msgJson: JSON.stringify(m),
        });

        let parsed: BackendResponse;
        try {
          parsed = JSON.parse(line) as BackendResponse;
        } catch (parseError) {
          throw toAppError(parseError, {
            command: m.cmd,
            rawResponse: line,
          });
        }

        if (!parsed.ok) {
          throw toAppError(parsed.error, {
            command: m.cmd,
            payload: m.payload,
          });
        }

        return parsed.result;
      };

      try {
        // First attempt
        return await callOnce(msg);
      } catch (error) {
        // Handle Tauri-specific errors
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();

          // Check for Tauri backend errors
          if (
            errorMessage.includes("backend not running") ||
            errorMessage.includes("backend terminated") ||
            errorMessage.includes("no response from backend")
          ) {
            const appError = toAppError(error, {
              command: msg.cmd,
              payload: msg.payload,
            });
            if (options?.suppressErrors) {
              throw appError;
            }
            throw appError;
          }
        }

        // Convert to AppError if not already
        const appError =
          error instanceof Error && "code" in error
            ? (error as unknown as AppError)
            : toAppError(error, {
                command: msg.cmd,
                payload: msg.payload,
              });

        // If the backend restarted (e.g., after app update), the UI may still have a
        // loaded CSV + metadata in localStorage while the backend process lost its in-memory state.
        // In that case, silently rehydrate the backend and retry once.
        const cmd = typeof msg.cmd === "string" ? msg.cmd : "";
        const shouldRetry = cmd !== "load_csv" && cmd !== "set_metadata";

        if (shouldRetry && appError.code === ErrorCode.MISSING_CSV) {
          const csvBase64 = storage.getCsvBase64();
          if (csvBase64) {
            try {
              await callOnce({
                cmd: "load_csv",
                payload: { csv_base64: csvBase64 },
              });
              storage.setCsvLoaded(true);
              return await callOnce(msg);
            } catch {
              // Fall through to throw original error
            }
          }
        }

        if (shouldRetry && appError.code === ErrorCode.MISSING_METADATA) {
          const metadata = storage.getMetadata<Record<string, unknown>>();
          if (metadata) {
            try {
              await callOnce({
                cmd: "set_metadata",
                payload: { metadata },
              });
              return await callOnce(msg);
            } catch {
              // Fall through to throw original error
            }
          }
        }

        if (options?.suppressErrors) {
          throw appError;
        }
        throw appError;
      }
    };
  }, []);

  return { backendCall };
}
