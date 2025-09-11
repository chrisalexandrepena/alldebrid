import { z, type ZodError } from "zod";

export const ApiErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// Result type for explicit error handling
export type ResultSuccess<T> = { ok: true; data: T };
export type ResultError<E> = { ok: false; error: E };
export type Result<T, E = SdkError> = ResultSuccess<T> | ResultError<E>;

// Enhanced error types with context and retry information
export type SdkError =
  | NetworkError
  | ApiError
  | ValidationError
  | ConfigurationError;

export interface NetworkError {
  type: "network";
  cause: Error;
  retryable: boolean;
  statusCode?: number;
  requestId?: string;
  timestamp: Date;
}

export interface ApiError {
  type: "api";
  subtype: "auth" | "rateLimit" | "notFound" | "unknown";
  code: string;
  message: string;
  retryable: boolean;
  demo?: boolean;
  requestId?: string;
  timestamp: Date;
}

export interface ValidationError {
  type: "validation";
  issues: ZodError["issues"];
  retryable: false;
  requestId?: string;
  timestamp: Date;
}

export interface ConfigurationError {
  type: "configuration";
  message: string;
  retryable: false;
  timestamp: Date;
}

// Error factory functions
export function createNetworkError(
  cause: Error,
  statusCode?: number,
  requestId?: string,
): NetworkError {
  const retryable = isRetryableHttpError(cause, statusCode);
  return {
    type: "network",
    cause,
    retryable,
    statusCode,
    requestId,
    timestamp: new Date(),
  };
}

export function createApiError(
  apiError: ApiErrorResponse,
  demo = false,
  requestId?: string,
): ApiError {
  const subtype = determineApiErrorSubtype(apiError.code);
  return {
    type: "api",
    subtype,
    code: apiError.code,
    message: apiError.message,
    retryable: subtype === "rateLimit",
    demo,
    requestId,
    timestamp: new Date(),
  };
}

export function createValidationError(
  zodError: ZodError,
  requestId?: string,
): ValidationError {
  return {
    type: "validation",
    issues: zodError.issues,
    retryable: false,
    requestId,
    timestamp: new Date(),
  };
}

export function createConfigurationError(message: string): ConfigurationError {
  return {
    type: "configuration",
    message,
    retryable: false,
    timestamp: new Date(),
  };
}

// Helper functions
function isRetryableHttpError(error: Error, statusCode?: number): boolean {
  if (statusCode !== undefined) {
    return statusCode >= 500 || statusCode === 429;
  }

  const axiosLikeError = error as { code?: string };
  return (
    axiosLikeError.code === "ECONNRESET" ||
    axiosLikeError.code === "ETIMEDOUT" ||
    axiosLikeError.code === "ENOTFOUND"
  );
}

function determineApiErrorSubtype(code: string): ApiError["subtype"] {
  const upperCode = code.toUpperCase();
  if (upperCode.startsWith("AUTH")) return "auth";
  if (upperCode.includes("RATE") || upperCode.includes("LIMIT"))
    return "rateLimit";
  if (upperCode.includes("NOT_FOUND") || upperCode.includes("UNKNOWN_TORRENT"))
    return "notFound";
  return "unknown";
}

// Utility functions for working with Results
export function isOk<T, E>(
  result: Result<T, E>,
): result is { ok: true; data: T } {
  return result.ok;
}

export function isError<T, E>(
  result: Result<T, E>,
): result is { ok: false; error: E } {
  return !result.ok;
}

export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U,
): Result<U, E> {
  if (result.ok) {
    return { ok: true, data: fn(result.data) };
  }
  return result;
}

export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  if (result.ok) {
    return result;
  }
  return { ok: false, error: fn(result.error) };
}

// For batch operations - collect successes and failures
export interface BatchResult<T> {
  successes: T[];
  failures: Array<{ index: number; error: SdkError }>;
}

export function createBatchResult<T>(
  results: Result<T, SdkError>[],
): BatchResult<T> {
  const successes: T[] = [];
  const failures: Array<{ index: number; error: SdkError }> = [];

  results.forEach((result, index) => {
    if (result.ok) {
      successes.push(result.data);
    } else {
      failures.push({ index, error: result.error });
    }
  });

  return { successes, failures };
}
