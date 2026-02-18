"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";

const removeClientSchema = z.object({
  clientId: z.string().min(1),
});

export async function removeClient(input: unknown) {
  const parsed = removeClientSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const user = await getCurrentDbUser();
  if (user.activeRole !== "COACH") throw new Error("Not a coach");

  const assignment = await db.coachClient.findUnique({
    where: {
      coachId_clientId: { coachId: user.id, clientId: parsed.data.clientId },
    },
  });

  if (!assignment) throw new Error("Client not found in your roster");

  await db.coachClient.delete({
    where: { id: assignment.id },
  });

  revalidatePath("/coach", "layout");
  return { success: true };
}

const leaveCoachSchema = z.object({
  coachClientId: z.string().min(1),
});

export async function leaveCoach(input: unknown) {
  const parsed = leaveCoachSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const user = await getCurrentDbUser();
  if (user.activeRole !== "CLIENT") throw new Error("Not a client");

  const assignment = await db.coachClient.findUnique({
    where: { id: parsed.data.coachClientId },
  });

  if (!assignment || assignment.clientId !== user.id) {
    throw new Error("Coach relationship not found");
  }

  await db.coachClient.delete({
    where: { id: assignment.id },
  });

  revalidatePath("/client", "layout");
  return { success: true };
}
