import { getCurrentDbUser } from "@/lib/auth/roles";
import { notFound } from "next/navigation";
import { getIntakePacketForReview, getSignedUploadUrl } from "@/lib/queries/intake";
import { Metadata } from "next";
import { ReviewSession } from "@/components/coach/intake/review-session";

export const metadata: Metadata = { title: "Review Intake | Steadfast" };

export default async function ReviewPage({ params }: { params: Promise<{ requestId: string }> }) {
    const { requestId } = await params;
    const user = await getCurrentDbUser();
    if (!user.isCoach) return <p className="p-8 text-zinc-400">Unauthorized</p>;

    const packet = await getIntakePacketForReview(requestId, user.id);
    if (!packet) notFound();

    const prospectName = packet.coachingRequest.prospectName;

    const answers = packet.formAnswers as {
        sections?: { sectionId: string; sectionTitle: string; answers: { questionId: string; label: string; value: string }[] }[];
    } | null;

    // Generate signed URLs for uploaded docs
    const documents = await Promise.all(packet.documents.map(async d => {
        let signedFileUrl: string | null = null;
        if (d.uploadedSignedFilePath) {
            try { signedFileUrl = await getSignedUploadUrl(d.uploadedSignedFilePath); } catch { /* non-blocking */ }
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
