import { NextRequest, NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  try {
    // Verify ownership
    const packet = await db.intakePacket.findUnique({
      where: { id },
      select: {
        id: true,
        submittedAt: true,
        coachingRequest: {
          select: {
            prospectId: true,
            coachProfile: {
              select: {
                userId: true,
                user: {
                  select: { email: true, firstName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!packet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (packet.coachingRequest.prospectId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (packet.submittedAt) {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }

    // Mark as submitted (mirrors web action: set submittedAt timestamp)
    await db.intakePacket.update({
      where: { id },
      data: { submittedAt: new Date() },
    });

    // Fire-and-forget coach notification email
    try {
      const coachEmail = packet.coachingRequest.coachProfile.user.email;
      const clientName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
      const { sendEmail } = await import("@/lib/email/sendEmail");
      sendEmail({
        to: coachEmail,
        subject: `${clientName} completed their intake`,
        html: `<p><strong>${clientName}</strong> has submitted their intake questionnaire. <a href="${process.env.NEXT_PUBLIC_APP_URL}/coach/clients/${user.id}">Review it here</a>.</p>`,
        text: `${clientName} has submitted their intake questionnaire.`,
      }).catch(console.error);
    } catch {
      // Notification failure must not break the response
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/intake/[id]/submit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
