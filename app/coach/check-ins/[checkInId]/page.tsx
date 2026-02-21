import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

/**
 * Legacy route: /coach/check-ins/[checkInId]
 * Redirects to /coach/clients/[clientId]/check-ins/[checkInId]
 */
export default async function CheckInRedirectPage({
  params,
}: {
  params: Promise<{ checkInId: string }>;
}) {
  const { checkInId } = await params;

  const checkIn = await db.checkIn.findUnique({
    where: { id: checkInId },
    select: { clientId: true },
  });

  if (!checkIn) notFound();

  redirect(`/coach/clients/${checkIn.clientId}/check-ins/${checkInId}`);
}
