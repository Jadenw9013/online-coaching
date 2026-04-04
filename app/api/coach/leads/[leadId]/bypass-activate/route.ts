import { NextRequest, NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";

type Params = { params: Promise<{ leadId: string }> };

// ── POST — bypass pipeline and activate client directly ──────────────────────
// Uses raw SQL throughout to avoid adapter-pg column mapping issues.

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

    // 1. Verify coach owns this lead
    const leads = await db.$queryRaw<Array<{
      id: string;
      coachProfileId: string;
      consultationStage: string;
      prospectName: string;
      prospectEmail: string;
      prospectPhone: string | null;
      prospectEmailAddr: string | null;
    }>>`
      SELECT cr."id", cr."coachProfileId", cr."consultationStage",
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
      return NextResponse.json({ success: false, message: "This lead is already active." }, { status: 409 });
    }
    if (lead.consultationStage === "DECLINED") {
      return NextResponse.json({ success: false, message: "This lead was declined." }, { status: 409 });
    }

    // 2. Find the prospect's User account by email or phone
    const email = lead.prospectEmailAddr ?? null;
    const phone = (lead.prospectPhone ?? lead.prospectEmail ?? "").replace(/\D/g, "");

    let users: Array<{ id: string; email: string; firstName: string | null }> = [];
    if (email) {
      users = await db.$queryRaw<typeof users>`
        SELECT "id", "email", "firstName" FROM "User" WHERE LOWER("email") = ${email.toLowerCase()} LIMIT 1
      `;
    }
    if (users.length === 0 && phone.length >= 7) {
      users = await db.$queryRaw<typeof users>`
        SELECT "id", "email", "firstName" FROM "User" WHERE "phoneNumber" LIKE ${"%" + phone.slice(-10)} LIMIT 1
      `;
    }

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: "This prospect hasn't created a Steadfast account yet. Send them an invite first.",
      }, { status: 422 });
    }
    const prospectUser = users[0];

    // 3. Create CoachClient link (idempotent)
    await db.$executeRaw`
      INSERT INTO "CoachClient" ("id", "coachId", "clientId", "coachNotes", "createdAt")
      VALUES (gen_random_uuid()::text, ${user.id}, ${prospectUser.id}, 'Activated via pipeline bypass.', NOW())
      ON CONFLICT ("coachId", "clientId") DO NOTHING
    `;

    // 4. Update lead to ACTIVE
    await db.$executeRaw`
      UPDATE "CoachingRequest"
      SET "consultationStage" = 'ACTIVE'::"ConsultationStage",
          "status" = 'ACCEPTED'::"RequestStatus",
          "prospectId" = ${prospectUser.id},
          "updatedAt" = NOW()
      WHERE "id" = ${leadId}
    `;

    // 5. Welcome email (fire-and-forget)
    try {
      const { sendEmail } = await import("@/lib/email/sendEmail");
      const { coachConnectedEmail } = await import("@/lib/email/templates");
      const content = coachConnectedEmail(
        prospectUser.firstName || lead.prospectName,
        user.firstName || "Your coach"
      );
      sendEmail({ to: prospectUser.email, ...content }).catch(() => {});
    } catch { /* never block */ }

    // 6. Revalidate (non-blocking)
    try { const { revalidatePath } = await import("next/cache"); revalidatePath("/coach/leads"); } catch {}

    return NextResponse.json({
      success: true,
      message: `${lead.prospectName} has been added to your roster.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[bypass-activate]", msg);
    return NextResponse.json({ success: false, message: `Server error: ${msg}` }, { status: 500 });
  }
}
