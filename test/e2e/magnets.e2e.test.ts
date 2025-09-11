import { describe, it, beforeAll, expectTypeOf, expect } from "vitest";
import {
  type MagnetError,
  type MagnetExpired,
  type MagnetListedError,
  type MagnetListedExpired,
  type MagnetListedReady,
  type MagnetReady,
  type UploadedFile,
  type UploadedMagnet,
} from "../../src/sdk/resources/magnets/types";
import { Alldebrid } from "../../src";
import * as fs from "node:fs";
import * as path from "node:path";

describe("magnets e2e test", () => {
  let client: Alldebrid;
  beforeAll(() => {
    client = new Alldebrid({
      apiKey: "staticDemoApikeyPrem",
      logLevel: "debug",
      timeout: 30000,
      retries: 3,
    });
  });

  describe("list magnets", () => {
    it("Should return all ready magnets", async () => {
      const response = await client.magnet.list("ready");
      expect(response.ok).toEqual(true);
      if (response.ok) {
        expectTypeOf(response.data).toEqualTypeOf<MagnetListedReady[]>();
        expect(response.data.length).toBeGreaterThan(0);
      }
    });
    it("Should return all errored magnets", async () => {
      const response = await client.magnet.list("error");
      expect(response.ok).toEqual(true);
      if (response.ok) {
        expectTypeOf(response.data).toEqualTypeOf<MagnetListedError[]>();
        expect(response.data.length).toBeGreaterThan(0);
      }
    });
    it("Should return all expired magnets", async () => {
      const response = await client.magnet.list("expired");
      expect(response.ok).toEqual(true);
      if (response.ok) {
        expectTypeOf(response.data).toEqualTypeOf<MagnetListedExpired[]>();
        expect(response.data.length).toBeGreaterThan(0);
      }
    });
  });

  describe("get magnet", () => {
    it("Should return a detailed ready magnet file", async () => {
      const readyMagnets = await client.magnet.list("ready");
      if (!readyMagnets.ok || !readyMagnets.data[0]) throw new Error("Demo magnet list is empty");
      const response = await client.magnet.get(
        readyMagnets.data[0].id,
        "ready",
      );
      expect(response.ok).toEqual(true);
      if (response.ok) {
        expectTypeOf(response.data).toEqualTypeOf<MagnetReady>();
      }
    });
    it("Should return a detailed errored magnet file", async () => {
      const erroredMagnets = await client.magnet.list("error");
      if (!erroredMagnets.ok || !erroredMagnets.data[0]) throw new Error("Demo magnet list is empty");
      const response = await client.magnet.get(
        erroredMagnets.data[0].id,
        "error",
      );
      expect(response.ok).toEqual(true);
      if (response.ok) {
        expectTypeOf(response.data).toEqualTypeOf<MagnetError>();
      }
    });
    it("Should return a detailed expired magnet file", async () => {
      const expiredMagnets = await client.magnet.list("expired");
      if (!expiredMagnets.ok || !expiredMagnets.data[0]) throw new Error("Demo magnet list is empty");
      const response = await client.magnet.get(
        expiredMagnets.data[0].id,
        "expired",
      );
      expect(response.ok).toEqual(true);
      if (response.ok) {
        expectTypeOf(response.data).toEqualTypeOf<MagnetExpired>();
      }
    });
  });

  describe("upload magnet", () => {
    it("Should return a uploaded magnet result", async () => {
      const response = await client.magnet.upload(
        "magnet:?xt=urn:btih:842783e3005495d5d1637f5364b59343c7844707&dn=ubuntu-18.04.2-live-server-amd64.iso",
      );
      expect(response.ok).toEqual(true);
      if (response.ok) {
        expectTypeOf(response.data).toEqualTypeOf<UploadedMagnet>();
      }
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
      expect(response.ok).toEqual(true);
      if (response.ok) {
        expectTypeOf(response.data).toEqualTypeOf<UploadedFile>();
      }
    });
  });
});
