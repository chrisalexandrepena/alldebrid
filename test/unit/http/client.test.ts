import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { AlldebridHttpClient } from "../../../src/sdk/core/http/client";
import axios from "axios";

interface MockedAxiosRequest {
  mockResolvedValueOnce: (value: unknown) => MockedAxiosRequest;
  mockRejectedValueOnce: (error: unknown) => MockedAxiosRequest;
  mockResolvedValue: (value: unknown) => MockedAxiosRequest;
  mockRejectedValue: (error: unknown) => MockedAxiosRequest;
  mock: {
    calls: unknown[][];
  };
}

// Mock axios
vi.mock("axios", () => ({
  default: {
    request: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));
const mockedAxios = vi.mocked(axios);

describe("AlldebridHttpClient", () => {
  let client: AlldebridHttpClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new AlldebridHttpClient();
    client.configure({
      apiKey: "test-api-key",
      timeout: 5000,
      retries: 2,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Configuration", () => {
    it("should throw configuration error when not configured", async () => {
      const unconfiguredClient = new AlldebridHttpClient();
      const schema = z.object({ test: z.string() });

      await expect(() => unconfiguredClient.getRequest("/test", schema)).rejects.toThrow(
        /Configuration error.*not configured/
      );
    });

    it("should configure client with proper defaults", () => {
      const newClient = new AlldebridHttpClient();
      newClient.configure({ apiKey: "test-key" });

      // Should not throw and should be configured
      expect(() => newClient.configure({ apiKey: "test-key" })).not.toThrow();
    });
  });

  describe("GET Requests", () => {
    it("should perform successful GET request", async () => {
      const responseData = { data: { id: 1, name: "test" } };
      (mockedAxios.request as unknown as MockedAxiosRequest).mockResolvedValueOnce({
        data: { status: "success", data: responseData.data },
      });

      const schema = z.object({ id: z.number(), name: z.string() });
      const result = await client.getRequest("/test", schema);

      expect(result.data).toEqual(responseData.data);

      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: expect.stringContaining("/test"),
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            Accept: "application/json",
          }),
          timeout: 5000,
        }),
      );
    });

    it("should handle GET request with query parameters", async () => {
      (mockedAxios.request as unknown as MockedAxiosRequest).mockResolvedValueOnce({
        data: { status: "success", data: { result: "ok" } },
      });

      const schema = z.object({ result: z.string() });
      const result = await client.getRequest("/test", schema, {
        method: "GET",
        queryParams: { page: 1, limit: 10 },
      });

      expect(result.data.result).toBe("ok");
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { page: 1, limit: 10 },
        }),
      );
    });
  });

  describe("POST Requests", () => {
    it("should perform successful POST request with JSON", async () => {
      (mockedAxios.request as unknown as MockedAxiosRequest).mockResolvedValueOnce({
        data: { status: "success", data: { uploaded: true } },
      });

      const schema = z.object({ uploaded: z.boolean() });
      const result = await client.postRequest("/upload", schema, {
        requestType: "postJson",
        method: "POST",
        json: { file: "test.txt" },
      });

      expect(result.data.uploaded).toBe(true);

      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          data: { file: "test.txt" },
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should perform successful POST request with FormData", async () => {
      (mockedAxios.request as unknown as MockedAxiosRequest).mockResolvedValueOnce({
        data: { status: "success", data: { uploaded: true } },
      });

      const formData = new FormData();
      formData.append("file", "test content");

      const schema = z.object({ uploaded: z.boolean() });
      const result = await client.postRequest("/upload", schema, {
        requestType: "postFormData",
        method: "POST",
        formData,
      });

      expect(result.data.uploaded).toBe(true);
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          data: formData,
          headers: expect.objectContaining({
            "Content-Type": "multipart/form-data",
          }),
        }),
      );
    });

    it("should perform simple POST request", async () => {
      (mockedAxios.request as unknown as MockedAxiosRequest).mockResolvedValueOnce({
        data: { status: "success", data: { result: "ok" } },
      });

      const schema = z.object({ result: z.string() });
      const result = await client.postRequest("/test", schema, {
        requestType: "simplePost",
        method: "POST",
      });

      expect(result.data.result).toBe("ok");
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  describe("Error Handling", () => {
    it("should throw API errors", async () => {
      (mockedAxios.request as unknown as MockedAxiosRequest).mockResolvedValueOnce({
        data: {
          status: "error",
          error: { code: "AUTH_REQUIRED", message: "Authentication required" },
        },
      });

      const schema = z.object({});

      await expect(() => client.getRequest("/test", schema)).rejects.toThrow(
        /API error.*AUTH_REQUIRED.*Authentication required/
      );
    });

    it("should throw validation errors", async () => {
      (mockedAxios.request as unknown as MockedAxiosRequest).mockResolvedValueOnce({
        data: { invalid: "response" },
      });

      const schema = z.object({ required: z.string() });

      await expect(() => client.getRequest("/test", schema)).rejects.toThrow(
        /Validation error/
      );
    });

    it("should throw network errors", async () => {
      // Create a proper error object that preserves properties
      const networkError = Object.assign(new Error("Network Error"), {
        code: "ECONNRESET",
      });

      (mockedAxios.request as unknown as MockedAxiosRequest).mockRejectedValueOnce(networkError);

      const schema = z.object({});

      await expect(() => client.getRequest("/test", schema)).rejects.toThrow(
        /Network error/
      );
    });

    it("should throw HTTP 500 errors as retryable", async () => {
      // Create a proper error object that preserves the response property
      const httpError = Object.assign(new Error("Server Error"), {
        response: { status: 500 },
      });

      (mockedAxios.request as unknown as MockedAxiosRequest).mockRejectedValueOnce(httpError);

      const schema = z.object({});

      await expect(() => client.getRequest("/test", schema)).rejects.toThrow(
        /Network error/
      );
    });

    it("should throw HTTP 404 errors as non-retryable", async () => {
      const httpError = Object.assign(new Error("Not Found"), {
        response: { status: 404 },
      });
      (mockedAxios.request as unknown as MockedAxiosRequest).mockRejectedValueOnce(httpError);

      const schema = z.object({});

      await expect(() => client.getRequest("/test", schema)).rejects.toThrow(
        /Network error.*Not Found/
      );
    });
  });

  describe("Retry Logic", () => {
    it("should retry on retryable network errors", async () => {
      const networkError = Object.assign(new Error("Connection timeout"), {
        code: "ETIMEDOUT",
      });

      // Fail twice, then succeed
      (mockedAxios.request as unknown as MockedAxiosRequest)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          data: { status: "success", data: { result: "ok" } },
        });

      const schema = z.object({ result: z.string() });
      const result = await client.getRequest("/test", schema);

      expect(result.data.result).toBe("ok");
      expect(mockedAxios.request).toHaveBeenCalledTimes(3);
    });

    it("should fail after max retries", async () => {
      const networkError = Object.assign(new Error("Connection timeout"), {
        code: "ETIMEDOUT",
      });

      (mockedAxios.request as unknown as MockedAxiosRequest).mockRejectedValue(networkError);

      const schema = z.object({});

      await expect(() => client.getRequest("/test", schema)).rejects.toThrow(
        /Network error.*Connection timeout/
      );
      // Initial request + 2 retries = 3 total calls
      expect(mockedAxios.request).toHaveBeenCalledTimes(3);
    });

    it("should not retry on non-retryable errors", async () => {
      const httpError = Object.assign(new Error("Bad Request"), {
        response: { status: 400 },
      });

      (mockedAxios.request as unknown as MockedAxiosRequest).mockRejectedValueOnce(httpError);

      const schema = z.object({});

      await expect(() => client.getRequest("/test", schema)).rejects.toThrow(
        /Network error.*Bad Request/
      );
      expect(mockedAxios.request).toHaveBeenCalledTimes(1);
    });
  });

  describe("Path Normalization", () => {
    it("should normalize paths correctly", async () => {
      (mockedAxios.request as unknown as MockedAxiosRequest).mockResolvedValue({
        data: { status: "success", data: {} },
      });

      const schema = z.object({});
      await client.getRequest("/test/path", schema);
      await client.getRequest("test/path", schema);
      await client.getRequest("///test/path", schema);

      const calls = (mockedAxios.request as unknown as MockedAxiosRequest).mock.calls;
      calls.forEach((call: unknown[]) => {
        const config = call[0] as { url: string };
        expect(config.url).toContain("test/path");
        // All paths should end up as the same normalized path
        expect(config.url).toMatch(/\/test\/path$/);
      });
    });
  });
});
