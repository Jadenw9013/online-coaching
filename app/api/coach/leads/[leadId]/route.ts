import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";

type Params = { params: Promise<{ leadId: string }> };

async function verifyOwnership(user: Awaited<ReturnType<typeof getCurrentDbUser>>, leadId: string) {
  const profile = await db.coachProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return null;

  const lead = await db.coachingRequest.findUnique({
    where: { id: leadId },
    select: { coachProfileId: true },
  });
  if (!lead || lead.coachProfileId !== profile.id) return null;
  return profile;
}

// ── GET — full lead detail ────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  let user: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    user = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isCoach) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { leadId } = await params;

    const profile = await db.coachProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const lead = await db.coachingRequest.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        prospectName: true,
        prospectEmail: true,
        prospectEmailAddr: true,
        prospectPhone: true,
        status: true,
        consultationStage: true,
        source: true,
        sourceDetail: true,
        coachNotes: true,
        intakeAnswers: true,
        createdAt: true,
        updatedAt: true,
        formsSentAt: true,
        formsSignedAt: true,
        prospectId: true,
        coachProfileId: true,
        intakePacket: {
          select: { id: true, sentAt: true, submittedAt: true, formAnswers: true },
        },
        formSubmission: {
          select: { status: true, completedAt: true },
        },
        signature: {
          select: { signedAt: true },
        },
      },
    });

    if (!lead || lead.coachProfileId !== profile.id) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const intakeStatus = lead.intakePacket
      ? lead.intakePacket.submittedAt
        ? "SUBMITTED"
        : "SENT"
      : "NOT_SENT";

    const documentsStatus = lead.formsSignedAt
      ? "SIGNED"
      : lead.formsSentAt
      ? "SENT"
      : "NOT_SENT";

    return NextResponse.json({
      lead: {
        id: lead.id,
        prospectName: lead.prospectName,
        prospectEmail: lead.prospectEmail,
        prospectEmailAddr: lead.prospectEmailAddr,
        prospectPhone: lead.prospectPhone,
        status: lead.status,
        consultationStage: lead.consultationStage,
        source: lead.source,
        sourceDetail: lead.sourceDetail,
        coachNotes: lead.coachNotes,
        intakeAnswers: lead.intakeAnswers,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
        formsSentAt: lead.formsSentAt?.toISOString() ?? null,
        formsSignedAt: lead.formsSignedAt?.toISOString() ?? null,
        prospectId: lead.prospectId,
        intakeStatus,
        documentsStatus,
        intakePacket: lead.intakePacket
          ? {
              id: lead.intakePacket.id,
              sentAt: lead.intakePacket.sentAt.toISOString(),
              submittedAt: lead.intakePacket.submittedAt?.toISOString() ?? null,
            }
          : null,
        formSubmission: lead.formSubmission
          ? { status: lead.formSubmission.status, completedAt: lead.formSubmission.completedAt?.toISOString() ?? null }
          : null,
        signature: lead.signature ? { signedAt: lead.signature.signedAt.toISOString() } : null,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/coach/leads/[leadId]]", msg, err);
    return NextResponse.json({ error: `Internal server error: ${msg}` }, { status: 500 });
  }
}

// ── PATCH — update coach notes, intake answers, and/or stage ──────────────────

// intakeAnswers accepts any JSON shape:
//   Legacy:      { goals, experience, injuries }
//   Structured:  { sections: [{ sectionId, sectionTitle, answers: [{ questionId, questionLabel, value }] }] }
const patchSchema = z.object({
  coachNotes: z.string().max(5000).optional(),
  intakeAnswers: z.record(z.string(), z.unknown()).optional(),
  consultationStage: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  let user: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    user = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isCoach) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { leadId } = await params;
    const profile = await verifyOwnership(user, leadId);
    if (!profile) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 422 });
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.coachNotes !== undefined) data.coachNotes = parsed.data.coachNotes;
    if (parsed.data.intakeAnswers !== undefined) data.intakeAnswers = parsed.data.intakeAnswers;
    if (parsed.data.consultationStage !== undefined) data.consultationStage = parsed.data.consultationStage;

    const updated = await db.coachingRequest.update({
      where: { id: leadId },
      data,
      select: { id: true, coachNotes: true, intakeAnswers: true, consultationStage: true, updatedAt: true },
    });

    return NextResponse.json({
      lead: {
        id: updated.id,
        coachNotes: updated.coachNotes,
        intakeAnswers: updated.intakeAnswers,
        consultationStage: updated.consultationStage,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[PATCH /api/coach/leads/[leadId]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PUT — update lead status and/or consultation stage ────────────────────────

const VALID_CONSULTATION_STAGES = [
  "PENDING",
  "CONSULTATION_SCHEDULED",
  "CONSULTATION_DONE",
  "INTAKE_SENT",
  "INTAKE_SUBMITTED",
  "FORMS_SENT",
  "FORMS_SIGNED",
  "DECLINED",
] as const;

const updateLeadSchema = z.object({
  status: z
    .enum(["PENDING", "CONTACTED", "CALL_SCHEDULED", "ACCEPTED", "DECLINED", "WAITLISTED"])
    .optional(),
  stage: z.enum(VALID_CONSULTATION_STAGES).optional(),
  consultationStage: z.enum(VALID_CONSULTATION_STAGES).optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  let user: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    user = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isCoach) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { leadId } = await params;
    const profile = await verifyOwnership(user, leadId);
    if (!profile) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const body = await req.json();
    const parsed = updateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { status, stage, consultationStage } = parsed.data;
    // Accept stage from either "stage" or "consultationStage" field
    const newStage = stage ?? consultationStage;

    const updated = await db.coachingRequest.update({
      where: { id: leadId },
      data: {
        ...(status !== undefined && { status }),
        ...(newStage !== undefined && { consultationStage: newStage }),
      },
      select: { id: true, status: true, consultationStage: true, updatedAt: true },
    });

    return NextResponse.json({
      lead: {
        id: updated.id,
        status: updated.status,
        consultationStage: updated.consultationStage,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[PUT /api/coach/leads/[leadId]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
