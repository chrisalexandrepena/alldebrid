import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { httpClient } from "../../../src/sdk";
function jsonResponse(obj: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(obj), {
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    status: init?.status ?? 200,
    statusText: init?.statusText,
  });
}

describe("AlldebridHttpClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    httpClient.configure({ apiKey: "KEY" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-ignore
    if (vi.unstubAllGlobals) vi.unstubAllGlobals();
  });

  it("performs GET with apikey and query params, parses success envelope", async () => {
    const calls: { url: string; method?: string; headers?: Headers }[] = [];
    const fetchMock = vi.fn(async (input: any, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;
      calls.push({
        url,
        method: init?.method,
        headers: new Headers(init?.headers),
      });
      return jsonResponse({ status: "success", data: { id: 1, name: "file" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const Schema = z.object({ id: z.number(), name: z.string() });
    const res = await httpClient.request("/user", Schema, {
      queryParams: { page: 2 },
    });

    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toEqual({ id: 1, name: "file" });
    expect(calls.length).toBe(1);
    const called = calls[0];
    expect(called.method).toBe("GET");
    expect(called.url).toContain("apikey=KEY");
    expect(called.url).toContain("page=2");
    expect(called.headers?.get("accept")).toBe("application/json");
  });

  it("performs POST with JSON body and parses success envelope", async () => {
    const calls: {
      url: string;
      method?: string;
      headers?: Headers;
      body?: string;
    }[] = [];
    const fetchMock = vi.fn(async (input: any, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;
      const bodyText =
        typeof init?.body === "string" ? (init!.body as string) : undefined;
      calls.push({
        url,
        method: init?.method,
        headers: new Headers(init?.headers),
        body: bodyText,
      });
      return jsonResponse({ status: "success", data: { ok: true } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const Schema = z.object({ ok: z.literal(true) });
    const res = await httpClient.request("/torrents/add", Schema, {
      method: "POST",
      json: { magnet: "magnet:?xt=urn:btih:..." },
    });

    expect(res.ok).toBe(true);
    expect(calls.length).toBe(1);
    const called = calls[0];
    expect(called.method).toBe("POST");
    expect(called.url).toContain("apikey=KEY");
    expect(called.headers?.get("content-type")).toContain("application/json");
    expect(called.body && JSON.parse(called.body)).toEqual({
      magnet: "magnet:?xt=urn:btih:...",
    });
  });

  it("returns error envelope when API responds with error status envelope", async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse({
        status: "error",
        error: { code: "E_TOKEN", message: "Invalid token" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const Schema = z.object({});
    const res = await httpClient.request("/user", Schema);
    expect(res.ok).toBe(false);
    if (!res.ok)
      expect(res.error).toEqual({ code: "E_TOKEN", message: "Invalid token" });
  });

  it("rejects when response is not valid JSON", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response("Internal Server Error", {
        status: 500,
        statusText: "Internal Server Error",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const Schema = z.object({});
    await expect(httpClient.request("/user", Schema)).rejects.toThrow();
  });
});
