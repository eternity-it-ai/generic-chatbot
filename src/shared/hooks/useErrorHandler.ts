import { useState, useCallback } from "react";
import { showAppError } from "@/shared/errors/toastService";
import { toAppError, isCriticalError } from "@/shared/errors/errorUtils";
import type { AppError } from "@/shared/errors/errorTypes";

/**
 * Hook for handling errors with toast notifications and critical error tracking
 */
export function useErrorHandler() {
  const [criticalError, setCriticalError] = useState<AppError | null>(null);

  const handleError = useCallback(
    (error: unknown, options?: { showToast?: boolean; trackCritical?: boolean }) => {
      const appError = toAppError(error);
      
      // Show toast by default
      if (options?.showToast !== false) {
        showAppError(appError);
      }

      // Track critical errors
      if (options?.trackCritical !== false && isCriticalError(appError)) {
        setCriticalError(appError);
      } else if (!isCriticalError(appError)) {
        // Clear critical error if this is not a critical error
        setCriticalError(null);
      }

      return appError;
    },
    []
  );

  const clearCriticalError = useCallback(() => {
    setCriticalError(null);
  }, []);

  const retryCriticalError = useCallback(() => {
    setCriticalError(null);
    // The caller should handle the retry logic
  }, []);

  return {
    criticalError,
    handleError,
    clearCriticalError,
    retryCriticalError,
  };
}
