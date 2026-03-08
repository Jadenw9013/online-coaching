import { z } from "zod";

export const WORKOUT_BLOCK_TYPES = [
  "EXERCISE",
  "ACTIVATION",
  "INSTRUCTION",
  "SUPERSET",
  "CARDIO",
  "OPTIONAL",
] as const;

export const parsedBlockSchema = z.object({
  type: z.enum(WORKOUT_BLOCK_TYPES).default("EXERCISE"),
  title: z.string().default(""),
  content: z.string().default(""),
});

export const parsedDaySchema = z.object({
  dayName: z.string().default(""),
  blocks: z.array(parsedBlockSchema).default([]),
});

export const parsedWorkoutProgramSchema = z.object({
  name: z.string().default("Imported Workout Plan"),
  notes: z.string().optional().default(""),
  days: z.array(parsedDaySchema).min(1),
});

export type ParsedBlock = z.infer<typeof parsedBlockSchema>;
export type ParsedDay = z.infer<typeof parsedDaySchema>;
export type ParsedWorkoutProgram = z.infer<typeof parsedWorkoutProgramSchema>;

const ACCEPTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateWorkoutUploadFile(mimeType: string, size?: number) {
  if (!ACCEPTED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Unsupported file type: ${mimeType}. Accepted: PNG, JPG, WEBP, PDF.`,
    };
  }
  if (size && size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large (${(size / 1024 / 1024).toFixed(1)}MB). Max: 10MB.`,
    };
  }
  return { valid: true, error: null };
}
