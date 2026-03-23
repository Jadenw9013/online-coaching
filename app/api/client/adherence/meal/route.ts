import { NextRequest, NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { normalizeToMonday } from "@/lib/utils/date";
import { z } from "zod";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  mealNameSnapshot: z.string().min(1).max(100),
  displayOrder: z.number().int().min(0),
  completed: z.boolean(),
});

export async function POST(req: NextRequest) {
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

  // Verify coach assignment (required by action logic)
  const assignment = await db.coachClient.findFirst({
    where: { clientId: user.id },
    select: { id: true },
  });
  if (!assignment) {
    return NextResponse.json({ error: "No coach assignment" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { date, mealNameSnapshot, displayOrder, completed } = parsed.data;

    // Upsert DailyAdherence parent (mirrors action logic)
    const weekOf = normalizeToMonday(new Date(date + "T12:00:00Z"));
    const adherenceRecord = await db.dailyAdherence.upsert({
      where: { clientId_date: { clientId: user.id, date } },
      create: { clientId: user.id, date, weekOf },
      update: {},
      select: { id: true },
    });

    // Upsert the meal checkoff
    await db.dailyMealCheckoff.upsert({
      where: {
        dailyAdherenceId_mealNameSnapshot: {
          dailyAdherenceId: adherenceRecord.id,
          mealNameSnapshot,
        },
      },
      create: {
        dailyAdherenceId: adherenceRecord.id,
        mealNameSnapshot,
        displayOrder,
        completed,
        completedAt: completed ? new Date() : null,
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    // Return the updated adherence record
    const updated = await db.dailyAdherence.findUnique({
      where: { clientId_date: { clientId: user.id, date } },
      include: {
        meals: { orderBy: { displayOrder: "asc" } },
        exercises: { orderBy: { exerciseOrder: "asc" } },
      },
    });

    return NextResponse.json({
      adherence: updated
        ? {
            id: updated.id,
            date: updated.date,
            workoutCompleted: updated.workoutCompleted,
            workoutCompletedAt: updated.workoutCompletedAt?.toISOString() ?? null,
            meals: updated.meals.map((m) => ({
              name: m.mealNameSnapshot,
              completed: m.completed,
              completedAt: m.completedAt?.toISOString() ?? null,
              displayOrder: m.displayOrder,
            })),
          }
        : null,
    });
  } catch (err) {
    console.error("[POST /api/client/adherence/meal]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
