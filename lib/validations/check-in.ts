import { z } from "zod";

export const createCheckInSchema = z.object({
  weight: z.coerce.number().positive({ message: "Weight is required" }),
  dietCompliance: z.coerce.number().int().min(1).max(10).optional().or(z.literal("")),
  energyLevel: z.coerce.number().int().min(1).max(10).optional().or(z.literal("")),
  notes: z.string().max(5000).optional(),
  photoPaths: z.array(z.string()).max(3),
  overwriteToday: z.boolean().optional(),
});

export type CreateCheckInInput = z.infer<typeof createCheckInSchema>;
