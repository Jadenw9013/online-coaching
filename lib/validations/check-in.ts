import { z } from "zod";

export const createCheckInSchema = z.object({
  weekOf: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  weight: z.coerce.number().positive({ message: "Weight is required" }),
  dietCompliance: z.coerce.number().int().min(1).max(10).optional().or(z.literal("")),
  energyLevel: z.coerce.number().int().min(1).max(10).optional().or(z.literal("")),
  notes: z.string().max(5000).optional(),
  photoPaths: z.array(z.string()).max(3),
});

export type CreateCheckInInput = z.infer<typeof createCheckInSchema>;
