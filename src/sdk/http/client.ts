import { z } from "zod";
import { parseEnvelope } from "./envelope";
import { logger } from "../logger/logger";

export const DEFAULT_BASE_URL = "https://api.alldebrid.com";

const HttpMethodSchema = z.enum(["GET", "POST"]);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

const ClientOptionsSchema = z.object({
  apiKey: z.string().min(1, "apiKey is required"),
  baseUrl: z.url().optional(),
  logLevel: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .optional(),
});
export type ClientOptions = z.infer<typeof ClientOptionsSchema>;

const RequestOptionsSchema = z.object({
  method: HttpMethodSchema.default("GET"),
  signal: z.any().optional(),
  headers: z.any().optional(),
  queryParams: z
    .union([z.instanceof(URLSearchParams), z.record(z.string(), z.unknown())])
    .optional(),
  json: z.unknown().optional(),
  form: z
    .union([z.instanceof(URLSearchParams), z.record(z.string(), z.unknown())])
    .optional(),
});
export type RequestOptions = z.input<typeof RequestOptionsSchema>;

export class AlldebridHttpClient {
  private baseUrl: string = DEFAULT_BASE_URL;
  private apiKey?: string;

  private addQueryParamsToUrl(
    url: URL,
    queryParams: URLSearchParams | Record<string, unknown>
  ): void {
    if (queryParams instanceof URLSearchParams) {
      queryParams.forEach((value, key) => url.searchParams.set(key, value));
    } else if (queryParams && typeof queryParams === "object") {
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      });
    }
  }

  configure(opts: ClientOptions) {
    const parsed = ClientOptionsSchema.parse(opts);
    this.apiKey = parsed.apiKey;
    this.baseUrl = (parsed.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  }

  /**
   * Perform a request against the AllDebrid API and parse the standard envelope.
   * The `dataSchema` validates the `data` field when the API returns success.
   */
  async request<T extends z.ZodType>(
    path: string,
    dataSchema: T,
    options: RequestOptions = {}
  ) {
    const parsedOpts = RequestOptionsSchema.parse(options);
    const method = parsedOpts.method ?? "GET";

    if (!this.apiKey) {
      throw new Error(
        "AlldebridHttpClient is not configured. Call configure({ apiKey }) first."
      );
    }

    const normalizedPath = z
      .string()
      .min(1, "path is required")
      .transform((v) => v.replace(/^\//, ""))
      .parse(path);

    const url = new URL(`${this.baseUrl}/${normalizedPath}`);

    if (parsedOpts.queryParams)
      this.addQueryParamsToUrl(url, parsedOpts.queryParams);

    const headers = new Headers(parsedOpts.headers);
    headers.set("accept", "application/json");
    headers.set("Authorization", `Bearer ${this.apiKey}`);

    let body: BodyInit | undefined;
    if (method === "POST") {
      if (parsedOpts.json !== undefined && parsedOpts.form !== undefined) {
        throw new Error("Provide either json or form body, not both.");
      }
      if (parsedOpts.json !== undefined) {
        headers.set(
          "content-type",
          headers.get("content-type") ?? "application/json"
        );
        body = JSON.stringify(parsedOpts.json);
      } else if (parsedOpts.form !== undefined) {
        let sp: URLSearchParams;
        if (parsedOpts.form instanceof URLSearchParams) sp = parsedOpts.form;
        else {
          sp = new URLSearchParams();
          Object.entries(parsedOpts.form).forEach(([k, v]) => {
            if (Array.isArray(v))
              v.forEach((vv) => sp.append(`${k}[]`, String(vv)));
            else if (v !== undefined && v !== null) sp.append(k, String(v));
          });
        }
        if (!headers.has("content-type"))
          headers.set(
            "content-type",
            "application/x-www-form-urlencoded;charset=UTF-8"
          );
        body = sp;
      }
    }

    logger.debug(
      {
        method,
        url: url.toString(),
        body,
      },
      "alldebrid http request"
    );

    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: parsedOpts.signal,
    });

    logger.debug({ status: res.status }, "alldebrid http response");
    const json = await res.json();
    // writeFileSync("prout.json", JSON.stringify(json))
    const parsed = parseEnvelope(json as unknown, dataSchema);
    if (!parsed.ok) {
      logger.warn({ error: parsed.error, demo: parsed.demo }, "api error");
    }
    return parsed;
  }

  /** Multipart upload for the torrent file upload endpoint. */
  async upload<T extends z.ZodType>(
    path: string,
    dataSchema: T,
    formData: FormData,
    options: Omit<RequestOptions, "json" | "method"> = {}
  ) {
    const parsedOpts = RequestOptionsSchema.omit({
      json: true,
      method: true,
    }).parse(options);

    if (!this.apiKey) {
      throw new Error(
        "AlldebridHttpClient is not configured. Call configure({ apiKey }) first."
      );
    }

    const normalizedPath = z
      .string()
      .min(1, "path is required")
      .transform((v) => v.replace(/^\//, ""))
      .parse(path);
    const url = new URL(`${this.baseUrl}/${normalizedPath}`);

    if (parsedOpts.queryParams)
      this.addQueryParamsToUrl(url, parsedOpts.queryParams);

    const headers = new Headers(parsedOpts.headers);
    headers.set("accept", "application/json");
    headers.set("Authorization", `Bearer ${this.apiKey}`);

    logger.debug(
      { method: "POST", url: url.toString(), formData: true },
      "alldebrid http upload"
    );

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      signal: parsedOpts.signal,
    });

    logger.debug({ status: res.status }, "alldebrid http response");

    const json = await res.json();
    const parsed = parseEnvelope(json as unknown, dataSchema);
    if (!parsed.ok) {
      logger.warn({ error: parsed.error, demo: parsed.demo }, "api error");
    }
    return parsed;
  }
}

export const httpClient = new AlldebridHttpClient();
