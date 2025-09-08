import { z } from "zod";
import { logger } from "../logger/logger";

const DemoFlagSchema = z
  .union([z.literal("true"), z.boolean()])
  .optional()
  .transform((v) => (v === "true" ? true : !!v));

const AlldebridErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});
type AlldebridErrorSchema = z.infer<typeof AlldebridErrorSchema>;

/** Error envelope according to docs. */
export const ApiErrorEnvelopeSchema = z.object({
  status: z.literal("error"),
  error: AlldebridErrorSchema,
  demo: DemoFlagSchema,
});

/** Success envelope (data shape is endpoint-specific). */
export function ApiSuccessEnvelopeSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    status: z.literal("success"),
    data: dataSchema,
    demo: DemoFlagSchema,
  });
}

/** Narrow TypeScript helper types. */
export type ApiErrorEnvelopeSchema = z.infer<typeof ApiErrorEnvelopeSchema>;
export type ApiSuccessEnvelopeSchema<T extends z.ZodType> = {
  status: "success";
  data: z.infer<T>;
  demo?: boolean;
};

export type ParsedSuccessEnvelope<T> = { ok: true; data: T; demo: boolean };
export type ParsedErrorEnvelope = {
  ok: false;
  error: AlldebridErrorSchema;
  demo: boolean;
};

export function parseEnvelope<T extends z.ZodType>(
  json: unknown,
  dataSchema: T
): ParsedSuccessEnvelope<z.output<T>> | ParsedErrorEnvelope {
  const UnionSchema = z.discriminatedUnion("status", [
    ApiSuccessEnvelopeSchema(dataSchema),
    ApiErrorEnvelopeSchema,
  ]);
  const r = UnionSchema.safeParse(json);
  if (!r.success) {
    logger.error(r.error)
    throw new Error("Invalid API response shape.");
  } else {
    if (r.data.status === "success") {
      const envelope = r.data as ApiSuccessEnvelopeSchema<T>;
      return {
        ok: true,
        data: envelope.data,
        demo: envelope.demo ?? false,
      };
    } else {
      const envelope = r.data as ApiErrorEnvelopeSchema;
      return {
        ok: false,
        error: envelope.error,
        demo: envelope.demo ?? false,
      };
    }
  }
}
