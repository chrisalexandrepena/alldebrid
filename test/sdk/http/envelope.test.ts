import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseEnvelope } from "../../../src/sdk/http/envelope";

describe("parseEnvelope", () => {
  it("parses success envelope with boolean demo true", () => {
    const Data = z.object({ id: z.number(), name: z.string() });
    const json = {
      status: "success" as const,
      data: { id: 1, name: "file" },
      demo: true,
    };

    const r = parseEnvelope(json, Data);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toEqual({ id: 1, name: "file" });
      expect(r.demo).toBe(true);
    }
  });

  it('parses success envelope with string demo "true" -> true', () => {
    const Data = z.object({ id: z.number() });
    const json = {
      status: "success" as const,
      data: { id: 42 },
      demo: "true",
    } as const;

    const r = parseEnvelope(json, Data);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toEqual({ id: 42 });
      expect(r.demo).toBe(true);
    }
  });

  it("parses success envelope with omitted demo -> false", () => {
    const Data = z.object({ ok: z.literal(true) });
    const json = {
      status: "success" as const,
      data: { ok: true },
    };

    const r = parseEnvelope(json, Data);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toEqual({ ok: true });
      expect(r.demo).toBe(false);
    }
  });

  it("parses error envelope and returns error with default demo false", () => {
    const Data = z.object({ id: z.number() });
    const json = {
      status: "error" as const,
      error: { code: "E_OOPS", message: "Something went wrong" },
    };

    const r = parseEnvelope(json, Data);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toEqual({
        code: "E_OOPS",
        message: "Something went wrong",
      });
      expect(r.demo).toBe(false);
    }
  });

  it("parses error envelope with demo true", () => {
    const Data = z.object({});
    const json = {
      status: "error" as const,
      error: { code: "E_TOKEN", message: "Invalid token" },
      demo: true,
    };

    const r = parseEnvelope(json, Data);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toEqual({ code: "E_TOKEN", message: "Invalid token" });
      expect(r.demo).toBe(true);
    }
  });

  it("throws on invalid success payload shape (missing data)", () => {
    const Data = z.object({ id: z.number() });
    const json = { status: "success" as const };
    expect(() => parseEnvelope(json, Data)).toThrowError(
      "Invalid API response shape.",
    );
  });

  it("throws on invalid error payload shape (missing error)", () => {
    const Data = z.object({});
    const json = { status: "error" as const };
    expect(() => parseEnvelope(json, Data)).toThrowError(
      "Invalid API response shape.",
    );
  });
});
