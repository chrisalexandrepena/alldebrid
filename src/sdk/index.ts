import { AlldebridHttpClient } from "./core/http/client";
import type { ClientOptions } from "./core/http/client";
import { logger } from "./core/logger";
import { MagnetResource } from "./resources/magnets";

export type {
  ClientOptions,
} from "./core/http/client";

// Re-export all error handling types and utilities
export {
  type Result,
  type SdkError,
  type NetworkError,
  type ApiError,
  type ValidationError,
  type ConfigurationError,
  type BatchResult,
  isOk,
  isError,
  mapResult,
  mapError,
  createBatchResult,
  createNetworkError,
  createApiError,
  createValidationError,
  createConfigurationError,
} from "./core/errors";

// Re-export magnet types
export type {
  Magnet,
  MagnetListed,
  MagnetListedError,
  MagnetListedExpired,
  MagnetListedReady,
  MagnetFile,
  MagnetDir,
  UploadedMagnetSuccess,
  UploadedMagnetErrored,
  UploadedFileSuccess,
  UploadedFileErrored,
} from "./resources/magnets/types";

export class Alldebrid {
  private readonly httpClient: AlldebridHttpClient;
  readonly magnet: MagnetResource;

  constructor(opts: ClientOptions) {
    logger.level = opts.logLevel ?? "warn";
    this.httpClient = new AlldebridHttpClient();
    this.httpClient.configure(opts);
    this.magnet = new MagnetResource(this.httpClient);
  }
}
