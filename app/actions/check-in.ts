"use server";

import { z } from "zod";
import { createCheckInSchema } from "@/lib/validations/check-in";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { parseWeekStartDate } from "@/lib/utils/date";
import { verifyCoachAccessToCheckIn } from "@/lib/queries/check-ins";
import { revalidatePath } from "next/cache";

export async function createCheckIn(input: unknown) {
  const user = await getCurrentDbUser();

  if (user.activeRole !== "CLIENT") {
    throw new Error("Only clients can submit check-ins");
  }

  // Require an assigned coach
  const hasCoach = await db.coachClient.findFirst({
    where: { clientId: user.id },
    select: { id: true },
  });
  if (!hasCoach) {
    return {
      error: {
        weekOf: [
          "You need to connect to a coach before submitting check-ins. Go to your dashboard to enter a coach code.",
        ],
      },
    };
  }

  const parsed = createCheckInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { weekOf, weight, dietCompliance, energyLevel, notes, photoPaths } = parsed.data;

  const weekDate = parseWeekStartDate(weekOf);

  const checkInFields = {
    weight,
    dietCompliance: typeof dietCompliance === "number" ? dietCompliance : null,
    energyLevel: typeof energyLevel === "number" ? energyLevel : null,
    notes: notes || null,
  };

  // Check for existing active check-ins this period
  const existingActive = await db.checkIn.findMany({
    where: { clientId: user.id, weekOf: weekDate, deletedAt: null },
    select: { id: true },
  });

  // Check for a soft-deleted primary to revive
  const deletedPrimary = existingActive.length === 0
    ? await db.checkIn.findFirst({
        where: { clientId: user.id, weekOf: weekDate, isPrimary: true, deletedAt: { not: null } },
        select: { id: true },
      })
    : null;

  const isPrimary = existingActive.length === 0;

  if (deletedPrimary && isPrimary) {
    // Revive soft-deleted primary: reset fields, clear deletedAt, replace photos
    const [, updated] = await db.$transaction([
      db.checkInPhoto.deleteMany({ where: { checkInId: deletedPrimary.id } }),
      db.checkIn.update({
        where: { id: deletedPrimary.id },
        data: {
          ...checkInFields,
          isPrimary: true,
          status: "SUBMITTED",
          deletedAt: null,
          photos: {
            create: photoPaths.map((path, i) => ({
              storagePath: path,
              sortOrder: i,
            })),
          },
        },
      }),
    ]);
    return { checkInId: updated.id };
  }

  // Create new check-in (primary if first, secondary otherwise)
  const checkIn = await db.checkIn.create({
    data: {
      clientId: user.id,
      weekOf: weekDate,
      isPrimary,
      ...checkInFields,
      photos: {
        create: photoPaths.map((path, i) => ({
          storagePath: path,
          sortOrder: i,
        })),
      },
    },
  });

  return { checkInId: checkIn.id };
}

const deleteCheckInSchema = z.object({
  checkInId: z.string().min(1),
});

export async function deleteCheckIn(input: unknown) {
  const user = await getCurrentDbUser();
  if (user.activeRole !== "CLIENT") {
    throw new Error("Only clients can delete check-ins");
  }

  const parsed = deleteCheckInSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const checkIn = await db.checkIn.findUnique({
    where: { id: parsed.data.checkInId },
    select: { clientId: true, deletedAt: true },
  });
  if (!checkIn) throw new Error("Check-in not found");
  if (checkIn.clientId !== user.id) throw new Error("Not your check-in");
  if (checkIn.deletedAt) throw new Error("Already deleted");

  await db.checkIn.update({
    where: { id: parsed.data.checkInId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/client", "layout");
  revalidatePath("/coach", "layout");
  return { success: true };
}

const markReviewedSchema = z.object({
  checkInId: z.string().min(1),
});

export async function markCheckInReviewed(input: unknown) {
  const parsed = markReviewedSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid input");
  }

  await verifyCoachAccessToCheckIn(parsed.data.checkInId);

  await db.checkIn.update({
    where: { id: parsed.data.checkInId },
    data: { status: "REVIEWED" },
  });

  revalidatePath("/coach", "layout");
  return { success: true };
}
