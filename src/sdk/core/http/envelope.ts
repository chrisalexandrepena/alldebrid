import { z, type ZodError } from "zod";
import { 
  type Result, 
  type SdkError, 
  createApiError, 
  createValidationError 
} from "../errors";

const DemoFlagSchema = z
  .union([z.literal("true"), z.boolean()])
  .optional()
  .transform((v) => (v === "true" ? true : !!v));

const AlldebridErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});
type AlldebridErrorType = z.infer<typeof AlldebridErrorSchema>;

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
export type ApiErrorEnvelopeType = z.infer<typeof ApiErrorEnvelopeSchema>;
export type ApiSuccessEnvelopeType<T extends z.ZodType> = {
  status: "success";
  data: z.infer<T>;
  demo?: boolean;
};

export interface ParsedSuccessData<T> {
  data: T;
  demo: boolean;
}

export function parseEnvelope<T extends z.ZodType>(
  json: unknown,
  dataSchema: T,
  requestId?: string
): Result<ParsedSuccessData<z.output<T>>, SdkError> {
  const UnionSchema = z.discriminatedUnion("status", [
    ApiSuccessEnvelopeSchema(dataSchema),
    ApiErrorEnvelopeSchema,
  ]);
  
  const parseResult = UnionSchema.safeParse(json);
  
  if (!parseResult.success) {
    return {
      ok: false,
      error: createValidationError(parseResult.error, requestId),
    };
  }
  
  if (parseResult.data.status === "success") {
    const envelope = parseResult.data as ApiSuccessEnvelopeType<T>;
    return {
      ok: true,
      data: {
        data: envelope.data,
        demo: envelope.demo ?? false,
      },
    };
  }
  
  const envelope = parseResult.data as ApiErrorEnvelopeType;
  return {
    ok: false,
    error: createApiError(
      envelope.error,
      envelope.demo ?? false,
      requestId
    ),
  };
}