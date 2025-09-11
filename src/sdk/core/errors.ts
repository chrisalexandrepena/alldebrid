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

// Enhanced error classes that extend Error for proper exception throwing
export abstract class SdkError extends Error {
  abstract readonly type: string;
  abstract readonly retryable: boolean;
  readonly requestId?: string;
  readonly timestamp: Date;

  constructor(message: string, requestId?: string) {
    super(message);
    this.name = this.constructor.name;
    this.requestId = requestId;
    this.timestamp = new Date();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NetworkError extends SdkError {
  readonly type = "network" as const;
  readonly cause: Error;
  readonly retryable: boolean;
  readonly statusCode?: number;

  constructor(cause: Error, statusCode?: number, requestId?: string) {
    const message = statusCode 
      ? `Network error (${statusCode}): ${cause.message}`
      : `Network error: ${cause.message}`;
    super(message, requestId);
    this.cause = cause;
    this.statusCode = statusCode;
    this.retryable = isRetryableHttpError(cause, statusCode);
  }
}

export class ApiError extends SdkError {
  readonly type = "api" as const;
  readonly subtype: "auth" | "rateLimit" | "notFound" | "unknown";
  readonly code: string;
  readonly originalMessage: string;
  readonly retryable: boolean;
  readonly demo?: boolean;

  constructor(apiError: ApiErrorResponse, demo = false, requestId?: string) {
    super(`API error (${apiError.code}): ${apiError.message}`, requestId);
    this.code = apiError.code;
    this.originalMessage = apiError.message;
    this.subtype = determineApiErrorSubtype(apiError.code);
    this.retryable = this.subtype === "rateLimit";
    this.demo = demo;
  }
}

export class ValidationError extends SdkError {
  readonly type = "validation" as const;
  readonly retryable = false;
  readonly issues: ZodError["issues"];

  constructor(zodError: ZodError, requestId?: string) {
    const issueMessages = zodError.issues.map(issue => 
      `${issue.path.join('.')}: ${issue.message}`
    ).join(', ');
    super(`Validation error: ${issueMessages}`, requestId);
    this.issues = zodError.issues;
  }
}

export class ConfigurationError extends SdkError {
  readonly type = "configuration" as const;
  readonly retryable = false;

  constructor(message: string) {
    super(`Configuration error: ${message}`);
  }
}

// Error factory functions - now return error instances instead of plain objects
export function createNetworkError(
  cause: Error,
  statusCode?: number,
  requestId?: string,
): NetworkError {
  return new NetworkError(cause, statusCode, requestId);
}

export function createApiError(
  apiError: ApiErrorResponse,
  demo = false,
  requestId?: string,
): ApiError {
  return new ApiError(apiError, demo, requestId);
}

export function createValidationError(
  zodError: ZodError,
  requestId?: string,
): ValidationError {
  return new ValidationError(zodError, requestId);
}

export function createConfigurationError(message: string): ConfigurationError {
  return new ConfigurationError(message);
}

// Helper functions
function isRetryableHttpError(error: Error, statusCode?: number): boolean {
  if (statusCode !== undefined) return statusCode >= 500 || statusCode === 429;

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
  if (result.ok) return { ok: true, data: fn(result.data) };
  return result;
}

export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  if (result.ok) return result;
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
    if (result.ok) successes.push(result.data);
    else failures.push({ index, error: result.error });
  });

  return { successes, failures };
}
