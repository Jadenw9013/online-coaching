import { db } from "@/lib/db";
import { getCurrentWeekMonday } from "@/lib/utils/date";
import { getEffectiveScheduleDays } from "@/lib/scheduling/periods";

export async function getClientProfile(coachId: string, clientId: string) {
  const [assignment, coach] = await Promise.all([
    db.coachClient.findUnique({
      where: {
        coachId_clientId: { coachId, clientId },
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    db.user.findUnique({
      where: { id: coachId },
      select: { checkInDaysOfWeek: true },
    }),
  ]);

  if (!assignment || !coach) return null;

  const weekOf = getCurrentWeekMonday();

  // Fetch 12 check-ins for history + last message in parallel
  const [checkIns, lastMessage] = await Promise.all([
    db.checkIn.findMany({
      where: { clientId, deletedAt: null },
      orderBy: { submittedAt: "desc" },
      take: 12,
      select: {
        id: true,
        weekOf: true,
        weight: true,
        dietCompliance: true,
        energyLevel: true,
        status: true,
        notes: true,
        createdAt: true,
        submittedAt: true,
        localDate: true,
        _count: { select: { photos: true } },
      },
    }),
    db.message.findFirst({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const latestCheckIn = checkIns[0] ?? null;
  const previousCheckIn = checkIns[1] ?? null;
  const weightDelta =
    latestCheckIn?.weight != null && previousCheckIn?.weight != null
      ? +(latestCheckIn.weight - previousCheckIn.weight).toFixed(1)
      : null;

  // Determine current-week status based on weekOf
  const currentWeekCheckIn = checkIns.find(
    (c) => c.weekOf.getTime() === weekOf.getTime()
  );
  let currentWeekStatus: "submitted" | "reviewed" | "missing";
  if (!currentWeekCheckIn) {
    currentWeekStatus = "missing";
  } else if (currentWeekCheckIn.status === "REVIEWED") {
    currentWeekStatus = "reviewed";
  } else {
    currentWeekStatus = "submitted";
  }

  const effectiveScheduleDays = getEffectiveScheduleDays(
    coach.checkInDaysOfWeek,
    assignment.checkInDaysOfWeekOverride
  );

  return {
    client: assignment.client,
    coachNotes: assignment.coachNotes,
    latestCheckIn,
    previousCheckIn,
    weightDelta,
    checkIns,
    currentWeekStatus,
    currentWeekOf: weekOf,
    lastMessageAt: lastMessage?.createdAt ?? null,
    coachScheduleDays: coach.checkInDaysOfWeek,
    clientScheduleOverride: assignment.checkInDaysOfWeekOverride,
    effectiveScheduleDays,
  };
}
