import { z } from "zod";
import { DateTime } from "luxon";

// BASE
const MagnetBaseSchema = z.object({
  id: z.number(),
  filename: z.string(),
  hash: z.string(),
  status: z.string(),
  statusCode: z.int().gte(0).lte(11),
  type: z.string().optional(),
  notified: z.boolean().optional(),
  version: z.int().gte(1).optional(),
});

// READY
export const MagnetFileSchema = z.object({
  n: z.string(),
  s: z.int().gt(0),
  l: z.url(),
});
export type MagnetFile = z.infer<typeof MagnetFileSchema>;
export const MagnetDirSchema = z.object({
  n: z.string(),
  get e() {
    return z.array(z.union([MagnetFileSchema, MagnetDirSchema]));
  },
});
export type MagnetDir = z.infer<typeof MagnetDirSchema>;

export const MagnetListedReadySchema = MagnetBaseSchema.extend({
  status: z.literal("Ready"),
  statusCode: z.literal(4),
  size: z.int().gt(0),
  uploadDate: z
    .int()
    .gt(0)
    .transform((num) => DateTime.fromSeconds(num)),
  completionDate: z
    .int()
    .gt(0)
    .transform((num) => DateTime.fromSeconds(num)),
  nbLinks: z.int().gt(0),
});
export type MagnetListedReady = z.infer<typeof MagnetListedReadySchema>;

export const MagnetReadySchema = MagnetListedReadySchema.extend({
  files: z.array(z.union([MagnetFileSchema, MagnetDirSchema])),
});
export type MagnetReady = z.infer<typeof MagnetReadySchema>;

// PROCESSING
const MagnetProcessingBaseSchema = MagnetBaseSchema.extend({
  downloaded: z.int().gte(0),
  size: z.int().gte(0),
  uploaded: z.int().gte(0),
  seeders: z.int().gte(0),
  downloadSpeed: z.int().gte(0),
  processingPerc: z.int().gte(0).optional(),
  uploadSpeed: z.int().gte(0),
});

export const MagnetListedProcessingQueuedSchema =
  MagnetProcessingBaseSchema.extend({
    status: z.literal("In Queue"),
    statusCode: z.literal(0),
    uploadDate: z
      .int()
      .gt(0)
      .transform((num) => DateTime.fromSeconds(num)),
    completionDate: z.literal(0).transform(() => undefined),
  });
export type MagnetListedProcessingQueued = z.infer<
  typeof MagnetListedProcessingQueuedSchema
>;
export const MagnetProcessingQueuedSchema = MagnetListedProcessingQueuedSchema;
export type MagnetProcessingQueued = z.infer<
  typeof MagnetProcessingQueuedSchema
>;

export const MagnetListedProcessingDownloadingSchema =
  MagnetProcessingQueuedSchema.extend({
    status: z.literal("Downloading"),
    statusCode: z.literal(1),
  });
export type MagnetListedProcessingDownloading = z.infer<
  typeof MagnetListedProcessingDownloadingSchema
>;
export const MagnetProcessingDownloadingSchema =
  MagnetListedProcessingDownloadingSchema;
export type MagnetProcessingDownloading = z.infer<
  typeof MagnetProcessingDownloadingSchema
>;

export const MagnetListedProcessingUploadingSchema =
  MagnetProcessingQueuedSchema.extend({
    status: z.literal("Uploading"),
    statusCode: z.literal(3),
  });
export type MagnetListedProcessingUploading = z.infer<
  typeof MagnetListedProcessingUploadingSchema
>;

export const MagnetProcessingUploadingSchema =
  MagnetListedProcessingUploadingSchema;
export type MagnetProcessingUploading = z.infer<
  typeof MagnetProcessingUploadingSchema
>;

export const MagnetListedProcessingSchema = z.discriminatedUnion("statusCode", [
  MagnetListedProcessingDownloadingSchema,
  MagnetListedProcessingQueuedSchema,
  MagnetListedProcessingUploadingSchema,
]);
export type MagnetListedProcessing = z.infer<
  typeof MagnetListedProcessingSchema
>;
export const MagnetProcessingSchema = z.discriminatedUnion("statusCode", [
  MagnetProcessingDownloadingSchema,
  MagnetProcessingQueuedSchema,
  MagnetProcessingUploadingSchema,
]);
export type MagnetProcessing = z.infer<typeof MagnetProcessingSchema>;

// ERROR
export const MagnetListedErrorSchema = MagnetBaseSchema.extend({
  status: z.string(),
  statusCode: z.union([
    z.literal(5),
    z.literal(6),
    z.literal(7),
    z.literal(8),
    z.literal(9),
    z.literal(10),
    z.literal(12),
    z.literal(13),
    z.literal(14),
    z.literal(15),
  ]),
  size: z
    .int()
    .gte(0)
    .optional()
    .transform(() => undefined),
  uploadDate: z
    .int()
    .transform((num) => (num === 0 ? undefined : DateTime.fromSeconds(num))),
  completionDate: z
    .int()
    .optional()
    .transform((num) => (!num ? undefined : DateTime.fromSeconds(num))),
});
export type MagnetListedError = z.infer<typeof MagnetListedErrorSchema>;
export const MagnetErrorSchema = MagnetListedErrorSchema;
export type MagnetError = z.infer<typeof MagnetErrorSchema>;

