import { toast } from "sonner";
import type { AppError } from "./errorTypes";

/**
 * Centralized toast notification service
 */

const TOAST_DURATIONS = {
  error: 5000,
  warning: 4000,
  info: 3000,
  success: 3000,
} as const;

/**
 * Show error toast notification
 */
export function showError(
  error: unknown,
  options?: {
    title?: string;
    description?: string;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }
): void {
  const errorMessage =
    options?.description ||
    (error instanceof Error ? error.message : String(error));
  const title = options?.title || "Error";

  toast.error(title, {
    description: errorMessage,
    duration: options?.duration ?? TOAST_DURATIONS.error,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
  });
}

/**
 * Show success toast notification
 */
export function showSuccess(
  message: string,
  options?: {
    title?: string;
    duration?: number;
  }
): void {
  toast.success(options?.title || "Success", {
    description: message,
    duration: options?.duration ?? TOAST_DURATIONS.success,
  });
}

/**
 * Show warning toast notification
 */
export function showWarning(
  message: string,
  options?: {
    title?: string;
    duration?: number;
  }
): void {
  toast.warning(options?.title || "Warning", {
    description: message,
    duration: options?.duration ?? TOAST_DURATIONS.warning,
  });
}

/**
 * Show info toast notification
 */
export function showInfo(
  message: string,
  options?: {
    title?: string;
    duration?: number;
  }
): void {
  toast.info(options?.title || "Info", {
    description: message,
    duration: options?.duration ?? TOAST_DURATIONS.info,
  });
}

/**
 * Show error from AppError instance
 */
export function showAppError(error: AppError, options?: { action?: { label: string; onClick: () => void } }): void {
  showError(error, {
    title: getErrorTitle(error),
    description: error.message,
    action: options?.action,
  });
}

/**
 * Get error title based on error category
 */
function getErrorTitle(error: AppError): string {
  switch (error.category) {
    case "api_key":
      return "API Key Error";
    case "backend":
      return "Backend Error";
    case "validation":
      return "Validation Error";
    case "network":
      return "Connection Error";
    case "frontend":
      return "Application Error";
    default:
      return "Error";
  }
}
