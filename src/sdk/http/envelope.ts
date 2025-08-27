import { z } from "zod";

const DemoFlag = z
  .union([z.literal("true"), z.boolean()])
  .optional()
  .transform((v) => (v === "true" ? true : !!v));

const AlldebridError = z.object({
  code: z.string(),
  message: z.string(),
});
type AlldebridError = z.infer<typeof AlldebridError>;

/** Error envelope according to docs. */
export const ApiErrorEnvelope = z.object({
  status: z.literal("error"),
  error: AlldebridError,
  demo: DemoFlag,
});

/** Success envelope (data shape is endpoint-specific). */
export function ApiSuccessEnvelope<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    status: z.literal("success"),
    data: dataSchema,
    demo: DemoFlag,
  });
}

/** Narrow TypeScript helper types. */
export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelope>;
export type ApiSuccessEnvelope<T extends z.ZodType> = {
  status: "success";
  data: z.infer<T>;
  demo?: boolean;
};

export type ParsedSuccessEnvelope<T> = { ok: true; data: T; demo: boolean };
export type ParsedErrorEnvelope = {
  ok: false;
  error: AlldebridError;
  demo: boolean;
};

export function parseEnvelope<T extends z.ZodType>(
  json: unknown,
  dataSchema: T,
): ParsedSuccessEnvelope<z.output<T>> | ParsedErrorEnvelope {
  const Union = z.discriminatedUnion("status", [
    ApiSuccessEnvelope(dataSchema),
    ApiErrorEnvelope,
  ]);
  const r = Union.safeParse(json);
  if (!r.success) throw new Error("Invalid API response shape.");
  else {
    if (r.data.status === "success") {
      const envelope = r.data as ApiSuccessEnvelope<T>;
      return {
        ok: true,
        data: envelope.data,
        demo: envelope.demo ?? false,
      };
    } else {
      const envelope = r.data as ApiErrorEnvelope;
      return {
        ok: false,
        error: envelope.error,
        demo: envelope.demo ?? false,
      };
    }
  }
}
