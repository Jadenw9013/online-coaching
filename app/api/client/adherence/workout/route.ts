import { NextRequest, NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { normalizeToMonday } from "@/lib/utils/date";
import { z } from "zod";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
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

  // Verify coach assignment
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

    const { date, completed } = parsed.data;

    // Upsert DailyAdherence parent (mirrors action logic)
    const weekOf = normalizeToMonday(new Date(date + "T12:00:00Z"));
    const adherenceRecord = await db.dailyAdherence.upsert({
      where: { clientId_date: { clientId: user.id, date } },
      create: { clientId: user.id, date, weekOf },
      update: {},
      select: { id: true },
    });

    // Update workoutCompleted
    const updated = await db.dailyAdherence.update({
      where: { id: adherenceRecord.id },
      data: {
        workoutCompleted: completed,
        workoutCompletedAt: completed ? new Date() : null,
      },
      include: {
        meals: { orderBy: { displayOrder: "asc" } },
      },
    });

    return NextResponse.json({
      adherence: {
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
      },
    });
  } catch (err) {
    console.error("[POST /api/client/adherence/workout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
