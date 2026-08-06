import { z } from "zod";

// LINK INFO
export const LinkInfoSuccessSchema = z.object({
  link: z.url(),
  filename: z.string(),
  size: z.int(),
  host: z.string(),
  // AllDebrid omits this on some links, so never require it.
  hostDomain: z.string().optional(),
});
export type LinkInfoSuccess = z.infer<typeof LinkInfoSuccessSchema>;
export const LinkInfoErrorSchema = z.object({
  link: z.url(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type LinkInfoError = z.infer<typeof LinkInfoErrorSchema>;
export const LinkInfoSchema = z.union([
  LinkInfoSuccessSchema,
  LinkInfoErrorSchema,
]);
export type LinkInfo = z.infer<typeof LinkInfoSchema>;

// UNLOCK LINK
export const DebridLinkResponseSchema = z.object({
  link: z.url(),
  filename: z.string(),
  host: z.string(),
  streaming: z
    .array(
      z.object({
        id: z.string(),
        ext: z.string(),
        quality: z.union([z.string(), z.int()]),
        filesize: z.int(),
        proto: z.string(),
        name: z.string(),
      }),
    )
    .optional(),
  paws: z.boolean().optional(),
  filesize: z.int(),
  id: z.string(),
  // AllDebrid omits this on some links, so never require it.
  hostDomain: z.string().optional(),
  delayed: z.int().optional(),
});
export type DebridLinkResponse = z.infer<typeof DebridLinkResponseSchema>;
