import { z } from "zod";
import { type ParsedSuccessData, parseEnvelope } from "./envelope";
import { logger } from "../logger";
import {
  SdkError,
  createNetworkError,
  createConfigurationError,
} from "../errors";
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
  timeout: z.number().positive().optional(),
  retries: z.number().int().min(0).optional(),
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
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);
type RequestGetOptions = {
  method?: "GET";
  headers?: Record<string, string | number | boolean>;
  queryParams?: Record<string, string | number | boolean>;
  publicEndpoint?: boolean;
};
const RequestPostOptionsSchema = z.object({
  requestType: z.literal("simplePost"),
  method: z.literal("POST"),
  headers: RequestHeadersSchema.optional(),
  queryParams: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});
type RequestPostOptions = z.infer<typeof RequestPostOptionsSchema>;
const RequestPostJsonOptionsSchema = RequestPostOptionsSchema.extend({
  requestType: z.literal("postJson"),
  json: z.record(z.string(), z.unknown()),
});
type RequestPostJsonOptions = z.infer<typeof RequestPostJsonOptionsSchema>;
const RequestPostFormDataOptionsSchema = RequestPostOptionsSchema.extend({
  requestType: z.literal("postFormData"),
  formData: z.union([
    z.record(z.string(), z.unknown()),
    z.instanceof(FormData),
  ]),
});
type RequestPostFormDataOptions = z.infer<
  typeof RequestPostFormDataOptionsSchema
>;

export class AlldebridHttpClient {
  private baseUrl: string = DEFAULT_BASE_URL;
  private apiKey?: string;
  private timeout: number = 30000;
  private retries: number = 3;

  private normalizePath(path: string): string {
    return z
      .string()
      .min(1, "path is required")
      .transform((v) => v.replace(/^\//, ""))
      .parse(path);
  }

  private baseRequestSetup(
    path: string,
    headers?: RawAxiosRequestHeaders,
    publicEndpoint?: boolean,
  ): {
    url: string;
    headers: RawAxiosRequestHeaders;
  } {
    if (!this.apiKey) {
      throw createConfigurationError(
        "AlldebridHttpClient is not configured. Call configure({ apiKey }) first.",
      );
    }

    const normalizedPath = this.normalizePath(path);
    const url = new URL(`${this.baseUrl}/${normalizedPath}`);

    const defaultHeaders = {
      ...{ Accept: "application/json" },
      ...(publicEndpoint ? {} : { Authorization: `Bearer ${this.apiKey}` }),
    };

    return {
      url: url.toString(),
      headers: { ...defaultHeaders, ...headers },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  configure(opts: ClientOptions) {
    const parsed = ClientOptionsSchema.parse(opts);
    this.apiKey = parsed.apiKey;
    this.baseUrl = (parsed.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeout = parsed.timeout ?? 3000;
    this.retries = parsed.retries ?? 3;
  }

  private async executeRequest<T extends z.ZodType>(
    config: AxiosRequestConfig,
    dataSchema: T,
    retryCount = 0,
  ): Promise<ParsedSuccessData<z.output<T>>> {
    try {
      logger.debug({ ...config }, "alldebrid http request");
      const { data: json } = await axios.request<unknown>({
        ...config,
        timeout: this.timeout,
      });
      logger.debug({ json }, "alldebrid http raw response");
      const result = parseEnvelope(json, dataSchema);
      if (result.ok) return result.data;
      else throw result.error;
    } catch (error: unknown) {
      if (error instanceof SdkError) throw error;

      const networkError = createNetworkError(
        error as Error,
        (error as { response?: { status?: number } })?.response?.status,
      );

      if (retryCount < this.retries && networkError.retryable) {
        logger.debug(
          { attempt: retryCount + 1, maxRetries: this.retries },
          "Retrying request",
        );
        await this.delay(Math.pow(2, retryCount) * 1000);
        return this.executeRequest(config, dataSchema, retryCount + 1);
      }

      throw networkError;
    }
  }

  async getRequest<T extends z.ZodType>(
    path: string,
    dataSchema: T,
    options?: RequestGetOptions,
  ): Promise<ParsedSuccessData<z.output<T>>> {
    const { url, headers } = this.baseRequestSetup(
      path,
      options?.headers,
      options?.publicEndpoint ?? false,
    );
    const config: AxiosRequestConfig = {
      url,
      headers,
      method: "GET" as const,
      ...(options?.queryParams && { params: options.queryParams }),
    };

    return this.executeRequest(config, dataSchema);
  }

  async postRequest<T extends z.ZodType>(
    path: string,
    dataSchema: T,
    options?:
      | RequestPostOptions
      | RequestPostFormDataOptions
      | RequestPostJsonOptions,
  ): Promise<ParsedSuccessData<z.output<T>>> {
    const { url, headers } = this.baseRequestSetup(path, options?.headers);
    let config: AxiosRequestConfig = {
      url,
      headers,
      method: "POST" as const,
      ...(options?.queryParams && { params: options.queryParams }),
    };

    if (!options) return this.executeRequest(config, dataSchema);

    const parsedOptions = z
      .discriminatedUnion("requestType", [
        RequestPostOptionsSchema,
        RequestPostJsonOptionsSchema,
        RequestPostFormDataOptionsSchema,
      ])
      .parse(options);

    switch (parsedOptions.requestType) {
      case "postJson":
        config = {
          ...config,
          data: parsedOptions.json,
          headers: {
            ...config.headers,
            "Content-Type": "application/json",
          },
        };
        break;
      case "postFormData":
        config = {
          ...config,
          data: parsedOptions.formData,
          headers: {
            ...config.headers,
            "Content-Type": "multipart/form-data",
          },
        };
        break;
      default:
        break;
    }

    return this.executeRequest(config, dataSchema);
  }
}
