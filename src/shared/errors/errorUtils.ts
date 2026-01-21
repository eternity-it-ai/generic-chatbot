import {
  ErrorCode,
  type ErrorCategory,
  type AppError,
  BackendError,
  ApiKeyError,
  ValidationError,
  NetworkError,
  FrontendError,
} from "./errorTypes";

// Re-export ErrorCode for convenience
export { ErrorCode };

/**
 * Parse error message from backend response
 */
export function parseBackendError(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "error" in error) {
    return String((error as { error: unknown }).error);
  }

  return "An unexpected error occurred";
}

/**
 * Categorize error based on error message patterns
 */
export function categorizeError(error: unknown): {
  code: ErrorCode;
  category: ErrorCategory;
  message: string;
} {
  const errorMessage = parseBackendError(error);
  const lowerMessage = errorMessage.toLowerCase();

  // API Key Errors
  if (
    lowerMessage.includes("api key") ||
    lowerMessage.includes("apikey") ||
    lowerMessage.includes("openai_api_key") ||
    lowerMessage.includes("authentication") ||
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("invalid api key") ||
    lowerMessage.includes("api key is required")
  ) {
    if (lowerMessage.includes("required") || lowerMessage.includes("missing")) {
      return {
        code: ErrorCode.MISSING_API_KEY,
        category: "api_key",
        message: "Please enter an API key to continue",
      };
    }
    if (lowerMessage.includes("expired") || lowerMessage.includes("invalid")) {
      return {
        code: ErrorCode.INVALID_API_KEY,
        category: "api_key",
        message: "Invalid API key. Please check your key and try again",
      };
    }
    return {
      code: ErrorCode.INVALID_API_KEY,
      category: "api_key",
      message: "API key error. Please check your key and try again",
    };
  }

  // Backend Errors
  if (
    lowerMessage.includes("backend not running") ||
    lowerMessage.includes("backend service")
  ) {
    return {
      code: ErrorCode.BACKEND_NOT_RUNNING,
      category: "backend",
      message:
        "Backend service is not available. Please restart the application",
    };
  }

  if (
    lowerMessage.includes("backend terminated") ||
    lowerMessage.includes("terminated unexpectedly")
  ) {
    return {
      code: ErrorCode.BACKEND_TERMINATED,
      category: "backend",
      message: "Backend service stopped unexpectedly. Retrying...",
    };
  }

  if (
    lowerMessage.includes("no response from backend") ||
    lowerMessage.includes("backend is not responding")
  ) {
    return {
      code: ErrorCode.BACKEND_NO_RESPONSE,
      category: "backend",
      message: "Backend is not responding. Please check your connection",
    };
  }

  // Validation Errors
  if (
    lowerMessage.includes("csv") &&
    (lowerMessage.includes("required") || lowerMessage.includes("missing"))
  ) {
    return {
      code: ErrorCode.MISSING_CSV,
      category: "validation",
      message: "Please select a CSV file first",
    };
  }

  if (
    lowerMessage.includes("query") &&
    (lowerMessage.includes("required") || lowerMessage.includes("missing"))
  ) {
    return {
      code: ErrorCode.MISSING_QUERY,
      category: "validation",
      message: "Please enter a question",
    };
  }

  if (
    lowerMessage.includes("metadata") &&
    (lowerMessage.includes("required") ||
      lowerMessage.includes("missing") ||
      lowerMessage.includes("no metadata"))
  ) {
    return {
      code: ErrorCode.MISSING_METADATA,
      category: "validation",
      message: "Please generate metadata first",
    };
  }

  if (
    lowerMessage.includes("no dataset loaded") ||
    lowerMessage.includes("call load_csv")
  ) {
    return {
      code: ErrorCode.MISSING_CSV,
      category: "validation",
      message: "Please load a CSV file first",
    };
  }

  // Network Errors
  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return {
      code: ErrorCode.TIMEOUT,
      category: "network",
      message: "Request timed out. Please try again",
    };
  }

  if (
    lowerMessage.includes("cannot connect") ||
    lowerMessage.includes("connection failed") ||
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("network error")
  ) {
    return {
      code: ErrorCode.CONNECTION_FAILED,
      category: "network",
      message: "Cannot connect to backend. Please check your connection",
    };
  }

  // Frontend Errors
  if (
    lowerMessage.includes("file read") ||
    lowerMessage.includes("failed to read file") ||
    lowerMessage.includes("cannot read file")
  ) {
    return {
      code: ErrorCode.FILE_READ_ERROR,
      category: "frontend",
      message: "Failed to read file. Please try selecting the file again",
    };
  }

  if (
    lowerMessage.includes("file too large") ||
    lowerMessage.includes("exceeds maximum size")
  ) {
    return {
      code: ErrorCode.FILE_TOO_LARGE,
      category: "frontend",
      message: "File is too large. Please select a smaller file",
    };
  }

  if (
    lowerMessage.includes("invalid file type") ||
    lowerMessage.includes("unsupported file") ||
    lowerMessage.includes("file type not supported")
  ) {
    return {
      code: ErrorCode.INVALID_FILE_TYPE,
      category: "frontend",
      message: "Invalid file type. Please select a CSV file",
    };
  }

  if (
    lowerMessage.includes("storage") ||
    lowerMessage.includes("localstorage") ||
    lowerMessage.includes("failed to save")
  ) {
    return {
      code: ErrorCode.STORAGE_ERROR,
      category: "frontend",
      message: "Failed to save data. Please try again",
    };
  }

  if (
    lowerMessage.includes("json") &&
    (lowerMessage.includes("parse") || lowerMessage.includes("invalid"))
  ) {
    return {
      code: ErrorCode.JSON_PARSE_ERROR,
      category: "frontend",
      message: "Failed to parse data. Please try again",
    };
  }

  // Encoding Errors - check this before CSV parse errors
  if (
    lowerMessage.includes("utf-8") ||
    lowerMessage.includes("codec") ||
    lowerMessage.includes("can't decode") ||
    lowerMessage.includes("can't decode byte") ||
    lowerMessage.includes("invalid continuation byte") ||
    lowerMessage.includes("encoding error") ||
    lowerMessage.includes("file encoding") ||
    lowerMessage.includes("unsupported encoding") ||
    (lowerMessage.includes("encoding") && lowerMessage.includes("error"))
  ) {
    // Use the backend's user-friendly message if available, otherwise provide default
    if (
      lowerMessage.includes("file encoding error") ||
      lowerMessage.includes("save the file as utf-8")
    ) {
      return {
        code: ErrorCode.FILE_ENCODING_ERROR,
        category: "frontend",
        message: errorMessage, // Use the backend's detailed message
      };
    }
    return {
      code: ErrorCode.FILE_ENCODING_ERROR,
      category: "frontend",
      message:
        "File encoding error. The CSV file may be in an unsupported encoding. Please save it as UTF-8 and try again.",
    };
  }

  // CSV Parse Errors
  if (
    lowerMessage.includes("csv") &&
    (lowerMessage.includes("parse") ||
      lowerMessage.includes("error reading") ||
      lowerMessage.includes("pandas"))
  ) {
    return {
      code: ErrorCode.CSV_PARSE_ERROR,
      category: "frontend",
      message:
        "Failed to parse CSV file. Please check that the file is a valid CSV format.",
    };
  }

  // Default to unknown error with original message
  return {
    code: ErrorCode.UNKNOWN_ERROR,
    category: "unknown",
    message: errorMessage || "An unexpected error occurred",
  };
}

/**
 * Convert error to AppError instance
 */
export function toAppError(
  error: unknown,
  context?: Record<string, unknown>
): AppError {
  const { code, category, message } = categorizeError(error);

  switch (category) {
    case "api_key":
      return new ApiKeyError(message, code, error, context);
    case "backend":
      return new BackendError(message, code, error, context);
    case "validation":
      return new ValidationError(message, code, error, context);
    case "network":
      return new NetworkError(message, code, error, context);
    case "frontend":
      return new FrontendError(message, code, error, context);
    default:
      return new BackendError(message, code, error, context);
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  return categorizeError(error).message;
}

/**
 * Check if error is a critical system error that should show a banner
 */
export function isCriticalError(error: AppError): boolean {
  return (
    error.code === ErrorCode.BACKEND_NOT_RUNNING ||
    error.code === ErrorCode.BACKEND_TERMINATED ||
    error.code === ErrorCode.BACKEND_NO_RESPONSE ||
    error.code === ErrorCode.BACKEND_CONNECTION_FAILED
  );
}
