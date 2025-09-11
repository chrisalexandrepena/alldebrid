import { AlldebridHttpClient } from "./core/http/client";
import type { ClientOptions } from "./core/http/client";
import { logger } from "./core/logger";
import { MagnetResource } from "./resources/magnets";
import { UserResource } from "./resources/users";
import { HostResource } from "./resources/hosts";
import { LinkResource } from "./resources/links";

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
  RestartMagnetSuccess,
  RestartMagnetErrored,
} from "./resources/magnets/types";

// Re-export user types
export type {
  User,
  UserHost,
  VarificationEmailStatus,
  SavedLink,
} from "./resources/users/types";

// Re-export host types
export type { Host } from "./resources/hosts/types";

// Re-export link types
export type { LinkInfo, DebridLinkResponse } from "./resources/links/types";

export class Alldebrid {
  private readonly httpClient: AlldebridHttpClient;
  readonly magnet: MagnetResource;
  readonly user: UserResource;
  readonly host: HostResource;
  readonly link: LinkResource;

  constructor(opts: ClientOptions) {
    logger.level = opts.logLevel ?? "warn";
    this.httpClient = new AlldebridHttpClient();
    this.httpClient.configure(opts);
    this.magnet = new MagnetResource(this.httpClient);
    this.user = new UserResource(this.httpClient);
    this.host = new HostResource(this.httpClient);
    this.link = new LinkResource(this.httpClient);
  }
}
