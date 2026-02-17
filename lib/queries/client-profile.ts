import { db } from "@/lib/db";

export async function getClientProfile(coachId: string, clientId: string) {
  const assignment = await db.coachClient.findUnique({
    where: {
      coachId_clientId: { coachId, clientId },
    },
    include: {
      client: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!assignment) return null;

  // Latest 4 non-deleted check-ins for weight history + sparkline
  const [recentCheckIns, lastMessage] = await Promise.all([
    db.checkIn.findMany({
      where: { clientId, deletedAt: null },
      orderBy: { weekOf: "desc" },
      take: 4,
      select: {
        id: true,
        weekOf: true,
        weight: true,
        dietCompliance: true,
        energyLevel: true,
        status: true,
        createdAt: true,
      },
    }),
    db.message.findFirst({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const latestCheckIn = recentCheckIns[0] ?? null;
  const previousCheckIn = recentCheckIns[1] ?? null;
  const weightDelta =
    latestCheckIn?.weight != null && previousCheckIn?.weight != null
      ? +(latestCheckIn.weight - previousCheckIn.weight).toFixed(1)
      : null;

  return {
    client: assignment.client,
    coachNotes: assignment.coachNotes,
    latestCheckIn,
    previousCheckIn,
    weightDelta,
    recentCheckIns,
    lastMessageAt: lastMessage?.createdAt ?? null,
  };
}
