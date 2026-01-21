/**
 * Error types and categories for the application
 */

export enum ErrorCode {
  // API Key Errors
  MISSING_API_KEY = "MISSING_API_KEY",
  INVALID_API_KEY = "INVALID_API_KEY",
  EXPIRED_API_KEY = "EXPIRED_API_KEY",
  
  // Backend Errors
  BACKEND_NOT_RUNNING = "BACKEND_NOT_RUNNING",
  BACKEND_TERMINATED = "BACKEND_TERMINATED",
  BACKEND_NO_RESPONSE = "BACKEND_NO_RESPONSE",
  BACKEND_CONNECTION_FAILED = "BACKEND_CONNECTION_FAILED",
  
  // Validation Errors
  MISSING_CSV = "MISSING_CSV",
  MISSING_QUERY = "MISSING_QUERY",
  MISSING_METADATA = "MISSING_METADATA",
  INVALID_CSV = "INVALID_CSV",
  
  // Network Errors
  TIMEOUT = "TIMEOUT",
  CONNECTION_FAILED = "CONNECTION_FAILED",
  
  // Frontend Errors
  FILE_READ_ERROR = "FILE_READ_ERROR",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  FILE_ENCODING_ERROR = "FILE_ENCODING_ERROR",
  CSV_PARSE_ERROR = "CSV_PARSE_ERROR",
  STORAGE_ERROR = "STORAGE_ERROR",
  JSON_PARSE_ERROR = "JSON_PARSE_ERROR",
  
  // Unknown Errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// Export as both type and const for better compatibility
export type ErrorCategory = 
  | "api_key"
  | "backend"
  | "validation"
  | "network"
  | "frontend"
  | "unknown";

// Also export as a const array for runtime checks (optional)
export const ERROR_CATEGORIES = [
  "api_key",
  "backend",
  "validation",
  "network",
  "frontend",
  "unknown",
] as const;

export type AppError = {
  code: ErrorCode;
  category: ErrorCategory;
  message: string;
  originalError?: unknown;
  context?: Record<string, unknown>;
};

export class BackendError extends Error implements AppError {
  code: ErrorCode;
  category: ErrorCategory = "backend";
  originalError?: unknown;
  context?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "BackendError";
    this.code = code;
    this.originalError = originalError;
    this.context = context;
  }
}

export class ApiKeyError extends Error implements AppError {
  code: ErrorCode;
  category: ErrorCategory = "api_key";
  originalError?: unknown;
  context?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INVALID_API_KEY,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiKeyError";
    this.code = code;
    this.originalError = originalError;
    this.context = context;
  }
}

export class ValidationError extends Error implements AppError {
  code: ErrorCode;
  category: ErrorCategory = "validation";
  originalError?: unknown;
  context?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.originalError = originalError;
    this.context = context;
  }
}

export class NetworkError extends Error implements AppError {
  code: ErrorCode;
  category: ErrorCategory = "network";
  originalError?: unknown;
  context?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.CONNECTION_FAILED,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "NetworkError";
    this.code = code;
    this.originalError = originalError;
    this.context = context;
  }
}

export class FrontendError extends Error implements AppError {
  code: ErrorCode;
  category: ErrorCategory = "frontend";
  originalError?: unknown;
  context?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "FrontendError";
    this.code = code;
    this.originalError = originalError;
    this.context = context;
  }
}
