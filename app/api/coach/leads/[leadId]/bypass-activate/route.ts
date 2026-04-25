import { NextRequest, NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { linkOrInviteProspect, getActivationMessage } from "@/lib/activation";

type Params = { params: Promise<{ leadId: string }> };

// ── POST — bypass pipeline and activate lead directly ────────────────────────
// Uses the shared linkOrInviteProspect helper to guarantee that both the
// has-account and no-account paths are always handled correctly.

export async function POST(_req: NextRequest, { params }: Params) {
  let user: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    user = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  if (!user.isCoach) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

  try {
    const { leadId } = await params;

    // 1. Verify coach owns this lead + get basic info
    const leads = await db.$queryRaw<Array<{
      id: string;
      consultationStage: string;
      prospectName: string;
      prospectEmail: string;
      prospectPhone: string | null;
      prospectEmailAddr: string | null;
    }>>`
      SELECT cr."id", cr."consultationStage",
             cr."prospectName", cr."prospectEmail", cr."prospectPhone", cr."prospectEmailAddr"
      FROM "CoachingRequest" cr
      JOIN "CoachProfile" cp ON cp."id" = cr."coachProfileId"
      WHERE cr."id" = ${leadId} AND cp."userId" = ${user.id}
      LIMIT 1
    `;

    if (leads.length === 0) {
      return NextResponse.json({ success: false, message: "Lead not found" }, { status: 404 });
    }
    const lead = leads[0];

    if (lead.consultationStage === "ACTIVE") {
      return NextResponse.json({ success: false, message: "Already active." }, { status: 409 });
    }

    // 2. Mark lead as ACTIVE
    await db.$executeRaw`
      UPDATE "CoachingRequest"
      SET "consultationStage" = 'ACTIVE'::"ConsultationStage",
          "status" = 'ACCEPTED'::"RequestStatus",
          "updatedAt" = NOW()
      WHERE "id" = ${leadId}
    `;

    // 3. Link prospect or create invite (shared helper — single source of truth)
    let linkResult: Awaited<ReturnType<typeof linkOrInviteProspect>> | null = null;
    try {
      linkResult = await linkOrInviteProspect(
        lead,
        { coachId: user.id, coachFirstName: user.firstName },
        leadId,
        "Activated via pipeline bypass.",
      );
    } catch (linkErr) {
      // Account linking failed — that's OK, lead is still ACTIVE
      console.error("[bypass-activate] account link failed (non-fatal):", linkErr);
    }

    // 4. Revalidate (non-blocking)
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/coach/leads");
      revalidatePath("/coach/dashboard");
    } catch {}

    const message = getActivationMessage(
      lead.prospectName,
      linkResult ?? { linked: false, inviteToken: "", email: "" },
    );

    return NextResponse.json({ success: true, message });
  } catch (err: unknown) {
    console.error("[bypass-activate]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

