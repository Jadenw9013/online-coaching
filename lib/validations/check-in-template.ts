import { z } from "zod";

/**
 * Question types supported by check-in templates.
 *
 * - shortText: single-line text input
 * - longText: multi-line textarea
 * - number: numeric input with optional min/max/step/unit
 * - boolean: yes/no toggle
 * - scale: numeric scale with min/max/step and optional labels
 */
export const questionTypes = [
  "shortText",
  "longText",
  "number",
  "boolean",
  "scale",
] as const;

export type QuestionType = (typeof questionTypes)[number];

// Type-specific configuration schemas
const scaleConfigSchema = z.object({
  min: z.number().int().min(0).max(100),
  max: z.number().int().min(1).max(100),
  step: z.number().int().min(1).default(1),
  minLabel: z.string().max(50).optional(),
  maxLabel: z.string().max(50).optional(),
});

const numberConfigSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
  unit: z.string().max(20).optional(),
});

export const questionSchema = z
  .object({
    id: z.string().min(1).max(50),
    type: z.enum(questionTypes),
    label: z.string().min(1).max(200),
    required: z.boolean().default(false),
    sortOrder: z.number().int().min(0),
    config: z.record(z.string(), z.unknown()).default({}),
  })
  .superRefine((q, ctx) => {
    if (q.type === "scale") {
      const result = scaleConfigSchema.safeParse(q.config);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            ...issue,
            path: ["config", ...issue.path],
          });
        });
        return;
      }
      if (result.data.min >= result.data.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Scale min must be less than max",
          path: ["config", "min"],
        });
      }
    }
    if (q.type === "number") {
      const result = numberConfigSchema.safeParse(q.config);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            ...issue,
            path: ["config", ...issue.path],
          });
        });
      }
    }
  });

export type TemplateQuestion = z.infer<typeof questionSchema>;

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  isDefault: z.boolean().default(false),
  questions: z
    .array(questionSchema)
    .min(1, "At least one question is required")
    .max(30, "Maximum 30 questions"),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
  questions: z.array(questionSchema).min(1).max(30).optional(),
});

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
