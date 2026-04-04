import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getIntakePacketForReview, getSignedUploadUrl } from "@/lib/queries/intake";
import { getOrCreateDefaultTemplate } from "@/app/actions/intake-form";
import { Metadata } from "next";
import { ReviewSession } from "@/components/coach/intake/review-session";
import { IntakeFormView } from "@/components/coach/intake/intake-form-view";

export const metadata: Metadata = { title: "Review Intake | Steadfast" };

export default async function ReviewPage({ params }: { params: Promise<{ requestId: string }> }) {
    const { requestId } = await params;
    const user = await getCurrentDbUser();
    if (!user.isCoach) return <p className="p-8 text-zinc-400">Unauthorized</p>;

    // Try formal intake packet first (exists after intake has been sent & submitted)
    const packet = await getIntakePacketForReview(requestId, user.id);

    if (packet) {
        // Formal packet flow — full ReviewSession (click-to-edit answers + documents)
        const prospectName = packet.coachingRequest.prospectName;
        const answers = packet.formAnswers as {
            sections?: { sectionId: string; sectionTitle: string; answers: { questionId: string; label: string; value: string }[] }[];
        } | null;

        const documents = await Promise.all(packet.documents.map(async d => {
            let signedFileUrl: string | null = null;
            if (d.uploadedSignedFilePath) {
                try { signedFileUrl = await getSignedUploadUrl(d.uploadedSignedFilePath); } catch { /* */ }
            }
            return {
                id: d.id,
                title: d.coachDocument.title,
                type: d.coachDocument.type as "TEXT" | "FILE",
                content: d.coachDocument.content,
                fileName: d.coachDocument.fileName,
                signature: d.signature ? {
                    signatureType: d.signature.signatureType as "TYPED" | "DRAWN",
                    signatureValue: d.signature.signatureValue,
                    signedAt: d.signature.signedAt.toISOString(),
                } : null,
                uploadedSignedFilePath: d.uploadedSignedFilePath,
                uploadedSignedFileName: d.uploadedSignedFileName,
                uploadedSignedAt: d.uploadedSignedAt?.toISOString() ?? null,
                signedFileUrl,
            };
        }));

        return (
            <div className="mx-auto max-w-6xl px-4">
                <ReviewSession
                    packetId={packet.id}
                    requestId={requestId}
                    prospectName={prospectName}
                    answers={answers}
                    coachNotes={packet.coachNotes ?? ""}
                    documents={documents}
                    consultationStage={packet.coachingRequest.consultationStage}
                    prospectEmailAddr={packet.coachingRequest.prospectEmailAddr}
                    submittedAt={packet.submittedAt?.toISOString() ?? null}
                />
            </div>
        );
    }

    // No formal packet — show the editable single-page intake form (shared workspace)
    const leadRows = await db.$queryRawUnsafe<Array<{
        id: string; coachProfileId: string; prospectName: string;
        prospectEmailAddr: string | null;
        intakeAnswers: Record<string, string>;
        consultationStage: string;
    }>>(
        `SELECT "id","coachProfileId","prospectName","prospectEmailAddr","intakeAnswers","consultationStage"
         FROM "CoachingRequest" WHERE "id" = $1 LIMIT 1`, requestId
    );
    const lead = leadRows[0] ?? null;

    const profile = await db.coachProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!lead || !profile || lead.coachProfileId !== profile.id) notFound();

    const intakeAnswers = (lead.intakeAnswers ?? {}) as Record<string, string>;

    const formSubmission = await db.clientFormSubmission.findUnique({
        where: { coachingRequestId: requestId },
    });
    const existingAnswers = formSubmission?.answers as Record<string, unknown> | null;

    const sections = await getOrCreateDefaultTemplate(user.id);

    return (
        <div className="mx-auto max-w-2xl py-4 px-4">
            <IntakeFormView
                requestId={requestId}
                prospectName={lead.prospectName}
                prospectEmail={lead.prospectEmailAddr ?? null}
                prefillGoals={intakeAnswers?.goals ?? null}
                existingAnswers={existingAnswers}
                submissionId={formSubmission?.id ?? null}
                submissionStatus={formSubmission?.status ?? null}
                sections={sections}
            />
        </div>
    );
}
