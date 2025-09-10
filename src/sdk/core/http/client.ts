import { z } from "zod";
import {
  type ParsedErrorEnvelope,
  type ParsedSuccessEnvelope,
  parseEnvelope,
} from "./envelope";
import { logger } from "../logger";
import axios, {
  type AxiosRequestConfig,
  type RawAxiosRequestHeaders,
} from "axios";

export const DEFAULT_BASE_URL = "https://api.alldebrid.com";

const ClientOptionsSchema = z.object({
  apiKey: z.string().min(1, "apiKey is required"),
  baseUrl: z.url().optional(),
  logLevel: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .optional(),
});
export type ClientOptions = z.infer<typeof ClientOptionsSchema>;

const RequestHeadersSchema = z.record(
  z.union([
    z.literal("Accept"),
    z.literal("Content-Length"),
    z.literal("User-Agent"),
    z.literal("Content-Encoding"),
    z.literal("Authorization"),
    z.string(),
  ]),
  z.any(),
);
const RequestGetOptionsSchema = z.object({
  method: z.literal("GET"),
  headers: RequestHeadersSchema.optional(),
  queryParams: z.object().optional(),
});
type RequestGetOptions = z.infer<typeof RequestGetOptionsSchema>;
const RequestPostOptionsSchema = z.object({
  requestType: z.literal("simplePost"),
  method: z.literal("POST"),
  headers: RequestHeadersSchema.optional(),
  queryParams: z.record(z.string(), z.any()).optional(),
});
type RequestPostOptions = z.infer<typeof RequestPostOptionsSchema>;
const RequestPostJsonOptionsSchema = RequestPostOptionsSchema.extend({
  requestType: z.literal("postJson"),
  json: z.record(z.string(), z.any()),
});
type RequestPostJsonOptions = z.infer<typeof RequestPostJsonOptionsSchema>;
const RequestPostFormDataOptionsSchema = RequestPostOptionsSchema.extend({
  requestType: z.literal("postFormData"),
  formData: z.union([z.record(z.string(), z.any()), z.instanceof(FormData)]),
});
type RequestPostFormDataOptions = z.infer<
  typeof RequestPostFormDataOptionsSchema
>;

export class AlldebridHttpClient {
  private baseUrl: string = DEFAULT_BASE_URL;
  private apiKey?: string;

  private baseRequestSetup(
    path: string,
    headers?: RawAxiosRequestHeaders,
  ): {
    url: string;
    headers: RawAxiosRequestHeaders;
  } {
    if (!this.apiKey) {
      throw new Error(
        "AlldebridHttpClient is not configured. Call configure({ apiKey }) first.",
      );
    }
    const normalizedPath = z
      .string()
      .min(1, "path is required")
      .transform((v) => v.replace(/^\//, ""))
      .parse(path);
    const url = new URL(`${this.baseUrl}/${normalizedPath}`);
    return {
      url: url.toString(),
      headers: {
        ...{
          Accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        ...(headers ?? {}),
      },
    };
  }

  configure(opts: ClientOptions) {
    const parsed = ClientOptionsSchema.parse(opts);
    this.apiKey = parsed.apiKey;
    this.baseUrl = (parsed.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  }

  async getRequest<T extends z.ZodType>(
    path: string,
    dataSchema: T,
    options?: RequestGetOptions,
  ): Promise<ParsedSuccessEnvelope<z.output<T>> | ParsedErrorEnvelope> {
    const { url, headers } = this.baseRequestSetup(path, options?.headers);
    const config: AxiosRequestConfig = {
      ...{ url, headers, method: "GET" },
      ...(options?.queryParams ? { params: options.queryParams } : {}),
    };
    logger.debug(config, "alldebrid http request");
    const { data: json } = await axios.request<unknown>(config);
    logger.debug(json, "alldebrid http raw response");
    return parseEnvelope(json, dataSchema);
  }

  async postRequest<T extends z.ZodType>(
    path: string,
    dataSchema: T,
    options?:
      | RequestPostOptions
      | RequestPostFormDataOptions
      | RequestPostJsonOptions,
  ): Promise<ParsedSuccessEnvelope<z.output<T>> | ParsedErrorEnvelope> {
    const { url, headers } = this.baseRequestSetup(path, options?.headers);
    const config: AxiosRequestConfig = {
      ...{ url, headers, method: "POST" },
      ...(options?.queryParams ? { params: options.queryParams } : {}),
    };
    const parsedOptions = z
      .discriminatedUnion("requestType", [
        RequestPostOptionsSchema,
        RequestPostJsonOptionsSchema,
        RequestPostFormDataOptionsSchema,
      ])
      .parse(options);
    if (parsedOptions.requestType === "postJson") {
      config.data = parsedOptions.json;
      config.headers = {
        ...headers,
        ...{ "Content-Type": "application/json" },
      };
      logger.debug(config, "alldebrid http request");
      const { data: json } = await axios.request<unknown>(config);
      logger.debug(json, "alldebrid http raw response");
      return parseEnvelope(json, dataSchema);
    } else if (parsedOptions.requestType === "postFormData") {
      config.data = parsedOptions.formData;
      config.headers = {
        ...headers,
        ...{ "Content-Type": "multipart/form-data" },
      };
      logger.debug(config, "alldebrid http request");
      const { data: json } = await axios.request<unknown>(config);
      logger.debug(json, "alldebrid http raw response");
      return parseEnvelope(json, dataSchema);
    } else {
      logger.debug(config, "alldebrid http request");
      const { data: json } = await axios.request<unknown>(config);
      logger.debug(json, "alldebrid http raw response");
      return parseEnvelope(json, dataSchema);
    }
  }
}
