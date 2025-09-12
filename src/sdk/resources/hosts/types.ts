import { z } from "zod";

// HOST INFO
export const HostSchema = z.object({
  name: z.string(),
  type: z.enum(["premium", "free"]),
  domains: z.array(z.string()),
  regexps: z.array(z.string()),
  regexp: z.union([z.string(), z.array(z.string())]),
  status: z.boolean().optional(),
});
export type Host = z.infer<typeof HostSchema>;
