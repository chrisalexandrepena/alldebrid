import { AlldebridHttpClient } from "../../core/http/client";
import { z, type ZodError } from "zod";
import {
  MagnetSchema,
  MagnetListedSchema,
  type MagnetReady,
  type MagnetExpired,
  type MagnetError,
} from "./types";
import type {
  Magnet,
  MagnetListed,
  MagnetListedError,
  MagnetListedExpired,
  MagnetListedReady,
} from "./types";
import { mapApiError } from "../../core/errors";

export type MagnetListStatusFilters = "active" | "ready" | "expired" | "error";

export class MagnetResource {
  constructor(private readonly client: AlldebridHttpClient) {}

  async list(status: "active"): Promise<MagnetListedReady[]>;
  async list(status: "ready"): Promise<MagnetListedReady[]>;
  async list(status: "expired"): Promise<MagnetListedExpired[]>;
  async list(status: "error"): Promise<MagnetListedError[]>;
  async list(): Promise<MagnetListed[]>;
  async list(status?: MagnetListStatusFilters): Promise<MagnetListed[]> {
    const MagnetsListedResponseDataSchema = z.object({
      magnets: z.preprocess((entry) => {
        if (Array.isArray(entry)) return entry;
        return Object.values(entry as Record<string, unknown>);
      }, z.array(MagnetListedSchema)),
    });
    const r = await this.client.request(
      "v4.1/magnet/status",
      MagnetsListedResponseDataSchema,
      status
        ? { method: "POST", form: { status: status } }
        : { method: "POST" },
    );
    if (!r.ok && r.errorType === "alldebrid") {
      throw mapApiError(r.error, r.demo);
    } else if (!r.ok && r.errorType === "parsing") {
      throw r.error as ZodError;
    }
    return r.data.magnets;
  }

  async get(id: number, status: "active"): Promise<MagnetReady>;
  async get(id: number, status: "ready"): Promise<MagnetReady>;
  async get(id: number, status: "expired"): Promise<MagnetExpired>;
  async get(id: number, status: "error"): Promise<MagnetError>;
  async get(
    id: number,
  ): Promise<Magnet | MagnetReady | MagnetError | MagnetExpired> {
    const MagnetResponseData = z.object({
      magnets: z.preprocess(
        (val) => (Array.isArray(val) ? val[0] : val),
        MagnetSchema,
      ),
    });
    const r = await this.client.request(
      "v4.1/magnet/status",
      MagnetResponseData,
      { method: "POST", queryParams: { id } },
    );
    if (!r.ok && r.errorType === "alldebrid") {
      throw mapApiError(r.error, r.demo);
    } else if (!r.ok && r.errorType === "parsing") {
      throw r.error as ZodError;
    }
    return r.data.magnets;
  }
}
