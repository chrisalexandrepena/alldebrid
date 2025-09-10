import { AlldebridHttpClient } from "../../core/http/client";
import { z } from "zod";
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
import { 
  type Result, 
  type SdkError, 
  type BatchResult, 
  createBatchResult 
} from "../../core/errors";

export type MagnetListStatusFilters = "active" | "ready" | "expired" | "error";

export class MagnetResource {
  constructor(private readonly client: AlldebridHttpClient) {}

  async list(status: "active"): Promise<Result<MagnetListedReady[], SdkError>>;
  async list(status: "ready"): Promise<Result<MagnetListedReady[], SdkError>>;
  async list(status: "expired"): Promise<Result<MagnetListedExpired[], SdkError>>;
  async list(status: "error"): Promise<Result<MagnetListedError[], SdkError>>;
  async list(): Promise<Result<MagnetListed[], SdkError>>;
  async list(status?: MagnetListStatusFilters): Promise<Result<MagnetListed[], SdkError>> {
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
    
    if (!response.ok) {
      return response;
    }
    
    return {
      ok: true,
      data: response.data.data.magnets,
    };
  }

  async get(id: number, status: "active"): Promise<Result<MagnetReady, SdkError>>;
  async get(id: number, status: "ready"): Promise<Result<MagnetReady, SdkError>>;
  async get(id: number, status: "expired"): Promise<Result<MagnetExpired, SdkError>>;
  async get(id: number, status: "error"): Promise<Result<MagnetError, SdkError>>;
  async get(
    id: number,
  ): Promise<Result<Magnet | MagnetReady | MagnetError | MagnetExpired, SdkError>> {
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
    
    if (!response.ok) {
      return response;
    }
    
    return {
      ok: true,
      data: response.data.data.magnets,
    };
  }

  async upload(
    magnets: string,
  ): Promise<Result<UploadedMagnetSuccess | UploadedMagnetErrored, SdkError>>;
  async upload(
    magnets: string[],
  ): Promise<Result<BatchResult<UploadedMagnetSuccess | UploadedMagnetErrored>, SdkError>>;
  async upload(
    magnets: string | string[],
  ): Promise<
    | Result<UploadedMagnetSuccess | UploadedMagnetErrored, SdkError>
    | Result<BatchResult<UploadedMagnetSuccess | UploadedMagnetErrored>, SdkError>
  > {
    const isArray = Array.isArray(magnets);
    const UploadMagnetResponseData = z.object({
      magnets: z.array(UploadedMagnetSchema),
    });
    const magnetArray = isArray ? magnets : [magnets];
    
    const response = await this.client.postRequest(
      "v4/magnet/upload",
      UploadMagnetResponseData,
      {
        requestType: "postFormData",
        method: "POST",
        formData: { magnets: magnetArray },
      },
    );
    
    if (!response.ok) {
      return response;
    }
    
    const data = response.data.data;
    if (!data.magnets[0]) {
      return {
        ok: false,
        error: {
          type: 'configuration' as const,
          message: 'No magnets returned from upload',
          retryable: false,
          timestamp: new Date(),
        },
      };
    }
    
    if (isArray) {
      const results = data.magnets.map((magnet) => ({
        ok: true as const,
        data: magnet,
      }));
      
      return {
        ok: true,
        data: createBatchResult(results),
      };
    }
    
    return {
      ok: true,
      data: data.magnets[0],
    };
  }

  async uploadFile(torrentFiles: {
    fileName: string;
    blob: Blob;
  }): Promise<Result<UploadedFileSuccess | UploadedFileErrored, SdkError>>;
  async uploadFile(
    torrentFiles: { fileName: string; blob: Blob }[],
  ): Promise<Result<BatchResult<UploadedFileSuccess | UploadedFileErrored>, SdkError>>;
  async uploadFile(
    torrentFiles:
      | { fileName: string; blob: Blob }
      | { fileName: string; blob: Blob }[],
  ): Promise<
    | Result<UploadedFileSuccess | UploadedFileErrored, SdkError>
    | Result<BatchResult<UploadedFileSuccess | UploadedFileErrored>, SdkError>
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
    
    if (!response.ok) {
      return response;
    }
    
    const data = response.data.data;
    if (!data.files[0]) {
      return {
        ok: false,
        error: {
          type: 'configuration' as const,
          message: 'No files returned from upload',
          retryable: false,
          timestamp: new Date(),
        },
      };
    }
    
    if (isArray) {
      const results = data.files.map((file) => ({
        ok: true as const,
        data: file,
      }));
      
      return {
        ok: true,
        data: createBatchResult(results),
      };
    }
    
    return {
      ok: true,
      data: data.files[0],
    };
  }
}
