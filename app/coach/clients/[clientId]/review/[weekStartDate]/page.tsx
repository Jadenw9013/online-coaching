import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { verifyCoachAccessToClient } from "@/lib/queries/check-ins";
import { parseWeekStartDate } from "@/lib/utils/date";
import { db } from "@/lib/db";

/**
 * Legacy route: /coach/clients/[clientId]/review/[weekStartDate]
 * Redirects to /coach/clients/[clientId]/check-ins/[checkInId]
 * by finding the latest check-in for the given client and week.
 */
export default async function ReviewRedirectPage({
  params,
}: {
  params: Promise<{ clientId: string; weekStartDate: string }>;
}) {
  const { clientId, weekStartDate } = await params;

  await verifyCoachAccessToClient(clientId);

  let weekOf: Date;
  try {
    weekOf = parseWeekStartDate(weekStartDate);
  } catch {
    notFound();
  }

  // Find the latest check-in for this client in this week
  const checkIn = await db.checkIn.findFirst({
    where: { clientId, weekOf, deletedAt: null },
    orderBy: { submittedAt: "desc" },
    select: { id: true },
  });

  if (!checkIn) {
    // No check-in for this week — fall back to client profile
    redirect(`/coach/clients/${clientId}`);
  }

  redirect(`/coach/clients/${clientId}/check-ins/${checkIn.id}`);
}
