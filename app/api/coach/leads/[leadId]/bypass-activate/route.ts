import { NextRequest, NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";

type Params = { params: Promise<{ leadId: string }> };

// ── POST — bypass pipeline and activate lead directly ────────────────────────
// This is intentionally simple and decoupled from the intake process.
// It always marks the lead as ACTIVE. If the prospect already has a Steadfast
// account, it also creates the CoachClient link. If not, the lead is still
// activated and the link gets created when the prospect eventually signs up
// (handled by the JIT handler in getCurrentDbUser).

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

    // 2. Mark lead as ACTIVE — this always succeeds regardless of prospect account status
    await db.$executeRaw`
      UPDATE "CoachingRequest"
      SET "consultationStage" = 'ACTIVE'::"ConsultationStage",
          "status" = 'ACCEPTED'::"RequestStatus",
          "updatedAt" = NOW()
      WHERE "id" = ${leadId}
    `;

    // 3. Best-effort: try to find prospect's account and link them
    //    If they don't have an account yet, that's fine — link happens on sign-up
    let linked = false;
    try {
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

      if (users.length > 0) {
        const prospect = users[0];

        // Link prospect to lead
        await db.$executeRaw`
          UPDATE "CoachingRequest" SET "prospectId" = ${prospect.id}, "updatedAt" = NOW()
          WHERE "id" = ${leadId}
        `;

        // Create CoachClient link (idempotent)
        await db.$executeRaw`
          INSERT INTO "CoachClient" ("id", "coachId", "clientId", "coachNotes", "createdAt")
          VALUES (gen_random_uuid()::text, ${user.id}, ${prospect.id}, 'Activated via pipeline bypass.', NOW())
          ON CONFLICT ("coachId", "clientId") DO NOTHING
        `;

        linked = true;

        // Welcome email (fire-and-forget)
        try {
          const { sendEmail } = await import("@/lib/email/sendEmail");
          const { coachConnectedEmail } = await import("@/lib/email/templates");
          const content = coachConnectedEmail(
            prospect.firstName || lead.prospectName,
            user.firstName || "Your coach"
          );
          sendEmail({ to: prospect.email, ...content }).catch(() => {});
        } catch { /* never block */ }
      }
    } catch (linkErr) {
      // Account linking failed — that's OK, lead is still ACTIVE
      console.error("[bypass-activate] account link failed (non-fatal):", linkErr);
    }

    // 4. Revalidate (non-blocking)
    try { const { revalidatePath } = await import("next/cache"); revalidatePath("/coach/leads"); } catch {}

    const message = linked
      ? `${lead.prospectName} has been activated and added to your roster.`
      : `${lead.prospectName} has been activated. They'll appear on your roster once they create their account.`;

    return NextResponse.json({ success: true, message });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[bypass-activate]", msg);
    return NextResponse.json({ success: false, message: `Server error: ${msg}` }, { status: 500 });
  }
}
