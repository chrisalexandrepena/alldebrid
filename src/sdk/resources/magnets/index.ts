import { AlldebridHttpClient } from "../../core/http/client";
import { z } from "zod";
import {
  MagnetListedSchema,
  UploadedMagnetSchema,
  type UploadedMagnetSuccess,
  type UploadedMagnetErrored,
  UploadedFileSchema,
  type UploadedFileErrored,
  type UploadedFileSuccess,
  DeleteMagnetResponseSchema,
  type DeleteMagnetResponse,
  RestartMagnetResponseSchema,
  type RestartMagnetResponse,
  RestartMagnetBatchResponseSchema,
  type RestartMagnetBatchResponse,
  MagnetSchema,
  type Magnet,
} from "./types";
import type {
  MagnetListed,
  MagnetListedError,
  MagnetListedExpired,
  MagnetListedReady,
} from "./types";
import {
  type BatchResult,
  createBatchResult,
  createConfigurationError,
} from "../../core/errors";

export type MagnetListStatusFilters = "active" | "ready" | "expired" | "error";
type InputTorrentFile = { fileName: string; blob: Blob };

export class MagnetResource {
  constructor(private readonly client: AlldebridHttpClient) {}

  async list(status: "active"): Promise<MagnetListedReady[]>;
  async list(status: "ready"): Promise<MagnetListedReady[]>;
  async list(
    status: "expired",
  ): Promise<MagnetListedExpired[]>;
  async list(status: "error"): Promise<MagnetListedError[]>;
  async list(): Promise<MagnetListed[]>;
  async list(
    status?: MagnetListStatusFilters,
  ): Promise<MagnetListed[]> {
    const MagnetsListedResponseDataSchema = z.object({
      magnets: z.preprocess((entry) => {
        if (Array.isArray(entry)) return entry;
        return Object.values(entry as Record<string, unknown>);
      }, z.array(MagnetListedSchema)),
    });

    const response = await this.client.postRequest(
      "v4.1/magnet/status",
      MagnetsListedResponseDataSchema,
      status
        ? {
            requestType: "postFormData",
            method: "POST",
            formData: { status },
          }
        : { requestType: "simplePost", method: "POST" },
    );

    return response.data.magnets;
  }

  async get(id: number): Promise<Magnet> {
    const MagnetResponseData = z.object({
      magnets: z.preprocess(
        (val) => (Array.isArray(val) ? val[0] : val),
        MagnetSchema,
      ),
    });

    const response = await this.client.postRequest(
      "v4.1/magnet/status",
      MagnetResponseData,
      { requestType: "simplePost", method: "POST", queryParams: { id } },
    );

    return response.data.magnets;
  }

  async upload(
    magnets: string,
  ): Promise<UploadedMagnetSuccess | UploadedMagnetErrored>;
  async upload(
    magnets: string[],
  ): Promise<BatchResult<UploadedMagnetSuccess | UploadedMagnetErrored>>;
  async upload(
    magnets: string | string[],
  ): Promise<
    | (UploadedMagnetSuccess | UploadedMagnetErrored)
    | BatchResult<UploadedMagnetSuccess | UploadedMagnetErrored>
  > {
    const isArray = Array.isArray(magnets);
    const UploadMagnetResponseDataSchema = z.object({
      magnets: z.array(UploadedMagnetSchema),
    });
    const magnetArray = isArray ? magnets : [magnets];

    const response = await this.client.postRequest(
      "v4/magnet/upload",
      UploadMagnetResponseDataSchema,
      {
        requestType: "postFormData",
        method: "POST",
        formData: { magnets: magnetArray },
      },
    );

    if (!response.data.magnets[0]) throw createConfigurationError("No magnets returned from upload");

    if (isArray) {
      const results = response.data.magnets.map((magnet: UploadedMagnetSuccess | UploadedMagnetErrored) => ({
        ok: true as const,
        data: magnet,
      }));

      return createBatchResult(results);
    }

    return response.data.magnets[0];
  }

  async uploadFile(
    torrentFiles: InputTorrentFile,
  ): Promise<UploadedFileSuccess | UploadedFileErrored>;
  async uploadFile(
    torrentFiles: InputTorrentFile[],
  ): Promise<BatchResult<UploadedFileSuccess | UploadedFileErrored>>;
  async uploadFile(
    torrentFiles: InputTorrentFile | InputTorrentFile[],
  ): Promise<
    | (UploadedFileSuccess | UploadedFileErrored)
    | BatchResult<UploadedFileSuccess | UploadedFileErrored>
  > {
    const isArray = Array.isArray(torrentFiles);
    const UploadTorrentFileResponseData = z.object({
      files: z.array(UploadedFileSchema),
    });

    const formData = new FormData();
    const filesArray = isArray ? torrentFiles : [torrentFiles];
    filesArray.forEach((file, i) =>
      formData.append(`files[${i}]`, file.blob, file.fileName),
    );

    const response = await this.client.postRequest(
      "v4/magnet/upload/file",
      UploadTorrentFileResponseData,
      { method: "POST", formData, requestType: "postFormData" },
    );

    if (!response.data.files[0]) throw createConfigurationError("No files returned from upload");

    if (isArray) {
      const results = response.data.files.map((file: UploadedFileSuccess | UploadedFileErrored) => ({
        ok: true as const,
        data: file,
      }));

      return createBatchResult(results);
    }

    return response.data.files[0];
  }

  async delete(id: number): Promise<DeleteMagnetResponse> {
    const response = await this.client.postRequest(
      "v4/magnet/delete",
      DeleteMagnetResponseSchema,
      {
        requestType: "postFormData",
        method: "POST",
        formData: { id: id.toString() },
      },
    );

    return response.data;
  }

  async restart(id: number): Promise<RestartMagnetResponse>;
  async restart(
    ids: number[],
  ): Promise<RestartMagnetBatchResponse>;
  async restart(
    idOrIds: number | number[],
  ): Promise<RestartMagnetResponse | RestartMagnetBatchResponse> {
    const isArray = Array.isArray(idOrIds);

    if (isArray) {
      const response = await this.client.postRequest(
        "v4/magnet/restart",
        RestartMagnetBatchResponseSchema,
        {
          requestType: "postFormData",
          method: "POST",
          formData: { ids: idOrIds.map((id) => id.toString()) },
        },
      );

      return response.data;
    } else {
      const response = await this.client.postRequest(
        "v4/magnet/restart",
        RestartMagnetResponseSchema,
        {
          requestType: "postFormData",
          method: "POST",
          formData: { id: idOrIds.toString() },
        },
      );

      return response.data;
    }
  }
}
