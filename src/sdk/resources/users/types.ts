import { z } from "zod";
import { DateTime } from "luxon";
import { HostSchema } from "../hosts/types";

// USER INFO
export const UserSchema = z.object({
  username: z.string(),
  email: z.email(),
  isPremium: z.boolean(),
  isSubscribed: z.boolean(),
  isTrial: z.boolean(),
  premiumUntil: z
    .int()
    .transform((num) => (num === 0 ? null : DateTime.fromSeconds(num))),
  lang: z.string(),
  preferedDomain: z.string(),
  fidelityPoints: z.int(),
  limitedHostersQuotas: z.record(z.string(), z.int()),
  remainingTrialQuota: z.int().optional(),
  notifications: z.array(z.string()),
});
export type User = z.infer<typeof UserSchema>;

// USER HOSTS
export const UserHostSchema = HostSchema.extend({
  quota: z.int().optional(),
  quotaMax: z.int().optional(),
  quotaType: z.string().optional(),
  limitSimuDl: z.int().optional(),
});
export type UserHost = z.infer<typeof UserHostSchema>;

// USER VERIFICATION
export const VerificationEmailStatusSchema = z.object({
  verif: z.enum(["waiting", "allowed", "denied"]),
  resendable: z.boolean().optional(),
  apikey: z.string().optional(),
});
export type VarificationEmailStatus = z.infer<
  typeof VerificationEmailStatusSchema
>;

// USER LINKS
export const SavedLinkSchema = z.object({
  link: z.url(),
  filename: z.string(),
  date: z
    .int()
    .transform((num) => (num === 0 ? null : DateTime.fromSeconds(num))),
  size: z.int(),
  host: z.string(),
});
export type SavedLink = z.infer<typeof SavedLinkSchema>;
