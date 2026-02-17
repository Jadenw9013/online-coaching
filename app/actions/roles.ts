"use server";

import { z } from "zod";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const setRoleSchema = z.object({
  role: z.enum(["COACH", "CLIENT"]),
});

export async function setActiveRole(input: unknown) {
  const user = await getCurrentDbUser();

  const parsed = setRoleSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid role");
  }

  const { role } = parsed.data;

  // Validate the user has the capability
  if (role === "COACH" && !user.isCoach) {
    throw new Error("You don't have coach access");
  }
  if (role === "CLIENT" && !user.isClient) {
    throw new Error("You don't have client access");
  }

  await db.user.update({
    where: { id: user.id },
    data: { activeRole: role },
  });

  if (role === "COACH") {
    redirect("/coach/dashboard");
  } else {
    redirect("/client");
  }
}
