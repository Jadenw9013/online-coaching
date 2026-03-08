"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";

const BLOCK_TYPES = ["EXERCISE", "ACTIVATION", "INSTRUCTION", "SUPERSET", "CARDIO", "OPTIONAL"] as const;

const blockSchema = z.object({
  type: z.enum(BLOCK_TYPES),
  title: z.string().max(200).default(""),
  content: z.string().max(5000).default(""),
});

const daySchema = z.object({
  dayName: z.string().min(1).max(100),
  blocks: z.array(blockSchema).max(50).default([]),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const saveTemplateSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  days: z.array(daySchema).max(14),
});

const deleteTemplateSchema = z.object({
  templateId: z.string().min(1),
});

async function getCoachUser() {
  const user = await getCurrentDbUser();
  if (!user.isCoach) throw new Error("Unauthorized");
  return user;
}

async function verifyTemplateOwnership(templateId: string, coachId: string) {
  const template = await db.trainingTemplate.findUnique({
    where: { id: templateId },
    select: { coachId: true },
  });
  if (!template) throw new Error("Template not found");
  if (template.coachId !== coachId) throw new Error("Unauthorized");
  return template;
}

export async function createTrainingTemplate(input: unknown) {
  const parsed = createTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const coach = await getCoachUser();

  const template = await db.trainingTemplate.create({
    data: {
      coachId: coach.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    },
    select: { id: true },
  });

  revalidatePath("/coach/templates");
  return { templateId: template.id };
}

export async function saveTrainingTemplate(input: unknown) {
  const parsed = saveTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const coach = await getCoachUser();
  const { templateId, name, description, days } = parsed.data;

  await verifyTemplateOwnership(templateId, coach.id);

  // Atomically replace all days (cascade deletes blocks)
  await db.$transaction([
    db.trainingTemplateDay.deleteMany({ where: { templateId } }),
    ...days.map((day, i) =>
      db.trainingTemplateDay.create({
        data: {
          templateId,
          dayName: day.dayName,
          sortOrder: i,
          blocks: {
            create: day.blocks.map((b, j) => ({
              type: b.type,
              title: b.title,
              content: b.content,
              sortOrder: j,
            })),
          },
        },
      })
    ),
  ]);

  await db.trainingTemplate.update({
    where: { id: templateId },
    data: { name, description: description ?? null },
  });

  revalidatePath("/coach/templates");
  revalidatePath(`/coach/templates/${templateId}`);
  return { templateId };
}

export async function deleteTrainingTemplate(input: unknown) {
  const parsed = deleteTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const coach = await getCoachUser();
  await verifyTemplateOwnership(parsed.data.templateId, coach.id);

  await db.trainingTemplate.delete({ where: { id: parsed.data.templateId } });

  revalidatePath("/coach/templates");
  return { success: true };
}
