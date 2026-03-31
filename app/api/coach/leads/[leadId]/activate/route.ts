import { NextRequest, NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { activateClient } from "@/app/actions/coaching-requests";

type Params = { params: Promise<{ leadId: string }> };

// ── POST — activate a lead as a client ───────────────────────────────────────

export async function POST(_req: NextRequest, { params }: Params) {
  let user: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    user = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isCoach) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { leadId } = await params;

    const result = await activateClient({ requestId: leadId });

    if (!result.success) {
      return NextResponse.json(
        { error: (result as { message?: string }).message ?? "Failed to activate." },
        { status: 422 }
      );
    }

    const { success: _s, ...rest } = result;
    return NextResponse.json({ success: true, ...rest });
  } catch (err) {
    console.error("[POST /api/coach/leads/[leadId]/activate]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
