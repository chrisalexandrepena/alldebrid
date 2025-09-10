import { describe, it, beforeAll, expectTypeOf } from "vitest";
import {
  type MagnetError,
  type MagnetExpired,
  type MagnetListedError,
  type MagnetListedExpired,
  type MagnetListedReady,
  type MagnetReady,
  type UploadedMagnetSuccess,
} from "../../src/sdk/resources/magnets/types";
import { Alldebrid } from "../../src";

describe("magnets e2e test", () => {
  let client: Alldebrid;
  beforeAll(() => {
    client = new Alldebrid({
      apiKey: "E1ws4Mpefm2evyGrXONe",
      // apiKey: "staticDemoApikeyPrem",
      logLevel: "debug",
    });
  });

  describe("list magnets", () => {
    it("Should return all ready magnets", async () => {
      const response = await client.magnet.list("ready");
      expectTypeOf(response).toEqualTypeOf<MagnetListedReady[]>();
    });
    it("Should return all errored magnets", async () => {
      const response = await client.magnet.list("error");
      expectTypeOf(response).toEqualTypeOf<MagnetListedError[]>();
    });
    it("Should return all expired magnets", async () => {
      const response = await client.magnet.list("expired");
      expectTypeOf(response).toEqualTypeOf<MagnetListedExpired[]>();
    });
  });

  describe("get magnet", () => {
    it("Should return a detailed ready magnet file", async () => {
      const readyMagnets = await client.magnet.list("ready");
      if (!readyMagnets[0]) throw new Error("Demo magnet list is empty");
      const response = await client.magnet.get(readyMagnets[0].id, "ready");
      expectTypeOf(response).toEqualTypeOf<MagnetReady>();
    });
    it("Should return a detailed errored magnet file", async () => {
      const erroredMagnets = await client.magnet.list("error");
      if (!erroredMagnets[0]) throw new Error("Demo magnet list is empty");
      const response = await client.magnet.get(erroredMagnets[0].id, "error");
      expectTypeOf(response).toEqualTypeOf<MagnetError>();
    });
    it("Should return a detailed expired magnet file", async () => {
      const expiredMagnets = await client.magnet.list("expired");
      if (!expiredMagnets[0]) throw new Error("Demo magnet list is empty");
      const response = await client.magnet.get(expiredMagnets[0].id, "expired");
      expectTypeOf(response).toEqualTypeOf<MagnetExpired>();
    });
  });

  describe("upload magnet", () => {
    it("Should return a uploaded magnet result", async () => {
      const response = await client.magnet.upload(
        "magnet:?xt=urn:btih:842783e3005495d5d1637f5364b59343c7844707&dn=ubuntu-18.04.2-live-server-amd64.iso",
      );
      expectTypeOf(response).toEqualTypeOf<UploadedMagnetSuccess>();
    });
  });
});
