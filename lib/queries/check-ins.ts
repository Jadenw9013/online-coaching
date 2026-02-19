import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { getSignedDownloadUrl } from "@/lib/supabase/storage";
import { getCurrentWeekMonday } from "@/lib/utils/date";

export async function getClientCheckIns(clientId: string) {
  return db.checkIn.findMany({
    where: { clientId, deletedAt: null },
    orderBy: { weekOf: "desc" },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getClientCheckInsLight(clientId: string) {
  return db.checkIn.findMany({
    where: { clientId, deletedAt: null, isPrimary: true },
    orderBy: { weekOf: "desc" },
    select: {
      id: true,
      weekOf: true,
      weight: true,
      status: true,
      notes: true,
      createdAt: true,
      _count: { select: { photos: true } },
    },
  });
}

export async function getPreviousBodyweight(
  clientId: string,
  beforeWeekOf: Date
) {
  return db.checkIn.findFirst({
    where: {
      clientId,
      deletedAt: null,
      isPrimary: true,
      weekOf: { lt: beforeWeekOf },
      weight: { not: null },
    },
    orderBy: { weekOf: "desc" },
    select: { weight: true, weekOf: true },
  });
}

export async function getLatestCoachMessage(clientId: string) {
  return db.message.findFirst({
    where: {
      clientId,
      sender: { isCoach: true },
    },
    orderBy: { createdAt: "desc" },
    select: { body: true, createdAt: true, weekOf: true },
  });
}

export async function getCheckInById(checkInId: string) {
  const checkIn = await db.checkIn.findUnique({
    where: { id: checkInId },
    include: {
      client: true,
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!checkIn || checkIn.deletedAt) return null;

  // Generate signed download URLs for photos
  const photosWithUrls = await Promise.all(
    checkIn.photos.map(async (photo) => ({
      ...photo,
      url: await getSignedDownloadUrl(photo.storagePath),
    }))
  );

  return { ...checkIn, photos: photosWithUrls };
}

export async function getCoachClients(coachId: string) {
  const assignments = await db.coachClient.findMany({
    where: { coachId },
    include: {
      client: {
        include: {
          checkIns: {
            where: { deletedAt: null },
            orderBy: { weekOf: "desc" },
            take: 1,
            select: { weekOf: true, createdAt: true },
          },
        },
      },
    },
  });

  return assignments.map((a) => ({
    id: a.client.id,
    firstName: a.client.firstName,
    lastName: a.client.lastName,
    email: a.client.email,
    latestCheckIn: a.client.checkIns[0] ?? null,
  }));
}

export async function getCoachClientsWithWeekStatus(coachId: string) {
  const weekOf = getCurrentWeekMonday();

  const assignments = await db.coachClient.findMany({
    where: { coachId },
    include: {
      client: {
        include: {
          checkIns: {
            where: { deletedAt: null, isPrimary: true },
            orderBy: { weekOf: "desc" },
            take: 2,
            select: {
              id: true,
              status: true,
              weekOf: true,
              weight: true,
              dietCompliance: true,
              energyLevel: true,
              createdAt: true,
            },
          },
          clientMessages: {
            where: { weekOf, senderId: { not: coachId } },
            select: { id: true },
          },
        },
      },
    },
  });

  return assignments.map((a) => {
    const currentCheckIn = a.client.checkIns.find(
      (c) => c.weekOf.getTime() === weekOf.getTime()
    ) ?? null;
    const previousCheckIn = a.client.checkIns.find(
      (c) => c.weekOf.getTime() !== weekOf.getTime()
    ) ?? null;

    let weekStatus: "new" | "reviewed" | "missing";
    if (!currentCheckIn) {
      weekStatus = "missing";
    } else if (currentCheckIn.status === "REVIEWED") {
      weekStatus = "reviewed";
    } else {
      weekStatus = "new";
    }

    const weight = currentCheckIn?.weight ?? null;
    const weightChange =
      currentCheckIn?.weight != null && previousCheckIn?.weight != null
        ? +(currentCheckIn.weight - previousCheckIn.weight).toFixed(1)
        : null;

    return {
      id: a.client.id,
      firstName: a.client.firstName,
      lastName: a.client.lastName,
      email: a.client.email,
      weekStatus,
      hasClientMessage: a.client.clientMessages.length > 0,
      checkInId: currentCheckIn?.id ?? null,
      weekOf,
      weight,
      weightChange,
      dietCompliance: currentCheckIn?.dietCompliance ?? null,
      energyLevel: currentCheckIn?.energyLevel ?? null,
      submittedAt: currentCheckIn?.createdAt ?? null,
    };
  });
}

export async function getCheckInByClientAndWeek(
  clientId: string,
  weekOf: Date
) {
  const checkIn = await db.checkIn.findFirst({
    where: {
      clientId,
      weekOf,
      deletedAt: null,
      isPrimary: true,
    },
    include: {
      client: true,
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!checkIn) return null;

  const photosWithUrls = await Promise.all(
    checkIn.photos.map(async (photo) => ({
      ...photo,
      url: await getSignedDownloadUrl(photo.storagePath),
    }))
  );

  return { ...checkIn, photos: photosWithUrls };
}

export async function getCheckInsByClientAndWeek(
  clientId: string,
  weekOf: Date
) {
  const checkIns = await db.checkIn.findMany({
    where: { clientId, weekOf, deletedAt: null },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  return Promise.all(
    checkIns.map(async (checkIn) => ({
      ...checkIn,
      photos: await Promise.all(
        checkIn.photos.map(async (photo) => ({
          ...photo,
          url: await getSignedDownloadUrl(photo.storagePath),
        }))
      ),
    }))
  );
}

export async function verifyCoachAccessToClient(clientId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const coach = await db.user.findUnique({ where: { clerkId: userId } });
  if (!coach || !coach.isCoach) throw new Error("Not a coach");

  const assignment = await db.coachClient.findUnique({
    where: {
      coachId_clientId: { coachId: coach.id, clientId },
    },
  });

  if (!assignment) throw new Error("Not assigned to this client");
  return coach;
}

export async function verifyCoachAccessToCheckIn(checkInId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const coach = await db.user.findUnique({ where: { clerkId: userId } });
  if (!coach || !coach.isCoach) throw new Error("Not a coach");

  const checkIn = await db.checkIn.findUnique({
    where: { id: checkInId },
    select: { clientId: true },
  });
  if (!checkIn) throw new Error("Check-in not found");

  const assignment = await db.coachClient.findUnique({
    where: {
      coachId_clientId: { coachId: coach.id, clientId: checkIn.clientId },
    },
  });

  if (!assignment) throw new Error("Not assigned to this client");
  return coach;
}
