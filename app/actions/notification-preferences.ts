"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";

const dayOfWeek = z.number().int().min(0).max(6);

const clientPrefsSchema = z.object({
  emailMealPlanUpdates: z.boolean().optional(),
  emailCheckInReminders: z.boolean().optional(),
});

export async function updateNotificationPreferences(input: unknown) {
  const parsed = clientPrefsSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const user = await getCurrentDbUser();
  if (user.activeRole !== "CLIENT") throw new Error("Not a client");

  await db.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  revalidatePath("/client");
  return { success: true };
}

const coachNotifySchema = z.object({
  defaultNotifyOnPublish: z.boolean(),
});

export async function updateCoachNotifyDefault(input: unknown) {
  const parsed = coachNotifySchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const user = await getCurrentDbUser();
  if (user.activeRole !== "COACH") throw new Error("Not a coach");

  await db.user.update({
    where: { id: user.id },
    data: { defaultNotifyOnPublish: parsed.data.defaultNotifyOnPublish },
  });

  return { success: true };
}

const coachScheduleSchema = z.object({
  checkInDaysOfWeek: z.array(dayOfWeek).min(1).refine(
    (arr) => new Set(arr).size === arr.length,
    { message: "Duplicate days not allowed" }
  ),
  timezone: z.string().min(1),
});

export async function updateCoachSchedule(input: unknown) {
  const parsed = coachScheduleSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const user = await getCurrentDbUser();
  if (user.activeRole !== "COACH") throw new Error("Not a coach");

  await db.user.update({
    where: { id: user.id },
    data: {
      checkInDaysOfWeek: parsed.data.checkInDaysOfWeek,
      timezone: parsed.data.timezone,
    },
  });

  revalidatePath("/coach");
  return { success: true };
}

const clientScheduleOverrideSchema = z.object({
  clientId: z.string().min(1),
  checkInDaysOfWeek: z.array(dayOfWeek).refine(
    (arr) => new Set(arr).size === arr.length,
    { message: "Duplicate days not allowed" }
  ),
});

export async function updateClientScheduleOverride(input: unknown) {
  const parsed = clientScheduleOverrideSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const user = await getCurrentDbUser();
  if (user.activeRole !== "COACH") throw new Error("Not a coach");

  const assignment = await db.coachClient.findUnique({
    where: {
      coachId_clientId: { coachId: user.id, clientId: parsed.data.clientId },
    },
  });
  if (!assignment) throw new Error("Not assigned to this client");

  await db.coachClient.update({
    where: { id: assignment.id },
    data: { checkInDaysOfWeekOverride: parsed.data.checkInDaysOfWeek },
  });

  revalidatePath(`/coach/clients/${parsed.data.clientId}`);
  return { success: true };
}
