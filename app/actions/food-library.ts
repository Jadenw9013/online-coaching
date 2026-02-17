"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";

const addItemSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  defaultUnit: z.string().min(1).max(20).default("serving"),
});

export async function addFoodLibraryItem(input: unknown) {
  const user = await getCurrentDbUser();
  if (!user.isCoach) throw new Error("Not a coach");

  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const item = await db.foodLibraryItem.upsert({
    where: {
      coachId_name: { coachId: user.id, name: parsed.data.name },
    },
    update: {},
    create: {
      coachId: user.id,
      name: parsed.data.name,
      defaultUnit: parsed.data.defaultUnit,
    },
  });

  revalidatePath("/coach", "layout");
  return { item };
}

const removeItemSchema = z.object({
  id: z.string().min(1),
});

export async function removeFoodLibraryItem(input: unknown) {
  const user = await getCurrentDbUser();
  if (!user.isCoach) throw new Error("Not a coach");

  const parsed = removeItemSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const item = await db.foodLibraryItem.findUnique({
    where: { id: parsed.data.id },
  });
  if (!item || item.coachId !== user.id) throw new Error("Not found");

  await db.foodLibraryItem.delete({ where: { id: parsed.data.id } });

  revalidatePath("/coach", "layout");
  return { success: true };
}
