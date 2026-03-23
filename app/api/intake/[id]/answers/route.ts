import { NextRequest, NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
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
    const body = await req.json().catch(() => null);
    if (!body || typeof body.answers !== "object" || body.answers === null) {
      return NextResponse.json({ error: "answers object required" }, { status: 400 });
    }

    // Verify ownership: packet must belong to this client
    const packet = await db.intakePacket.findUnique({
      where: { id },
      select: {
        id: true,
        submittedAt: true,
        formAnswers: true,
        coachingRequest: {
          select: { prospectId: true },
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
      return NextResponse.json({ error: "Intake already submitted" }, { status: 409 });
    }

    // Merge answers with any existing (partial save)
    const merged = {
      ...(typeof packet.formAnswers === "object" && packet.formAnswers !== null
        ? packet.formAnswers as Record<string, unknown>
        : {}),
      ...body.answers,
    };

    const updated = await db.intakePacket.update({
      where: { id },
      data: { formAnswers: merged },
      select: {
        id: true,
        formAnswers: true,
        submittedAt: true,
      },
    });

    return NextResponse.json({
      intake: {
        id: updated.id,
        status: "IN_PROGRESS",
        formAnswers: updated.formAnswers,
      },
    });
  } catch (err) {
    console.error("[PUT /api/intake/[id]/answers]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
