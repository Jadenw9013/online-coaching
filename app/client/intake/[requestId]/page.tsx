import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ClientIntakeFormView } from "@/components/client/intake/client-intake-form-view";
import { getOrCreateDefaultTemplate } from "@/app/actions/intake-form";

export const metadata: Metadata = { title: "Intake Form | Steadfast" };

export default async function ClientIntakePage({ params }: { params: Promise<{ requestId: string }> }) {
    const { requestId } = await params;
    const user = await getCurrentDbUser();

    // Verify the user owns this coaching request (as prospect)
    const request = await db.coachingRequest.findUnique({
        where: { id: requestId },
        select: {
            id: true,
            prospectId: true,
            prospectEmail: true,
            coachProfileId: true,
            coachProfile: {
                select: {
                    userId: true,
                    user: { select: { firstName: true, lastName: true } },
                },
            },
        },
    });
    if (!request) notFound();

    const isOwner =
        request.prospectId === user.id ||
        request.prospectEmail?.toLowerCase() === user.email?.toLowerCase();
    if (!isOwner) notFound();

    const coachName = `${request.coachProfile.user.firstName ?? ""} ${request.coachProfile.user.lastName ?? ""}`.trim() || "Your Coach";

    // Load existing form submission (shared workspace)
    const formSubmission = await db.clientFormSubmission.findUnique({
        where: { coachingRequestId: requestId },
    });
    const existingAnswers = formSubmission?.answers as Record<string, unknown> | null;

    // Load the coach's intake form template
    const sections = await getOrCreateDefaultTemplate(request.coachProfile.userId);

    return (
        <div className="mx-auto max-w-2xl py-4 px-4">
            <ClientIntakeFormView
                requestId={requestId}
                coachName={coachName}
                existingAnswers={existingAnswers}
                sections={sections}
            />
        </div>
    );
}
