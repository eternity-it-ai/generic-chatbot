import { X, AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import type { AppError } from "@/shared/errors/errorTypes";

interface ErrorBannerProps {
  error: AppError;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({
  error,
  onDismiss,
  onRetry,
  className,
}: ErrorBannerProps) {
  return (
    <Alert
      variant="destructive"
      className={`mb-4 ${className || ""}`}
      role="alert"
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{getErrorTitle(error)}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p>{error.message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

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
