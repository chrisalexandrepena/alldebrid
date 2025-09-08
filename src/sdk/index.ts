import { AlldebridHttpClient } from "./http/client";
import type { ClientOptions } from "./http/client";
import { logger } from "./logger/logger";
import { MagnetResource } from "./resources/magnets";

export { AlldebridHttpClient, httpClient } from "./http/client";
export type {
  ClientOptions,
  RequestOptions,
  HttpMethod,
} from "./http/client";
export * from "./errors";
export { logger } from "./logger/logger";

export class Alldebrid {
  readonly http: AlldebridHttpClient;
  readonly magnet: MagnetResource;

  constructor(opts: ClientOptions) {
    logger.level = opts.logLevel ?? "warn"
    this.http = new AlldebridHttpClient();
    this.http.configure(opts);
    this.magnet = new MagnetResource(this.http);
  }
}
