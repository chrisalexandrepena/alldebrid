import { describe, it, beforeAll, expectTypeOf, expect } from "vitest";
import { Alldebrid } from "../../src";
import {
  type ListDomainsResponse,
  type ListHostResponse,
} from "../../src/sdk/resources/hosts";

describe("hosts e2e test", () => {
  let client: Alldebrid;
  beforeAll(() => {
    client = new Alldebrid({
      apiKey: "staticDemoApikeyPrem",
      logLevel: "debug",
      timeout: 30000,
      retries: 3,
    });
  });

  describe("hosts list", () => {
    it("Should return list of supported hosts (or handle demo limitations)", async () => {
      const response = await client.host.list();
      expectTypeOf(response).toEqualTypeOf<ListHostResponse>();
      expect(response).toBeDefined();
      expect(response.hosts).toBeDefined();
      expect(Object.values(response.hosts).length).toBeGreaterThan(0);
      expect(response.streams).toBeDefined();
      expect(Object.values(response.streams).length).toBeGreaterThan(0);
      expect(response.redirectors).toBeDefined();
      expect(Object.values(response.redirectors).length).toBeGreaterThan(0);
    });
  });

  describe("host domains", () => {
    it("Should return host domains mapping (or handle demo limitations)", async () => {
      const response = await client.host.listDomains();
      expectTypeOf(response).toEqualTypeOf<ListDomainsResponse>();
      expect(response).toBeDefined();
      expect(response.hosts).toBeDefined();
      expect(Object.values(response.hosts).length).toBeGreaterThan(0);
      expect(response.streams).toBeDefined();
      expect(Object.values(response.streams).length).toBeGreaterThan(0);
      expect(response.redirectors).toBeDefined();
      expect(typeof response.hosts).toBe("object");
    });
  });

  describe("host priority", () => {
    it("Should return host priority ranking (or handle demo limitations)", async () => {
      const response = await client.host.listHostPriorities();
      expectTypeOf(response).toEqualTypeOf<Record<string, number>>();
      expect(response).toBeDefined();
      expect(Object.keys(response).length).toBeGreaterThan(10);
    });
  });
});
