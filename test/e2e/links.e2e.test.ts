import { describe, it, beforeAll, expectTypeOf, expect } from "vitest";
import {
  type LinkInfo,
  type DebridLinkResponse,
  type LinkInfoError,
} from "../../src/sdk/resources/links/types";
import { Alldebrid, ApiError } from "../../src";

describe("links e2e test", () => {
  let client: Alldebrid;
  beforeAll(() => {
    client = new Alldebrid({
      apiKey: "staticDemoApikeyPrem",
      logLevel: "debug",
      timeout: 30000,
      retries: 3,
    });
  });

  describe("link info", () => {
    it("Should get link information (or handle demo limitations)", async () => {
      const response = await client.link.getInfo(
        "https://example.com/file2MB.txt",
      );
      expectTypeOf(response).toEqualTypeOf<LinkInfo>();
      expect(response).toBeDefined();
    });

    it("Should handle invalid links gracefully", async () => {
      const response = await client.link.getInfo([
        "https://example.com/down",
        "https://not-supported.com/somefile.txt",
      ]);
      expect(response).toBeDefined();
      expect(response.length).toBe(2);
      response.forEach((link) =>
        expectTypeOf(link).toEqualTypeOf<LinkInfoError>(),
      );
    });
  });

  describe("debrid link", () => {
    it("Should unlock a link without password (or demo limitations)", async () => {
      const response = await client.link.debrid(
        "https://example.com/file2MB.txt",
      );
      expectTypeOf(response).toEqualTypeOf<DebridLinkResponse>();
    });

    it("Should unlock a link with password (or demo limitations)", async () => {
      const response = await client.link.debrid(
        "https://example.com/file2MB.txt",
        "test123",
      );
      expectTypeOf(response).toEqualTypeOf<DebridLinkResponse>();
    });

    it("Should handle error due to host not supported", async () => {
      await expect(
        client.link.debrid("https://notsupported.com/file.txt"),
      ).rejects.toThrow(ApiError);
    });
  });
});
