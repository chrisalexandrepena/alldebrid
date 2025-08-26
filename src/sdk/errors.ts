/**
 * AllDebrid error handling utilities.
 *
 * We mirror the documented error codes and also provide "category" hints
 * to make it easy to react (auth vs link vs magnet vs maintenance vs throttling).
 *
 * Sources:
 * - "All errors" table in docs for code list & meanings
 * - HTTP status codes (401/429/5xx) also used by the API
 */

export type AllDebridErrorCategory =
  | "Auth"
  | "Maintenance"
  | "Link"
  | "Redirector"
  | "Stream"
  | "Delayed"
  | "Magnet"
  | "Pin"
  | "UserLinks"
  | "Voucher"
  | "FreeDays"
  | "RateLimit"
  | "NotFound"
  | "Account"
  | "Payload"
  | "Download"
  | "Generic"
  | "Unknown";

/** Subset of known codes (string literal union). We keep it open to any string. */
export type AllDebridErrorCode = string;

/** The unified error object our SDK throws. */
export class AllDebridError extends Error {
  public readonly code: AllDebridErrorCode;
  public readonly httpStatus?: number;
  public readonly category: AllDebridErrorCategory;
  public readonly demo?: boolean;
  public readonly causeRaw?: unknown;

  constructor(opts: {
    message: string;
    code: AllDebridErrorCode;
    category?: AllDebridErrorCategory;
    httpStatus?: number;
    demo?: boolean;
    cause?: unknown;
  }) {
    super(opts.message);
    this.name = "AllDebridError";
    this.code = opts.code;
    this.category = opts.category ?? categorizeCode(opts.code);
    this.httpStatus = opts.httpStatus;
    this.demo = opts.demo;
    this.causeRaw = opts.cause;
  }
}

/** Categorize known codes for ergonomic handling. */
export function categorizeCode(code: string): AllDebridErrorCategory {
  // Normalize numeric "404"
  if (code === "404") return "NotFound";
  if (code === "MAINTENANCE") return "Maintenance";

  // Auth
  if (code.startsWith("AUTH_")) return "Auth";

  // Link & friends
  if (code.startsWith("LINK_")) return "Link";
  if (code.startsWith("REDIRECTOR_")) return "Redirector";
  if (code.startsWith("STREAM_")) return "Stream";
  if (code.startsWith("DELAYED_")) return "Delayed";

  // Magnet
  if (code.startsWith("MAGNET_")) return "Magnet";

  // PIN
  if (code.startsWith("PIN_")) return "Pin";

  // User links
  if (code.startsWith("USER_LINK_")) return "UserLinks";

  // Vouchers
  if (code.startsWith("VOUCHER_")) return "Voucher";

  // FreeDays
  if (code.startsWith("FREEDAYS_")) return "FreeDays";

  // Misc categories
  if (code === "ACCOUNT_INVALID") return "Account";
  if (code === "DOWNLOAD_FAILED") return "Download";
  if (code === "NO_JSON_PARAM" || code === "JSON_INVALID") return "Payload";

  // Fallbacks
  if (code === "GENERIC") return "Generic";

  return "Unknown";
}

/** Some errors are communicated via HTTP (429/401/etc.). */
export function categorizeByHttpStatus(http?: number): AllDebridErrorCategory | undefined {
  if (!http) return undefined;
  if (http === 401) return "Auth";
  if (http === 404) return "NotFound";
  if (http === 429) return "RateLimit";
  if (http >= 500) return "Maintenance"; // server-side issue
  return undefined;
}

/** Convenience type guards */
export const isAuthError = (e: unknown) =>
  e instanceof AllDebridError && (e.category === "Auth" || e.httpStatus === 401);

export const isRateLimitError = (e: unknown) =>
  e instanceof AllDebridError && (e.category === "RateLimit" || e.httpStatus === 429);

export const isMaintenance = (e: unknown) =>
  e instanceof AllDebridError && (e.category === "Maintenance" || (e.httpStatus ?? 0) >= 500);

/**
 * Convert an API "error" envelope into a rich AllDebridError.
 * - If httpStatus suggests a stronger category (e.g. 429), prefer that.
 */
export function toAllDebridError(args: {
  code: string;
  message: string;
  httpStatus?: number;
  demo?: boolean;
  cause?: unknown;
}): AllDebridError {
  const code = String(args.code);
  const primary = categorizeCode(code);
  const viaHttp = categorizeByHttpStatus(args.httpStatus);
  return new AllDebridError({
    message: args.message,
    code,
    category: viaHttp ?? primary,
    httpStatus: args.httpStatus,
    demo: args.demo,
    cause: args.cause,
  });
}
