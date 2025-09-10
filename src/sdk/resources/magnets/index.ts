import { AlldebridHttpClient } from "../../core/http/client";
import { z, type ZodError } from "zod";
import {
  MagnetSchema,
  MagnetListedSchema,
  UploadedMagnetSchema,
  type MagnetReady,
  type MagnetExpired,
  type MagnetError,
  type UploadedMagnetSuccess,
  type UploadedMagnetErrored,
  UploadedFileSchema,
  type UploadedFileErrored,
  type UploadedFileSuccess,
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
    const r = await this.client.postRequest(
      "v4.1/magnet/status",
      MagnetsListedResponseDataSchema,
      status
        ? {
            requestType: "postFormData",
            method: "POST",
            formData: { status: status },
          }
        : { requestType: "simplePost", method: "POST" },
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
    const r = await this.client.postRequest(
      "v4.1/magnet/status",
      MagnetResponseData,
      { requestType: "simplePost", method: "POST", queryParams: { id } },
    );
    if (!r.ok && r.errorType === "alldebrid") {
      throw mapApiError(r.error, r.demo);
    } else if (!r.ok && r.errorType === "parsing") {
      throw r.error as ZodError;
    }
    return r.data.magnets;
  }

  async upload(
    magnets: string,
  ): Promise<UploadedMagnetSuccess | UploadedMagnetErrored>;
  async upload(
    magnets: string[],
  ): Promise<(UploadedMagnetSuccess | UploadedMagnetErrored)[]>;
  async upload(
    magnets: string | string[],
  ): Promise<
    | (UploadedMagnetSuccess | UploadedMagnetErrored)
    | (UploadedMagnetSuccess | UploadedMagnetErrored)[]
  > {
    const returnType = Array.isArray(magnets) ? "array" : "singleObject";
    const UploadMagnetResponseData = z.object({
      magnets: z.array(UploadedMagnetSchema),
    });
    magnets = Array.isArray(magnets) ? magnets : [magnets];
    const r = await this.client.postRequest(
      "v4/magnet/upload",
      UploadMagnetResponseData,
      {
        requestType: "postFormData",
        method: "POST",
        formData: { magnets },
      },
    );
    if (!r.ok && r.errorType === "alldebrid") {
      throw mapApiError(r.error, r.demo);
    } else if (!r.ok && r.errorType === "parsing") {
      throw r.error as ZodError;
    } else if (!r.data.magnets[0]) {
      throw new Error("Empty result");
    }
    return returnType === "array" ? r.data.magnets : r.data.magnets[0];
  }

  async uploadFile(torrentFiles: {
    fileName: string;
    blob: Blob;
  }): Promise<UploadedFileSuccess | UploadedFileErrored>;
  async uploadFile(
    torrentFiles: { fileName: string; blob: Blob }[],
  ): Promise<(UploadedFileSuccess | UploadedFileErrored)[]>;
  async uploadFile(
    torrentFiles:
      | { fileName: string; blob: Blob }
      | { fileName: string; blob: Blob }[],
  ): Promise<
    | (UploadedFileSuccess | UploadedFileErrored)
    | (UploadedFileSuccess | UploadedFileErrored)[]
  > {
    const returnType = Array.isArray(torrentFiles) ? "array" : "singleObject";
    const UploadTorrentFileResponseData = z.object({
      files: z.array(UploadedFileSchema),
    });
    const sp = new FormData();
    torrentFiles = Array.isArray(torrentFiles) ? torrentFiles : [torrentFiles];
    torrentFiles.forEach((file, i) =>
      sp.append(`files[${i}]`, file.blob, file.fileName),
    );
    const r = await this.client.postRequest(
      "v4/magnet/upload/file",
      UploadTorrentFileResponseData,
      { method: "POST", formData: sp, requestType: "postFormData" },
    );
    if (!r.ok && r.errorType === "alldebrid") {
      throw mapApiError(r.error, r.demo);
    } else if (!r.ok && r.errorType === "parsing") {
      throw r.error as ZodError;
    } else if (!r.data.files[0]) {
      throw new Error("Empty result");
    }
    return returnType === "array" ? r.data.files : r.data.files[0];
  }

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
