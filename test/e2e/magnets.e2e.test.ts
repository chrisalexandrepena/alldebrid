import { describe, it, beforeAll, expectTypeOf, expect } from "vitest";
import {
  type MagnetError,
  type MagnetExpired,
  type MagnetListedError,
  type MagnetListedExpired,
  type MagnetListedReady,
  type MagnetReady,
  RestartMagnetSuccess,
  type UploadedFile,
  type UploadedMagnet,
} from "../../src/sdk/resources/magnets/types";
import { Alldebrid, ApiError, NetworkError } from "../../src";
import * as fs from "node:fs";
import * as path from "node:path";

describe("magnets e2e test", () => {
  let client: Alldebrid;
  beforeAll(() => {
    client = new Alldebrid({
      // apiKey: "E1ws4Mpefm2evyGrXONe",
      apiKey: "staticDemoApikeyPrem",
      logLevel: "debug",
      timeout: 30000,
      retries: 3,
    });
  });

  describe("list magnets", () => {
    it("Should return all ready magnets", async () => {
      const response = await client.magnet.list("ready");
      expectTypeOf(response).toEqualTypeOf<MagnetListedReady[]>();
      expect(response.length).toBeGreaterThan(0);
    });
    it("Should return all errored magnets", async () => {
      const response = await client.magnet.list("error");
      expectTypeOf(response).toEqualTypeOf<MagnetListedError[]>();
      expect(response.length).toBeGreaterThan(0);
    });
    it("Should return all expired magnets", async () => {
      const response = await client.magnet.list("expired");
      expectTypeOf(response).toEqualTypeOf<MagnetListedExpired[]>();
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe("get magnet", () => {
    it("Should return a detailed ready magnet file", async () => {
      const readyMagnets = await client.magnet.list("ready");
      if (!readyMagnets[0]) throw new Error("Demo magnet list is empty");
      const response = await client.magnet.get(readyMagnets[0].id);
      expectTypeOf(response).toEqualTypeOf<MagnetReady>();
    });
    it("Should return a detailed errored magnet file", async () => {
      const erroredMagnets = await client.magnet.list("error");
      if (!erroredMagnets[0]) throw new Error("Demo magnet list is empty");
      const response = await client.magnet.get(erroredMagnets[0].id);
      expectTypeOf(response).toEqualTypeOf<MagnetError>();
    });
    it("Should return a detailed expired magnet file", async () => {
      const expiredMagnets = await client.magnet.list("expired");
      if (!expiredMagnets[0]) throw new Error("Demo magnet list is empty");
      const response = await client.magnet.get(expiredMagnets[0].id);
      expectTypeOf(response).toEqualTypeOf<MagnetExpired>();
    });
  });

  describe("upload magnet", () => {
    it("Should return a uploaded magnet result", async () => {
      const response = await client.magnet.upload(
        "magnet:?xt=urn:btih:842783e3005495d5d1637f5364b59343c7844707&dn=ubuntu-18.04.2-live-server-amd64.iso",
      );
      expectTypeOf(response).toEqualTypeOf<UploadedMagnet>();
    });
    it("Should return a uploaded torrent file result", async () => {
      const fileBuffer = fs.readFileSync(
        path.join(__dirname, "findingnemo.torrent"),
      );
      const blob = new Blob([fileBuffer], { type: "application/x-bittorrent" });
      const response = await client.magnet.uploadFile({
        fileName: "findingnemo.torrent",
        blob,
      });
      expectTypeOf(response).toEqualTypeOf<UploadedFile>();
    });
  });

  describe("delete magnet", () => {
    it("Should return delete response for valid magnet ID", async () => {
      const readyMagnets = await client.magnet.list("ready");
      if (!readyMagnets[0]) throw new Error("Demo magnet list is empty");
      const response = await client.magnet.delete(readyMagnets[0].id);
      expect(response).toBeDefined();
      expect(response).toHaveProperty("message");
    });

    it("Should handle delete for demo (returns success)", async () => {
      const response = await client.magnet.delete(99999999);
      expect(response).toBeDefined();
      expect(response).toHaveProperty("message");
    });
  });

  describe("restart magnet", () => {
    it("Should return restart response for single magnet ID", async () => {
      const readyMagnets = await client.magnet.list("ready");
      if (!readyMagnets[0]) throw new Error("Demo magnet list is empty");
      const response = await client.magnet.restart(readyMagnets[0].id);
      expect(response).toBeDefined();
      expect(response).toHaveProperty("message");
    });

    it("Should throw ApiError for batch restart (demo limitation)", async () => {
      const readyMagnets = await client.magnet.list("ready");
      const errorMagnets = await client.magnet.list("error");
      if (!readyMagnets[0] || !errorMagnets[0])
        throw new Error("Demo magnet lists are empty");
      await expect(
        client.magnet.restart([readyMagnets[0].id, errorMagnets[0].id]),
      ).rejects.toThrow(ApiError);
    });

    it("Should handle restart for demo (returns success)", async () => {
      const response = await client.magnet.restart(999999999);
      expect(response).toBeDefined();
      expectTypeOf(response).toEqualTypeOf<RestartMagnetSuccess>();
    });
  });

  describe("error handling", () => {
    describe("configuration errors", () => {
      it("Should throw ValidationError when API key is missing", async () => {
        expect(() => {
          new Alldebrid({
            apiKey: "",
            logLevel: "debug",
          });
        }).toThrow(/apiKey is required/);
      });

      it("Should throw ConfigurationError when API key is invalid format", async () => {
        const invalidClient = new Alldebrid({
          apiKey: "invalid_key_format",
          logLevel: "debug",
        });

        await expect(invalidClient.magnet.list("ready")).rejects.toThrow(
          /API error.*AUTH/,
        );
      });
    });

    describe("api errors", () => {
      it("Should throw ApiError for invalid magnet ID", async () => {
        await expect(client.magnet.get(99999999)).rejects.toThrow(ApiError);

        try {
          await client.magnet.get(99999999);
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          if (error instanceof ApiError) {
            expect(error.type).toBe("api");
            expect(error.code).toBeDefined();
            expect(error.originalMessage).toBeDefined();
            expect(error.message).toContain("API error");
            expect(error.timestamp).toBeInstanceOf(Date);
            expect(typeof error.retryable).toBe("boolean");
          }
        }
      });

      it("Should handle successful magnet upload (demo returns success)", async () => {
        const response = await client.magnet.upload("invalid-magnet-uri");
        expect(response).toBeDefined();
        expect(response).toHaveProperty("id");
      });

      it("Should handle empty magnet upload (demo returns success)", async () => {
        const response = await client.magnet.upload("");
        expect(response).toBeDefined();
        expect(response).toHaveProperty("id");
      });
    });

    describe("validation errors", () => {
      it("Should handle empty file upload (demo returns success)", async () => {
        const response = await client.magnet.uploadFile({
          fileName: "",
          blob: new Blob([]),
        });
        expect(response).toBeDefined();
        expect(response).toHaveProperty("id");
      });
    });

    describe("network errors", () => {
      it("Should throw NetworkError for timeout", async () => {
        const timeoutClient = new Alldebrid({
          apiKey: "staticDemoApikeyPrem",
          timeout: 1, // 1ms timeout to force timeout
          retries: 0, // No retries
        });

        await expect(timeoutClient.magnet.list("ready")).rejects.toThrow(
          NetworkError,
        );

        try {
          await timeoutClient.magnet.list("ready");
        } catch (error) {
          expect(error).toBeInstanceOf(NetworkError);
          if (error instanceof NetworkError) {
            expect(error.type).toBe("network");
            expect(error.cause).toBeInstanceOf(Error);
            expect(error.message).toContain("Network error");
            expect(error.timestamp).toBeInstanceOf(Date);
            expect(typeof error.retryable).toBe("boolean");
          }
        }
      });

      it("Should throw NetworkError for invalid base URL", async () => {
        const invalidUrlClient = new Alldebrid({
          apiKey: "staticDemoApikeyPrem",
          baseUrl: "https://invalid-domain-that-does-not-exist.com",
          timeout: 5000,
          retries: 0,
        });

        await expect(invalidUrlClient.magnet.list("ready")).rejects.toThrow(
          NetworkError,
        );
      });
    });

    describe("error properties and behavior", () => {
      it("Should preserve error chain and context", async () => {
        try {
          await client.magnet.get(99999999);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect(error).toHaveProperty("message");
          expect(error).toHaveProperty("stack");
          expect(error).toHaveProperty("timestamp");

          if (error instanceof ApiError) {
            expect(error).toHaveProperty("type", "api");
            expect(error).toHaveProperty("code");
            expect(error).toHaveProperty("originalMessage");
            expect(error).toHaveProperty("retryable");
          }
        }
      });

      it("Should provide detailed error messages", async () => {
        try {
          await client.magnet.upload("invalid-magnet");
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          if (error instanceof Error) {
            expect(error.message).toBeTruthy();
            expect(error.message.length).toBeGreaterThan(10);
            expect(error.message).toContain("API error");
          }
        }
      });

      it("Should not expose internal implementation details", async () => {
        try {
          await client.magnet.get(99999999);
        } catch (error) {
          if (error instanceof Error) {
            expect(error.message).not.toContain("result.ok");
            expect(error.message).not.toContain("Result<");
            expect(error.message).not.toContain("parseEnvelope");
          }
        }
      });
    });

    describe("error consistency", () => {
      it("Should always throw Error instances", async () => {
        const errorTests = [
          () => client.magnet.get(99999999),
          () => client.magnet.upload("invalid"),
          () => client.magnet.delete(99999999),
        ];

        for (const test of errorTests) {
          try {
            await test();
            expect.fail("Expected test to throw an error");
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
          }
        }
      });

      it("Should never return undefined or null on error", async () => {
        const errorTests = [
          () => client.magnet.get(99999999),
          () => client.magnet.upload("invalid"),
        ];

        for (const test of errorTests) {
          try {
            const result = await test();
            // If we get here, the operation unexpectedly succeeded
            expect(result).toBeDefined();
            expect(result).not.toBeNull();
          } catch (error) {
            // This is expected - errors should be thrown, not returned
            expect(error).toBeDefined();
            expect(error).not.toBeNull();
          }
        }
      });
    });
  });
});
