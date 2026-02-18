import { z } from "zod";

export const parsedMealItemSchema = z.object({
  food: z.string().min(1),
  portion: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v ?? ""),
    z.string().default("")
  ),
  notes: z.string().optional(),
});

export const parsedMealSchema = z.object({
  name: z.string().min(1),
  items: z.array(parsedMealItemSchema).min(1),
});

export const parsedMealPlanSchema = z.object({
  title: z.string(),
  meals: z.array(parsedMealSchema).min(1),
  notes: z.string().optional().default(""),
});

export type ParsedMealItem = z.infer<typeof parsedMealItemSchema>;
export type ParsedMeal = z.infer<typeof parsedMealSchema>;
export type ParsedMealPlan = z.infer<typeof parsedMealPlanSchema>;

const ACCEPTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateUploadFile(mimeType: string, size?: number) {
  if (!ACCEPTED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: `Unsupported file type: ${mimeType}. Accepted: PNG, JPG, WEBP, PDF.` };
  }
  if (size && size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large (${(size / 1024 / 1024).toFixed(1)}MB). Max: 10MB.` };
  }
  return { valid: true, error: null };
}

/** Split a portion string like "6 oz" into quantity + unit */
export function splitPortion(portion: string): { quantity: string; unit: string } {
  const trimmed = portion.trim();
  if (!trimmed) return { quantity: "1", unit: "serving" };
  const match = trimmed.match(/^([\d.\/½¼¾⅓⅔]+)\s*(.+)$/);
  if (match) {
    return { quantity: match[1], unit: match[2].trim() || "serving" };
  }
  return { quantity: trimmed, unit: "serving" };
}
