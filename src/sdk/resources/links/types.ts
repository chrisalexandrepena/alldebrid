import { z } from "zod";

// LINK INFO
export const LinkInfoSchema = z.object({
  link: z.url(),
  filename: z.string(),
  size: z.int(),
  host: z.string(),
  hostDomain: z.url(),
});
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
  hostDomain: z.url(),
  delayed: z.int().optional(),
});
export type DebridLinkResponse = z.infer<typeof DebridLinkResponseSchema>;
