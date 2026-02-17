import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDateUTC } from "@/lib/utils/date";

export default async function CheckInDetailRedirect({
  params,
}: {
  params: Promise<{ checkInId: string }>;
}) {
  const { checkInId } = await params;

  const checkIn = await db.checkIn.findUnique({
    where: { id: checkInId },
    select: { clientId: true, weekOf: true },
  });

  if (!checkIn) notFound();

  const weekDateStr = formatDateUTC(checkIn.weekOf);
  redirect(`/coach/clients/${checkIn.clientId}/review/${weekDateStr}`);
}
