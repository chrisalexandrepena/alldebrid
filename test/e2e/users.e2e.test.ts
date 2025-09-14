import { describe, it, beforeAll, expectTypeOf, expect } from "vitest";
import {
  type SavedLink,
  type User,
  type UserHost,
  type VarificationEmailStatus,
} from "../../src";
import { Alldebrid, ApiError } from "../../src";

describe("users e2e test", () => {
  let client: Alldebrid;
  beforeAll(() => {
    client = new Alldebrid({
      apiKey: "staticDemoApikeyPrem",
      logLevel: "debug",
      timeout: 30000,
      retries: 3,
    });
  });

  describe("user info", () => {
    it("Should return user information", async () => {
      const response = await client.user.get();
      expectTypeOf(response).toEqualTypeOf<User>();
      expect(response).toBeDefined();
      expect(response.username).toBeDefined();
      expect(response.email).toBeDefined();
      expectTypeOf(response.isPremium).toBeBoolean();
    });
  });

  describe("user hosts", () => {
    it("Should return available hosts for user", async () => {
      const response = await client.user.getHosts();
      expectTypeOf(response).toEqualTypeOf<Record<string, UserHost>>();
      expect(response).toBeDefined();
    });
  });

  describe("user verification", () => {
    it("Should check verification status (or handle demo limitations)", async () => {
      const response = await client.user.checkVerificationToken(
        "verificationTokenWaiting3f9eb0db",
      );
      expectTypeOf(response).toEqualTypeOf<VarificationEmailStatus>();
      expect(response.verif).toBe("waiting");
    });

    it("Should handle resend verification request (or handle demo limitations)", async () => {
      const response = await client.user.resendVerification(
        "verificationTokenResent43f9eb0db",
      );
      expect(response).toBeDefined();
      expect(response.sent).toBe(true);
    });

    it("Should handle error due to expired token", async () => {
      await expect(
        client.user.resendVerification("verificationTokenExpired3f9eb0db"),
      ).rejects.toThrow(ApiError);
    });
  });

  describe("user notifications", () => {
    it("Should clear user notifications", async () => {
      const response = await client.user.clearNotifications("NOTIF_CODE");
      expect(response).toMatchObject({ code: "NOTIF_CODE", cleared: true });
    });
  });

  describe("user links", () => {
    it("Should return saved links", async () => {
      const response = await client.user.listSavedLinks();
      expectTypeOf(response).toEqualTypeOf<SavedLink[]>();
      expect(response.length).toBeGreaterThan(0);
    });

    it("Should save links", async () => {
      const testLinks = [
        "https://example.com/file2MB.txt",
        "https://example.com/file10MB.txt",
      ];
      const response = await client.user.saveLinks(testLinks);
      expectTypeOf(response).toEqualTypeOf<{ saved: boolean }>();
      expect(response.saved).toBe(true);
    });

    it("Should delete links", async () => {
      const response = await client.user.deleteLinks([
        "https://example.com/file2MB.txt",
      ]);
      expectTypeOf(response).toEqualTypeOf<{ deleted: boolean }>();
      expect(response.deleted).toBe(true);
    });
  });

  describe("user history", () => {
    it("Should return user history", async () => {
      const response = await client.user.listRecentLinks();
      expectTypeOf(response).toEqualTypeOf<SavedLink[]>();
      expect(response.length).toBeGreaterThan(0);
    });

    it("Should delete user history", async () => {
      const response = await client.user.purgeRecentLinks();
      expectTypeOf(response).toEqualTypeOf<{ deleted: boolean }>();
      expect(response.deleted).toBe(true);
    });
  });
});
