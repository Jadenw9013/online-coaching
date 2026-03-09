import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyDailyCheckInReminder, notifyMissedCheckInAlert } from "@/lib/sms/notify";
import { getLocalDate } from "@/lib/utils/date";
import { getEffectiveScheduleDays } from "@/lib/scheduling/periods";

/**
 * Checks if the configured DB time string (e.g., "19:00") aligns with the current server hour.
 * Since this cron presumably runs hourly, we just check if the hours match.
 */
function isTimeToTrigger(configuredTime: string, currentHourStr: string) {
  const timeParts = configuredTime.split(":");
  return timeParts[0] === currentHourStr;
}

/**
 * Check whether today (in the client's local timezone) is a scheduled check-in day.
 */
function isDueToday(scheduleDays: number[], tz: string, serverTime: Date): boolean {
  const d = new Date(serverTime.toLocaleString("en-US", { timeZone: tz }));
  return scheduleDays.includes(d.getDay());
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sentClientReminders = 0;
  let skippedNotDue = 0;
  let skippedDedup = 0;
  let sentCoachAlerts = 0;

  const serverTime = new Date();
  const currentHourStr = serverTime.getHours().toString().padStart(2, "0");

  // Find all active clients opted into SMS with daily reminders enabled.
  // Include their coach assignment to resolve effective schedule.
  const clientsToRemind = await db.user.findMany({
    where: {
      activeRole: "CLIENT",
      smsOptIn: true,
      smsDailyCheckInReminder: true,
    },
    select: {
      id: true,
      timezone: true,
      smsCheckInReminderTime: true,
      clientAssignments: {
        take: 1,
        select: {
          checkInDaysOfWeekOverride: true,
          coach: {
            select: { checkInDaysOfWeek: true },
          },
        },
      },
    },
  });

  for (const client of clientsToRemind) {
    // Check if this hour matches their configured reminder time
    if (!isTimeToTrigger(client.smsCheckInReminderTime, currentHourStr)) {
      continue;
    }

    const tz = client.timezone || "America/Los_Angeles";

    // Resolve effective schedule days for this client
    const assignment = client.clientAssignments[0];
    const scheduleDays = assignment
      ? getEffectiveScheduleDays(
        assignment.coach.checkInDaysOfWeek,
        assignment.checkInDaysOfWeekOverride
      )
      : [1]; // default Monday if no coach assigned

    // Skip if today is not a scheduled check-in day
    if (!isDueToday(scheduleDays, tz, serverTime)) {
      skippedNotDue++;
      continue;
    }

    const localDate = getLocalDate(serverTime, tz);

    // Check if this client already submitted a check-in today
    const existing = await db.checkIn.findFirst({
      where: {
        clientId: client.id,
        localDate: localDate,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) continue;

    // Dedup: check if we already sent a reminder today for this client
    const todayStart = new Date(localDate + "T00:00:00Z");
    const todayEnd = new Date(localDate + "T23:59:59.999Z");
    const alreadySent = await db.notificationLog.findFirst({
      where: {
        clientId: client.id,
        type: "CHECKIN_REMINDER",
        sentAt: { gte: todayStart, lte: todayEnd },
      },
      select: { id: true },
    });

    if (alreadySent) {
      skippedDedup++;
      continue;
    }

    await notifyDailyCheckInReminder(client.id);
    sentClientReminders++;
  }

  // Find all active coaches opted into SMS expecting missed alerts
  const coachesToAlert = await db.user.findMany({
    where: {
      activeRole: "COACH",
      smsOptIn: true,
      smsMissedCheckInAlerts: true,
    },
    select: {
      id: true,
      smsMissedCheckInAlertTime: true,
      checkInDaysOfWeek: true,
      coachAssignments: {
        select: {
          checkInDaysOfWeekOverride: true,
          client: {
            select: {
              id: true,
              firstName: true,
              timezone: true,
            },
          },
        },
      },
    },
  });

  for (const coach of coachesToAlert) {
    if (!isTimeToTrigger(coach.smsMissedCheckInAlertTime, currentHourStr)) {
      continue;
    }

    for (const assignment of coach.coachAssignments) {
      const tz = assignment.client.timezone || "America/Los_Angeles";

      // Resolve effective schedule for this specific client
      const scheduleDays = getEffectiveScheduleDays(
        coach.checkInDaysOfWeek,
        assignment.checkInDaysOfWeekOverride
      );

      // Skip if today is not a due day for this client
      if (!isDueToday(scheduleDays, tz, serverTime)) {
        continue;
      }

      const localDate = getLocalDate(serverTime, tz);

      // Check if this specific client missed their check-in today
      const existing = await db.checkIn.findFirst({
        where: {
          clientId: assignment.client.id,
          localDate: localDate,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!existing) {
        await notifyMissedCheckInAlert(coach.id, assignment.client.firstName || "Your client");
        sentCoachAlerts++;
      }
    }
  }

  return NextResponse.json({
    sentClientReminders,
    sentCoachAlerts,
    skippedNotDue,
    skippedDedup,
  });
}
