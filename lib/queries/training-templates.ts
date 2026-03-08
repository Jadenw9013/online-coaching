import { db } from "@/lib/db";

const daySelect = {
  id: true,
  dayName: true,
  sortOrder: true,
  blocks: {
    orderBy: { sortOrder: "asc" as const },
    select: { id: true, type: true, title: true, content: true, sortOrder: true },
  },
} as const;

export async function getCoachTemplates(coachId: string) {
  return db.trainingTemplate.findMany({
    where: { coachId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
      _count: { select: { days: true } },
    },
  });
}

export async function getCoachTemplatesForPicker(coachId: string) {
  return db.trainingTemplate.findMany({
    where: { coachId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      days: {
        orderBy: { sortOrder: "asc" },
        select: daySelect,
      },
    },
  });
}

export async function getTemplateById(templateId: string, coachId: string) {
  return db.trainingTemplate.findFirst({
    where: { id: templateId, coachId },
    select: {
      id: true,
      name: true,
      description: true,
      days: {
        orderBy: { sortOrder: "asc" },
        select: daySelect,
      },
    },
  });
}
