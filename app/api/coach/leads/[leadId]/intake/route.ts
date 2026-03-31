import { NextRequest, NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { sendIntakePacket } from "@/app/actions/intake";

type Params = { params: Promise<{ leadId: string }> };

// ── POST — send intake packet to prospect ─────────────────────────────────────

export async function POST(req: NextRequest, { params }: Params) {
  let user: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    user = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isCoach) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { leadId } = await params;
    const body = await req.json().catch(() => ({}));
    const documentIds: string[] = Array.isArray(body.documentIds) ? body.documentIds : [];

    const result = await sendIntakePacket({ requestId: leadId, documentIds });

    if (!result.success) {
      return NextResponse.json(
        { error: (result as { message?: string }).message ?? "Failed to send intake." },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, message: "Intake sent." });
  } catch (err) {
    console.error("[POST /api/coach/leads/[leadId]/intake]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
