import { z } from "zod";
import { parseEnvelope } from "./envelope";

const HttpMethodSchema = z.union([z.literal("GET"), z.literal("POST")]);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

const ClientOptionsSchema = z.object({
  apiKey: z.string().min(1, "apiKey is required"),
  baseUrl: z
    .url()
    .default("https://api.alldebrid.com/v4")
    .transform((v) => v.replace(/\/$/, ""))
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
});
export type RequestOptions = z.input<typeof RequestOptionsSchema>;

export class AlldebridHttpClient {
  private baseUrl: string = "https://api.alldebrid.com/v4";
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
    this.baseUrl = parsed.baseUrl;
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
    const { method } = parsedOpts;

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

    // Build URL with base + path
    const url = new URL(`${this.baseUrl}/${normalizedPath}`);

    // Always include auth query parameters
    url.searchParams.set("apikey", this.apiKey);

    if (parsedOpts.queryParams)
      this.addQueryParamsToUrl(url, parsedOpts.queryParams);

    const headers = new Headers(parsedOpts.headers);
    headers.set("accept", "application/json");

    let body: BodyInit | undefined;
    if (method === "POST" && parsedOpts.json !== undefined) {
      headers.set(
        "content-type",
        headers.get("content-type") ?? "application/json"
      );
      body = JSON.stringify(parsedOpts.json);
    }

    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: parsedOpts.signal,
    });

    const json = await res.json();
    return parseEnvelope(json as unknown, dataSchema);
  }

  /** Multipart upload for the torrent file upload endpoint. */
  async upload<T extends z.ZodType>(
    path: string,
    dataSchema: T,
    formData: FormData,
    options: Omit<RequestOptions, "json" | "method"> = {}
  ) {
    const parsedOpts = RequestOptionsSchema.omit({ json: true, method: true }).parse(
      options
    );

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
    url.searchParams.set("apikey", this.apiKey);

    if (parsedOpts.queryParams)
      this.addQueryParamsToUrl(url, parsedOpts.queryParams);

    const headers = new Headers(parsedOpts.headers);
    headers.set("accept", "application/json");

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      signal: parsedOpts.signal,
    });

    const json = await res.json();
    return parseEnvelope(json as unknown, dataSchema);
  }
}

/** Singleton instance for convenience. Configure it once before use. */
export const httpClient = new AlldebridHttpClient();
