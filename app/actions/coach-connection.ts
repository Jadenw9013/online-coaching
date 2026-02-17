"use server";

import { z } from "zod";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const connectSchema = z.object({
  coachCode: z.string().min(1).max(10).trim(),
});

export async function connectToCoach(input: unknown) {
  const user = await getCurrentDbUser();

  if (user.activeRole !== "CLIENT") {
    throw new Error("Only clients can connect to a coach");
  }

  const parsed = connectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please enter a valid coach code." };
  }

  const code = parsed.data.coachCode.toUpperCase();

  const coach = await db.user.findUnique({
    where: { coachCode: code },
    select: { id: true, isCoach: true },
  });

  if (!coach || !coach.isCoach) {
    return { error: "Coach code not found. Please check and try again." };
  }

  // Check if already connected
  const existing = await db.coachClient.findUnique({
    where: {
      coachId_clientId: { coachId: coach.id, clientId: user.id },
    },
  });

  if (existing) {
    return { error: "You're already connected to this coach." };
  }

  await db.coachClient.create({
    data: {
      coachId: coach.id,
      clientId: user.id,
    },
  });

  revalidatePath("/client", "layout");
  return { success: true };
}
