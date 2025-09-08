import { z } from "zod";

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export class AlldebridApiError extends Error {
  code: string;
  demo: boolean;
  constructor(code: string, message: string, demo = false) {
    super(message);
    this.name = "AlldebridApiError";
    this.code = code;
    this.demo = demo;
  }
}

export class AuthError extends AlldebridApiError {
  constructor(code: string, message: string, demo = false) {
    super(code, message, demo);
    this.name = "AuthError";
  }
}

export class RateLimitError extends AlldebridApiError {
  constructor(code: string, message: string, demo = false) {
    super(code, message, demo);
    this.name = "RateLimitError";
  }
}

export class NotFoundError extends AlldebridApiError {
  constructor(code: string, message: string, demo = false) {
    super(code, message, demo);
    this.name = "NotFoundError";
  }
}

export class UnknownApiError extends AlldebridApiError {
  constructor(code: string, message: string, demo = false) {
    super(code, message, demo);
    this.name = "UnknownApiError";
  }
}

export function mapApiError(err: ApiError, demo = false): AlldebridApiError {
  const code = err.code.toUpperCase();
  if (code.startsWith("AUTH")) return new AuthError(err.code, err.message, demo);
  if (code.includes("RATE") || code.includes("LIMIT"))
    return new RateLimitError(err.code, err.message, demo);
  if (code.includes("NOT_FOUND") || code.includes("UNKNOWN_TORRENT"))
    return new NotFoundError(err.code, err.message, demo);
  return new UnknownApiError(err.code, err.message, demo);
}

