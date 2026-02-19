import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentWeekMonday } from "@/lib/utils/date";
import { notifyCheckinReminder } from "@/lib/email/notify";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekMonday = getCurrentWeekMonday();
  let sent = 0;
  let skipped = 0;

  // Find all active coach-client assignments with client info
  const assignments = await db.coachClient.findMany({
    select: {
      clientId: true,
      client: {
        select: { emailCheckInReminders: true },
      },
    },
  });

  for (const assignment of assignments) {
    if (!assignment.client.emailCheckInReminders) {
      skipped++;
      continue;
    }

    // Check if this client already submitted a primary check-in for this week
    const existing = await db.checkIn.findFirst({
      where: {
        clientId: assignment.clientId,
        weekOf: weekMonday,
        deletedAt: null,
        isPrimary: true,
      },
      select: { id: true },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await notifyCheckinReminder({
      clientId: assignment.clientId,
      windowStartDate: weekMonday,
      stage: "OVERDUE",
    });
    sent++;
  }

  return NextResponse.json({ sent, skipped });
}
