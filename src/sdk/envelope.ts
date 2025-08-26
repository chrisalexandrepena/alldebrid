import { z } from "zod";

/**
 * The API may return a `demo` property when using static demo keys.
 * Docs show it as the string "true"; we'll accept boolean as well to be lenient.
 * Source: docs "Demo responses". 
 */
const DemoFlag = z
  .union([z.literal("true"), z.boolean()])
  .optional()
  .transform((v) => (v === "true" ? true : !!v));

/** Error envelope according to docs. */
export const ApiErrorEnvelope = z.object({
  status: z.literal("error"),
  error: z.object({
    // Some errors are numeric strings like "404", others are string codes like "AUTH_BAD_APIKEY"
    code: z.union([z.string(), z.number()]).transform((v) => String(v)),
    message: z.string(),
  }),
  demo: DemoFlag,
});

/** Success envelope (data shape is endpoint-specific). */
export const ApiSuccessEnvelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.literal("success"),
    data: dataSchema,
    demo: DemoFlag,
  });

/** Narrow TypeScript helper types. */
export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelope>;
export type ApiSuccessEnvelope<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof ApiSuccessEnvelope<T>>
>;

/**
 * Parse an unknown JSON into either a success payload (typed) or throw a descriptive error if it's neither.
 * - On "error" envelopes, we return the parsed error (caller can convert to AllDebridError).
 * - On "success" envelopes, we return the typed data.
 */
export function parseEnvelope<T extends z.ZodTypeAny>(
  json: unknown,
  dataSchema: T
): { ok: true; data: z.infer<T>; demo: boolean } | { ok: false; err: ApiErrorEnvelope } {
  // Try success first with the provided data schema
  const asSuccess = ApiSuccessEnvelope(dataSchema).safeParse(json);
  if (asSuccess.success) {
    return { ok: true, data: asSuccess.data.data, demo: !!asSuccess.data.demo };
  }

  // Try error envelope
  const asError = ApiErrorEnvelope.safeParse(json);
  if (asError.success) {
    return { ok: false, err: asError.data };
  }

  // If the payload doesn't match either, it's an invalid response per docs.
  // The HTTP layer will decide how to surface this.
  throw new Error("Invalid API response: no recognizable {status,data|error} envelope.");
}