// EXPIRED
export const MagnetListedExpiredSchema = MagnetListedErrorSchema.extend({
  statusCode: z.literal(11),
  size: z.int().gt(0),
});
export type MagnetListedExpired = z.infer<typeof MagnetListedExpiredSchema>;
export const MagnetExpiredSchema = MagnetListedExpiredSchema;
export type MagnetExpired = z.infer<typeof MagnetExpiredSchema>;

// GENERAL
export const MagnetListedSchema = z.discriminatedUnion("statusCode", [
  MagnetListedReadySchema,
  MagnetListedProcessingQueuedSchema,
  MagnetListedProcessingDownloadingSchema,
  MagnetListedProcessingUploadingSchema,
  MagnetListedExpiredSchema,
  MagnetListedErrorSchema,
]);
export type MagnetListed = z.infer<typeof MagnetListedSchema>;

export const MagnetSchema = z.discriminatedUnion("statusCode", [
  MagnetReadySchema,
  MagnetProcessingQueuedSchema,
  MagnetProcessingDownloadingSchema,
  MagnetProcessingUploadingSchema,
  MagnetExpiredSchema,
  MagnetErrorSchema,
]);
export type Magnet = z.infer<typeof MagnetSchema>;

// UPLOAD TORRENT MAGNETS AND FILES
const UploadTorrentSuccessBaseSchema = z.object({
  name: z.string(),
  id: z.int().gte(0),
  hash: z.string(),
  size: z.int().gte(0),
  ready: z.boolean(),
});
export const UploadedMagnetSuccessSchema =
  UploadTorrentSuccessBaseSchema.extend({
    magnet: z.string(),
  });
export type UploadedMagnetSuccess = z.infer<typeof UploadedMagnetSuccessSchema>;
export const UploadedFileSuccessSchema = UploadTorrentSuccessBaseSchema.extend({
  file: z.string(),
});
export type UploadedFileSuccess = z.infer<typeof UploadedFileSuccessSchema>;

export const UploadedTorrentErroredBaseSchema = z.object({
  error: z.object({
    code: z.enum([
      "MAGNET_NO_URI",
      "MAGNET_INVALID_URI",
      "MAGNET_MUST_BE_PREMIUM",
      "MAGNET_NO_SERVER",
      "MAGNET_TOO_MANY_ACTIVE",
    ]),
    message: z.string(),
  }),
});
export const UploadedMagnetErroredSchema =
  UploadedTorrentErroredBaseSchema.extend({ magnet: z.string() });
export type UploadedMagnetErrored = z.infer<typeof UploadedMagnetErroredSchema>;
export const UploadedFileErroredSchema =
  UploadedTorrentErroredBaseSchema.extend({ file: z.string() });
export type UploadedFileErrored = z.infer<typeof UploadedFileErroredSchema>;

export const UploadedMagnetSchema = z.union([
  UploadedMagnetSuccessSchema,
  UploadedMagnetErroredSchema,
]);
export type UploadedMagnet = z.infer<typeof UploadedMagnetSchema>;

export const UploadedFileSchema = z.union([
  UploadedFileSuccessSchema,
  UploadedFileErroredSchema,
]);
export type UploadedFile = z.infer<typeof UploadedFileSchema>;

// DELETE
export const DeleteMagnetResponseSchema = z.object({
  message: z.string(),
});
export type DeleteMagnetResponse = z.infer<typeof DeleteMagnetResponseSchema>;

// RESTART
export const RestartMagnetResponseSchema = z.object({
  message: z.string(),
});
export type RestartMagnetResponse = z.infer<typeof RestartMagnetResponseSchema>;

export const RestartMagnetSuccessSchema = z.object({
  magnet: z.string(),
  message: z.string(),
});
export type RestartMagnetSuccess = z.infer<typeof RestartMagnetSuccessSchema>;

export const RestartMagnetErroredSchema = z.object({
  magnet: z.string(),
  error: z.object({
    code: z.enum(["MAGNET_INVALID_ID", "MAGNET_PROCESSING"]),
    message: z.string(),
  }),
});
export type RestartMagnetErrored = z.infer<typeof RestartMagnetErroredSchema>;

export const RestartMagnetBatchResponseSchema = z.object({
  magnets: z.array(
    z.union([RestartMagnetSuccessSchema, RestartMagnetErroredSchema]),
  ),
});
export type RestartMagnetBatchResponse = z.infer<
  typeof RestartMagnetBatchResponseSchema
>;
