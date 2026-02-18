"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";

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
