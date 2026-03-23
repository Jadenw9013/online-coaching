import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { getClientCheckInsLight } from "@/lib/queries/check-ins";
import { getCurrentPublishedMealPlan } from "@/lib/queries/meal-plans";
import { getPublishedTrainingProgram } from "@/lib/queries/training-programs";
import { getMyIntake } from "@/lib/queries/client-intake";
import {
  getAdherenceEnabled,
  getTodayAdherence,
  getTodayMealNames,
} from "@/lib/queries/adherence";
import {
  parseCadenceConfig,
  getEffectiveCadence,
  getClientCadenceStatus,
  cadenceFromLegacyDays,
  getCadencePreview,
  type CadenceConfig,
} from "@/lib/scheduling/cadence";
import {
  getCurrentWeekMonday,
  formatDateUTC,
  getLocalDate,
} from "@/lib/utils/date";

function getIntervalMs(config: CadenceConfig): number {
  switch (config.type) {
    case "weekly":
      return 7 * 24 * 60 * 60 * 1000;
    case "daily":
      return 24 * 60 * 60 * 1000;
    case "every_n_days":
      return config.intervalDays * 24 * 60 * 60 * 1000;
    case "every_n_hours":
      return config.intervalHours * 60 * 60 * 1000;
  }
}

export async function GET() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  let user: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    user = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.activeRole !== "CLIENT" && !user.isClient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // ── Coach assignment (explicit select — P2022 safety) ─────────────────
    const coachAssignment = await db.coachClient.findFirst({
      where: { clientId: user.id },
      select: {
        id: true,
        cadenceConfig: true,
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoPath: true,
            checkInDaysOfWeek: true,
            cadenceConfig: true,
            coachProfile: { select: { slug: true } },
          },
        },
      },
    });

    // ── Timezone + today ──────────────────────────────────────────────────
    const tz = user.timezone || "America/Los_Angeles";
    const todayDate = getLocalDate(new Date(), tz);
    const weekOf = getCurrentWeekMonday();

    // ── Parallel data fetches ─────────────────────────────────────────────
    const [
      checkIns,
      mealPlan,
      trainingProgram,
      intake,
      adherenceEnabled,
      todayAdherence,
      mealNames,
      latestMessage,
      legacyOnboarding,
    ] = await Promise.all([
      getClientCheckInsLight(user.id),
      getCurrentPublishedMealPlan(user.id),
      getPublishedTrainingProgram(user.id),
      getMyIntake(user.id),
      getAdherenceEnabled(user.id),
      getTodayAdherence(user.id, todayDate),
      getTodayMealNames(user.id),
      db.message.findFirst({
        where: { clientId: user.id, weekOf },
        orderBy: { createdAt: "desc" },
        select: { id: true, body: true, senderId: true, createdAt: true },
      }),
      db.onboardingResponse.findUnique({
        where: { clientId: user.id },
        select: { id: true },
      }),
    ]);

    // ── Cadence status (mirrors app/client/page.tsx exactly) ─────────────
    const coachCadence = coachAssignment
      ? parseCadenceConfig(coachAssignment.coach.cadenceConfig)
      : null;
    const clientCadenceOverride = coachAssignment
      ? parseCadenceConfig(coachAssignment.cadenceConfig)
      : null;
    const effectiveCadence = coachAssignment
      ? getEffectiveCadence(
          coachCadence ??
            cadenceFromLegacyDays(coachAssignment.coach.checkInDaysOfWeek),
          clientCadenceOverride
        )
      : null;

    const latestCheckIn = checkIns[0] ?? null;
    const cadenceResult =
      effectiveCadence
        ? getClientCadenceStatus(
            effectiveCadence,
            latestCheckIn
              ? {
                  submittedAt: latestCheckIn.submittedAt,
                  status: latestCheckIn.status,
                }
              : null,
            tz
          )
        : null;

    const cadencePreview = effectiveCadence
      ? getCadencePreview(effectiveCadence)
      : "No schedule set";

    // Derive period bounds from cadence interval
    let periodStart: string;
    let periodEnd: string;
    if (cadenceResult && effectiveCadence) {
      const intervalMs = getIntervalMs(effectiveCadence);
      periodEnd = formatDateUTC(cadenceResult.nextDue);
      periodStart = formatDateUTC(
        new Date(cadenceResult.nextDue.getTime() - intervalMs)
      );
    } else {
      periodStart = formatDateUTC(weekOf);
      periodEnd = formatDateUTC(
        new Date(weekOf.getTime() + 6 * 24 * 60 * 60 * 1000)
      );
    }

    // ── Intake status ─────────────────────────────────────────────────────
    let intakeStatus: "NONE" | "PENDING" | "IN_PROGRESS" | "COMPLETED" =
      "NONE";
    if (intake) {
      intakeStatus = intake.status; // PENDING | IN_PROGRESS | COMPLETED
    } else if (legacyOnboarding) {
      intakeStatus = "COMPLETED";
    }

    // ── Response ──────────────────────────────────────────────────────────
    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        timezone: user.timezone,
        profilePhotoPath: user.profilePhotoPath,
      },
      coachAssignment: coachAssignment
        ? {
            coach: {
              id: coachAssignment.coach.id,
              firstName: coachAssignment.coach.firstName,
              lastName: coachAssignment.coach.lastName,
              profilePhotoPath: coachAssignment.coach.profilePhotoPath,
              slug: coachAssignment.coach.coachProfile?.slug ?? null,
            },
          }
        : null,
      weekStatus: {
        cadenceStatus: cadenceResult?.status ?? "upcoming",
        cadencePreview,
        weekOf: weekOf.toISOString(),
        periodStart,
        periodEnd,
      },
      mealPlan: mealPlan
        ? {
            id: mealPlan.id,
            status: mealPlan.status,
            weekOf: mealPlan.weekOf.toISOString(),
          }
        : null,
      trainingProgram: trainingProgram
        ? {
            id: trainingProgram.id,
            status: trainingProgram.status,
            weekOf: trainingProgram.weekOf.toISOString(),
            days: trainingProgram.days.map((d) => ({
              id: d.id,
              dayName: d.dayName,
              sortOrder: d.sortOrder,
            })),
          }
        : null,
      latestMessage: latestMessage
        ? {
            id: latestMessage.id,
            content: latestMessage.body,
            senderId: latestMessage.senderId,
            createdAt: latestMessage.createdAt.toISOString(),
          }
        : null,
      intakeStatus,
      adherence: {
        enabled: adherenceEnabled,
        todayEntry: todayAdherence
          ? {
              id: todayAdherence.id,
              meals: todayAdherence.meals,
              workoutCompleted: todayAdherence.workoutCompleted,
            }
          : null,
        mealNames: mealNames.map((m) => m.mealName),
      },
    });
  } catch (err) {
    console.error("[GET /api/client/home]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
