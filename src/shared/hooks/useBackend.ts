import { useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { BackendResponse } from "@/shared/types";
import { toAppError, getUserFriendlyMessage } from "@/shared/errors/errorUtils";
import type { AppError } from "@/shared/errors/errorTypes";

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
      try {
        const line = await invoke<string>("backend_call", {
          msgJson: JSON.stringify(msg),
        });

        let parsed: BackendResponse;
        try {
          parsed = JSON.parse(line) as BackendResponse;
        } catch (parseError) {
          const error = toAppError(parseError, {
            command: msg.cmd,
            rawResponse: line,
          });
          if (options?.suppressErrors) {
            throw error;
          }
          throw error;
        }

        if (!parsed.ok) {
          const error = toAppError(parsed.error, {
            command: msg.cmd,
            payload: msg.payload,
          });
          if (options?.suppressErrors) {
            throw error;
          }
          throw error;
        }

        return parsed.result;
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
            ? (error as AppError)
            : toAppError(error, {
                command: msg.cmd,
                payload: msg.payload,
              });

        if (options?.suppressErrors) {
          throw appError;
        }
        throw appError;
      }
    };
  }, []);

  return { backendCall };
}
