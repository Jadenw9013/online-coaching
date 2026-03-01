import { db } from "@/lib/db";

/** Get all templates for a coach, ordered by default first then name. */
export async function getCoachTemplates(coachId: string) {
  return db.checkInTemplate.findMany({
    where: { coachId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

/** Get a single template by ID. */
export async function getTemplateById(templateId: string) {
  return db.checkInTemplate.findUnique({
    where: { id: templateId },
  });
}

/** Get the default template for a coach, if one exists. */
export async function getDefaultTemplate(coachId: string) {
  return db.checkInTemplate.findFirst({
    where: { coachId, isDefault: true },
  });
}

/**
 * Get the active template for a client.
 * Looks up the client's coach and returns the coach's default template.
 * Returns null if the coach has no default template (use built-in form).
 */
export async function getActiveTemplateForClient(clientId: string) {
  const assignment = await db.coachClient.findFirst({
    where: { clientId },
    select: { coachId: true },
  });

  if (!assignment) return null;

  return getDefaultTemplate(assignment.coachId);
}
