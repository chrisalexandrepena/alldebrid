import { z } from "zod";
import { type ParsedSuccessData, parseEnvelope } from "./envelope";
import { logger } from "../logger";
import {
  type Result,
  type SdkError,
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
  z.any(),
);
type RequestGetOptions = {
  method: "GET";
  headers?: Record<string, any>;
  queryParams?: Record<string, any>;
};
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
  ): Result<
    {
      url: string;
      headers: RawAxiosRequestHeaders;
    },
    SdkError
  > {
    if (!this.apiKey) {
      return {
        ok: false,
        error: createConfigurationError(
          "AlldebridHttpClient is not configured. Call configure({ apiKey }) first.",
        ),
      };
    }

    const normalizedPath = this.normalizePath(path);
    const url = new URL(`${this.baseUrl}/${normalizedPath}`);

    const defaultHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    return {
      ok: true,
      data: {
        url: url.toString(),
        headers: { ...defaultHeaders, ...headers },
      },
    };
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
  ): Promise<Result<ParsedSuccessData<z.output<T>>, SdkError>> {
    try {
      logger.debug({ ...config }, "alldebrid http request");
      const { data: json } = await axios.request<unknown>({
        ...config,
        timeout: this.timeout,
      });
      logger.debug({ json }, "alldebrid http raw response");
      return parseEnvelope(json, dataSchema);
    } catch (error) {
      const networkError = createNetworkError(
        error as Error,
        (error as any)?.response?.status,
      );

      if (retryCount < this.retries && networkError.retryable) {
        logger.debug(
          { attempt: retryCount + 1, maxRetries: this.retries },
          "Retrying request",
        );
        await this.delay(Math.pow(2, retryCount) * 1000);
        return this.executeRequest(config, dataSchema, retryCount + 1);
      }

      return { ok: false, error: networkError };
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      return (
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT" ||
        error.code === "ENOTFOUND" ||
        (status !== undefined && (status >= 500 || status === 429))
      );
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getRequest<T extends z.ZodType>(
    path: string,
    dataSchema: T,
    options?: RequestGetOptions,
  ): Promise<Result<ParsedSuccessData<z.output<T>>, SdkError>> {
    const setupResult = this.baseRequestSetup(path, options?.headers);
    if (!setupResult.ok) {
      return setupResult;
    }

    const { url, headers } = setupResult.data;
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
  ): Promise<Result<ParsedSuccessData<z.output<T>>, SdkError>> {
    const setupResult = this.baseRequestSetup(path, options?.headers);
    if (!setupResult.ok) {
      return setupResult;
    }

    const { url, headers } = setupResult.data;
    let config: AxiosRequestConfig = {
      url,
      headers,
      method: "POST" as const,
      ...(options?.queryParams && { params: options.queryParams }),
    };

    if (!options) {
      return this.executeRequest(config, dataSchema);
    }

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
