import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";

export async function GET() {
  // ── Auth ────────────────────────────────────────────────────────────────
  let user: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    user = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isClient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // IntakePacket has no direct clientId — ownership via coachingRequest.prospectId
    const packet = await db.intakePacket.findFirst({
      where: {
        coachingRequest: { prospectId: user.id },
        submittedAt: null, // not yet completed
      },
      select: {
        id: true,
        submittedAt: true,
        formAnswers: true,
        coachingRequest: {
          select: {
            id: true,
            coachProfile: {
              select: { userId: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Determine status
    const statusOf = (p: typeof packet) => {
      if (!p) return null;
      if (!p.formAnswers) return "PENDING";
      return "IN_PROGRESS";
    };

    // If no in-progress packet, check for a completed one (read-only)
    const displayPacket =
      packet ??
      (await db.intakePacket.findFirst({
        where: {
          coachingRequest: { prospectId: user.id },
          submittedAt: { not: null },
        },
        select: {
          id: true,
          submittedAt: true,
          formAnswers: true,
          coachingRequest: {
            select: {
              id: true,
              coachProfile: {
                select: { userId: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }));

    if (!displayPacket) {
      return NextResponse.json({ intake: null });
    }

    const coachId = displayPacket.coachingRequest.coachProfile.userId;
    const template = await db.intakeFormTemplate.findUnique({
      where: { coachId },
      select: { id: true, sections: true },
    });

    const status =
      displayPacket.submittedAt
        ? "COMPLETED"
        : (statusOf(packet) ?? "PENDING");

    return NextResponse.json({
      intake: {
        id: displayPacket.id,
        status,
        formAnswers: displayPacket.formAnswers ?? null,
        template: template
          ? { id: template.id, sections: template.sections }
          : null,
      },
    });
  } catch (err) {
    console.error("[GET /api/intake/current]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
