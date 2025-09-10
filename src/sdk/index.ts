import { AlldebridHttpClient } from "./core/http/client";
import type { ClientOptions } from "./core/http/client";
import { logger } from "./core/logger";
import { MagnetResource } from "./resources/magnets";

export type {
  ClientOptions,
  RequestOptions,
  HttpMethod,
} from "./core/http/client";
export * from "./core/errors";
export type {
  Magnet,
  MagnetListed,
  MagnetListedError,
  MagnetListedExpired,
  MagnetListedReady,
  MagnetFile,
  MagnetDir,
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
