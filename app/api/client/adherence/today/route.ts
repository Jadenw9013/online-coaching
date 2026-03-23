import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { getTodayAdherence, getTodayMealNames } from "@/lib/queries/adherence";

/** Returns YYYY-MM-DD in the client's local timezone (or UTC fallback). */
function todayString(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export async function GET() {
  // ── Auth ────────────────────────────────────────────────────────────────
  let user: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    user = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isClient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const tz = user.timezone || "America/Los_Angeles";
    const date = todayString(tz);

    const [adherence, mealEntries, coachClient] = await Promise.all([
      getTodayAdherence(user.id, date),
      getTodayMealNames(user.id),
      db.coachClient.findFirst({
        where: { clientId: user.id },
        select: { adherenceEnabled: true },
      }),
    ]);

    return NextResponse.json({
      adherence: adherence
        ? {
            id: adherence.id,
            date,
            workoutCompleted: adherence.workoutCompleted,
            workoutCompletedAt: adherence.workoutCompletedAt,
            meals: adherence.meals.map((m) => ({
              name: m.mealNameSnapshot,
              completed: m.completed,
              completedAt: m.completedAt,
              displayOrder: m.displayOrder,
            })),
            exercises: adherence.exercises.map((e) => ({
              dayLabel: e.dayLabel,
              exerciseName: e.exerciseName,
              exerciseOrder: e.exerciseOrder,
              completed: e.completed,
            })),
          }
        : null,
      mealNames: mealEntries.map((m) => m.mealName),
      enabled: coachClient?.adherenceEnabled ?? false,
      date,
    });
  } catch (err) {
    console.error("[GET /api/client/adherence/today]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
