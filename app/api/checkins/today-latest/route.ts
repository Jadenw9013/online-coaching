import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { getLocalDate } from "@/lib/utils/date";
import { getCheckInForLocalDate } from "@/lib/queries/check-ins";

export async function GET() {
  const user = await getCurrentDbUser();
  const tz = user.timezone || "America/Los_Angeles";
  const localDate = getLocalDate(new Date(), tz);

  const latest = await getCheckInForLocalDate(user.id, localDate);

  return NextResponse.json({
    existsToday: !!latest,
    latest: latest
      ? { id: latest.id, submittedAt: latest.submittedAt.toISOString() }
      : null,
  });
}
