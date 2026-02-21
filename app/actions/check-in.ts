"use server";

import { z } from "zod";
import { createCheckInSchema } from "@/lib/validations/check-in";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { parseWeekStartDate, getLocalDate } from "@/lib/utils/date";
import { verifyCoachAccessToCheckIn } from "@/lib/queries/check-ins";
import { revalidatePath } from "next/cache";

export async function createCheckIn(input: unknown) {
  const user = await getCurrentDbUser();

  if (user.activeRole !== "CLIENT") {
    throw new Error("Only clients can submit check-ins");
  }

  // Require an assigned coach
  const coachAssignment = await db.coachClient.findFirst({
    where: { clientId: user.id },
  });
  if (!coachAssignment) {
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

  const { weekOf, weight, dietCompliance, energyLevel, notes, photoPaths, overwriteToday } = parsed.data;

  const weekDate = parseWeekStartDate(weekOf);
  const now = new Date();
  const tz = user.timezone || "America/Los_Angeles";
  const localDate = getLocalDate(now, tz);

  const checkInFields = {
    weight,
    dietCompliance: typeof dietCompliance === "number" ? dietCompliance : null,
    energyLevel: typeof energyLevel === "number" ? energyLevel : null,
    notes: notes || null,
  };

  // Check for existing check-in today (same localDate)
  const existingToday = await db.checkIn.findFirst({
    where: { clientId: user.id, localDate, deletedAt: null },
    orderBy: { submittedAt: "desc" },
    select: { id: true, submittedAt: true },
  });

  // If a check-in already exists today and caller hasn't chosen what to do
  if (existingToday && overwriteToday === undefined) {
    return {
      conflict: {
        code: "CHECKIN_EXISTS_TODAY" as const,
        existing: {
          id: existingToday.id,
          submittedAt: existingToday.submittedAt.toISOString(),
        },
      },
    };
  }

  // Overwrite: update the latest check-in for today
  if (existingToday && overwriteToday === true) {
    const [, updated] = await db.$transaction([
      db.checkInPhoto.deleteMany({ where: { checkInId: existingToday.id } }),
      db.checkIn.update({
        where: { id: existingToday.id },
        data: {
          ...checkInFields,
          weekOf: weekDate,
          submittedAt: now,
          localDate,
          timezone: tz,
          status: "SUBMITTED",
          photos: {
            create: photoPaths.map((path, i) => ({
              storagePath: path,
              sortOrder: i,
            })),
          },
        },
      }),
    ]);

    revalidatePath("/client", "layout");
    revalidatePath("/coach", "layout");
    return { checkInId: updated.id, overwritten: true };
  }

  // Add as new (overwriteToday === false) or no existing today
  const checkIn = await db.checkIn.create({
    data: {
      clientId: user.id,
      weekOf: weekDate,
      isPrimary: true,
      submittedAt: now,
      localDate,
      timezone: tz,
      ...checkInFields,
      photos: {
        create: photoPaths.map((path, i) => ({
          storagePath: path,
          sortOrder: i,
        })),
      },
    },
  });

  revalidatePath("/client", "layout");
  revalidatePath("/coach", "layout");
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
