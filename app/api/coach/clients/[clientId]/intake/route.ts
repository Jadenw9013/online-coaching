import { NextRequest, NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  // ── Auth ────────────────────────────────────────────────────────────────
  let user: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    user = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isCoach) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { clientId } = await params;

  // Guard: verify this coach is assigned to this client
  const assignment = await db.coachClient.findUnique({
    where: { coachId_clientId: { coachId: user.id, clientId } },
    select: { id: true, coachNotes: true },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Look up the submitted IntakePacket via CoachingRequest
    const packet = await db.intakePacket.findFirst({
      where: {
        coachingRequest: {
          prospectId: clientId,
          coachProfile: { userId: user.id },
        },
      },
      select: {
        id: true,
        submittedAt: true,
        formAnswers: true,
        coachNotes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Load the coach's intake form template
    const template = await db.intakeFormTemplate.findUnique({
      where: { coachId: user.id },
      select: { id: true, sections: true },
    });

    // Also surface the legacy ClientIntake record if present
    const legacyIntake = await db.clientIntake.findUnique({
      where: { clientId },
      select: {
        id: true,
        status: true,
        sentAt: true,
        startedAt: true,
        completedAt: true,
        bodyweightLbs: true,
        heightInches: true,
        ageYears: true,
        gender: true,
        primaryGoal: true,
        targetTimeline: true,
        injuries: true,
        dietaryRestrictions: true,
        dietaryPreferences: true,
        currentDiet: true,
        trainingExperience: true,
        trainingDaysPerWeek: true,
        gymAccess: true,
      },
    });

    return NextResponse.json({
      intake: packet
        ? {
            id: packet.id,
            type: "packet",
            status: packet.submittedAt ? "COMPLETED" : "IN_PROGRESS",
            formAnswers: packet.formAnswers ?? null,
            coachNotes: packet.coachNotes ?? null,
            submittedAt: packet.submittedAt?.toISOString() ?? null,
            template: template
              ? { id: template.id, sections: template.sections }
              : null,
          }
        : legacyIntake
        ? {
            id: legacyIntake.id,
            type: "legacy",
            status: legacyIntake.status,
            formAnswers: null,
            coachNotes: assignment.coachNotes ?? null,
            submittedAt: legacyIntake.completedAt?.toISOString() ?? null,
            template: null,
            legacyFields: legacyIntake,
          }
        : null,
    });
  } catch (err) {
    console.error("[GET /api/coach/clients/[clientId]/intake]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
