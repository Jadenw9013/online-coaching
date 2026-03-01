"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/roles";
import {
  createTemplateSchema,
  updateTemplateSchema,
} from "@/lib/validations/check-in-template";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/app/generated/prisma/client";

/** Serialize Zod-validated data to Prisma-compatible JSON. */
function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function createCheckInTemplate(input: unknown) {
  const user = await getCurrentDbUser();
  if (!user.isCoach) throw new Error("Only coaches can create templates");

  const parsed = createTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { name, questions } = parsed.data;

  // Always set as default — clear any existing default for this coach
  await db.checkInTemplate.updateMany({
    where: { coachId: user.id, isDefault: true },
    data: { isDefault: false },
  });

  const template = await db.checkInTemplate.create({
    data: {
      coachId: user.id,
      name,
      isDefault: true,
      version: 1,
      questions: toJsonValue(questions),
    },
  });

  revalidatePath("/coach", "layout");
  return { templateId: template.id };
}

export async function updateCheckInTemplate(input: unknown) {
  const user = await getCurrentDbUser();
  if (!user.isCoach) throw new Error("Only coaches can update templates");

  const parsed = updateTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { templateId, name, questions } = parsed.data;

  // Verify ownership
  const existing = await db.checkInTemplate.findUnique({
    where: { id: templateId },
  });
  if (!existing || existing.coachId !== user.id) {
    throw new Error("Template not found");
  }

  // Always ensure this template is the active default
  await db.checkInTemplate.updateMany({
    where: { coachId: user.id, isDefault: true, id: { not: templateId } },
    data: { isDefault: false },
  });

  // Increment version if questions are changing
  const nextVersion =
    questions !== undefined ? existing.version + 1 : existing.version;

  const updated = await db.checkInTemplate.update({
    where: { id: templateId },
    data: {
      ...(name !== undefined && { name }),
      isDefault: true,
      ...(questions !== undefined && { questions: toJsonValue(questions) }),
      version: nextVersion,
    },
  });

  revalidatePath("/coach", "layout");
  return { templateId: updated.id, version: updated.version };
}

const deleteTemplateSchema = z.object({
  templateId: z.string().min(1),
});

export async function deleteCheckInTemplate(input: unknown) {
  const user = await getCurrentDbUser();
  if (!user.isCoach) throw new Error("Only coaches can delete templates");

  const parsed = deleteTemplateSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const { templateId } = parsed.data;

  // Verify ownership
  const existing = await db.checkInTemplate.findUnique({
    where: { id: templateId },
    select: { coachId: true },
  });
  if (!existing || existing.coachId !== user.id) {
    throw new Error("Template not found");
  }

  // Prevent deletion if check-ins reference this template
  const usageCount = await db.checkIn.count({
    where: { templateId },
  });

  if (usageCount > 0) {
    return {
      error: {
        templateId: [
          `This template is used by ${usageCount} check-in${usageCount > 1 ? "s" : ""}. Remove it as default instead.`,
        ],
      },
    };
  }

  await db.checkInTemplate.delete({
    where: { id: templateId },
  });

  revalidatePath("/coach", "layout");
  return { success: true };
}

/** Deactivate the coach's active template so clients see only core fields. */
export async function resetToDefaultTemplate() {
  const user = await getCurrentDbUser();
  if (!user.isCoach) throw new Error("Only coaches can manage templates");

  await db.checkInTemplate.updateMany({
    where: { coachId: user.id, isDefault: true },
    data: { isDefault: false },
  });

  revalidatePath("/coach", "layout");
  return { success: true };
}
