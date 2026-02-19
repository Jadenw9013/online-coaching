import { NextRequest, NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { getWeightHistory } from "@/lib/queries/weight-history";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const user = await getCurrentDbUser();

  // Auth: user is the client themselves, or is their coach
  const isClient = user.id === clientId;
  const isCoach =
    !isClient &&
    user.isCoach &&
    !!(await db.coachClient.findUnique({
      where: { coachId_clientId: { coachId: user.id, clientId } },
      select: { id: true },
    }));

  if (!isClient && !isCoach) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const range = req.nextUrl.searchParams.get("range") as
    | "30d"
    | "90d"
    | "all"
    | null;
  const validRanges = ["30d", "90d", "all"];
  const safeRange = range && validRanges.includes(range) ? range : "all";

  const data = await getWeightHistory(clientId, safeRange);
  return NextResponse.json(data);
}
