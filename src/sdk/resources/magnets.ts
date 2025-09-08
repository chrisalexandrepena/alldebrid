import { AlldebridHttpClient } from "../http/client";
import { mapApiError } from "../errors";
import { z } from "zod";
import {
  MagnetSchema,
  MagnetListedSchema,
} from "./types/magnets.types";
import type { Magnet, MagnetListed, MagnetListedError, MagnetListedExpired, MagnetListedReady } from "./types/magnets.types";

export type MagnetListStatusFilters = "active"|"ready"|"expired"|"error";

export class MagnetResource {
  constructor(private readonly client: AlldebridHttpClient) {}

  async list(status: "active" ): Promise<MagnetListedReady[]>;
  async list(status: "ready" ): Promise<MagnetListedReady[]>;
  async list(status: "expired" ): Promise<MagnetListedExpired[]>;
  async list(status: "error" ): Promise<MagnetListedError[]>;
  async list(): Promise<MagnetListed[]>;
  async list(status?: MagnetListStatusFilters): Promise<MagnetListed[]> {
    const MagnetsListedResponseData = status
      ? z.object({
          magnets: z.record(z.string(), MagnetListedSchema).transform(v=>Object.values(v)),
        })
      : z.object({
          magnets: z.array(MagnetListedSchema),
        });
    const r = await this.client.request(
      "v4.1/magnet/status",
      MagnetsListedResponseData,
      status
        ? { method: "POST", form: { status: status } }
        : { method: "POST" }
    );
    if (!r.ok) throw mapApiError(r.error, r.demo);
    return r.data.magnets;
  }

  async get(id: number): Promise<Magnet> {
    const MagnetResponseData = z.object({ magnets: MagnetSchema });
    const r = await this.client.request(
      "v4.1/magnet/status",
      MagnetResponseData,
      { method: "POST", queryParams: { id } }
    );
    if (!r.ok) throw mapApiError(r.error, r.demo);
    return r.data.magnets;
  }

  // async upload(magnets: string | string[]): Promise<MagnetUploadResult> {
  //   const arr = Array.isArray(magnets) ? magnets : [magnets];
  //   const r = await this.client.request(
  //     "magnet/upload",
  //     MagnetUploadResultSchema,
  //     {
  //       method: "POST",
  //       form: { magnets: arr },
  //     }
  //   );
  //   if (!r.ok) throw mapApiError(r.error, r.demo);
  //   return r.data;
  // }

  // async uploadFile(files: Blob[] | Blob): Promise<MagnetUploadFileResult> {
  //   const list = Array.isArray(files) ? files : [files];
  //   const form = new FormData();
  //   list.forEach((f) => form.append("files[]", f));
  //   const r = await this.client.upload(
  //     "magnet/upload/file",
  //     MagnetUploadFileResultSchema,
  //     form
  //   );
  //   if (!r.ok) throw mapApiError(r.error, r.demo);
  //   return r.data;
  // }

  // async status(params?: {
  //   id?: number;
  //   status?: "active" | "ready" | "expired" | "error";
  // }) {
  //   const r = await this.client.request(
  //     "v4.1/magnet/status",
  //     MagnetStatusSchema,
  //     {
  //       method: "POST",
  //       form: params ? params : {},
  //     }
  //   );
  //   if (!r.ok) throw mapApiError(r.error, r.demo);
  //   return r.data;
  // }

  // async delete(id: number) {
  //   const r = await this.client.request("magnet/delete", MagnetDeleteSchema, {
  //     method: "POST",
  //     form: { id },
  //   });
  //   if (!r.ok) throw mapApiError(r.error, r.demo);
  //   return r.data;
  // }

  // async restart(id: number | number[]) {
  //   const form = Array.isArray(id) ? { ids: id } : { id };
  //   const r = await this.client.request("magnet/restart", MagnetRestartSchema, {
  //     method: "POST",
  //     form,
  //   });
  //   if (!r.ok) throw mapApiError(r.error, r.demo);
  //   return r.data;
  // }
}
