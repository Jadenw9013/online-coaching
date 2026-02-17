"use server";

import { z } from "zod";
import { getCurrentDbUser, ensureCoachCode } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const becomeCoachSchema = z.object({
  accessCode: z.string().min(1, "Access code is required"),
});

export async function becomeCoach(input: unknown) {
  const user = await getCurrentDbUser();

  const parsed = becomeCoachSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please enter an access code." };
  }

  const { accessCode } = parsed.data;

  const validCode = process.env.STEADFAST_COACH_ACCESS_CODE;
  if (!validCode) {
    return { error: "Coach registration is not available at this time." };
  }

  if (accessCode.trim() !== validCode.trim()) {
    return { error: "Invalid access code. Please check with your administrator." };
  }

  if (user.isCoach) {
    return { error: "You already have coach access." };
  }

  // Grant coach capabilities
  await db.user.update({
    where: { id: user.id },
    data: {
      isCoach: true,
      isClient: true,
      activeRole: "COACH",
    },
  });

  // Ensure they have a coach code
  await ensureCoachCode(user.id);

  redirect("/coach/dashboard");
}
