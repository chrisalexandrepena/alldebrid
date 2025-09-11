import { AlldebridHttpClient } from "./core/http/client";
import type { ClientOptions } from "./core/http/client";
import { logger } from "./core/logger";
import { MagnetResource } from "./resources/magnets";

export type { ClientOptions } from "./core/http/client";

// Re-export error classes and batch result utilities
export {
  SdkError,
  NetworkError,
  ApiError,
  ValidationError,
  ConfigurationError,
  type BatchResult,
  createBatchResult,
} from "./core/errors";

// Re-export magnet types
export type {
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
  DeleteMagnetResponse,
  RestartMagnetResponse,
  RestartMagnetBatchResponse,
  RestartMagnetSuccess,
  RestartMagnetErrored,
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
