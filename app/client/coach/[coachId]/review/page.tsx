import { getCurrentDbUser } from "@/lib/auth/roles";
import { getMyTestimonialForCoach } from "@/lib/queries/testimonials";
import { db } from "@/lib/db";
import { TestimonialForm } from "@/components/client/testimonial-form";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Write a Review | Steadfast",
};

interface PageProps {
    params: Promise<{ coachId: string }>;
}

export default async function WriteReviewPage({ params }: PageProps) {
    const { coachId } = await params;
    const user = await getCurrentDbUser();

    // Verify the client has a coaching relationship with this coach
    const relationship = await db.coachClient.findFirst({
        where: {
            clientId: user.id,
            coachId,
        },
    });

    if (!relationship) {
        redirect("/client");
    }

    // Get coach info for display
    const coach = await db.user.findUnique({
        where: { id: coachId },
        select: { firstName: true, lastName: true },
    });

    if (!coach) {
        notFound();
    }

    const coachName = `${coach.firstName ?? ""} ${coach.lastName ?? ""}`.trim() || "Your Coach";

    // Check for existing testimonial (edit mode)
    const existing = await getMyTestimonialForCoach(coachId);

    return (
        <div className="mx-auto max-w-xl px-5 py-12">
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                    {existing ? "Edit Your Review" : "Write a Review"}
                </h1>
                <p className="mt-2 text-sm text-zinc-500">
                    {existing
                        ? `Update your review for ${coachName}.`
                        : `Share your experience working with ${coachName}. Your review will be visible on their public profile.`}
                </p>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <TestimonialForm
                    coachId={coachId}
                    coachName={coachName}
                    existingTestimonial={existing}
                />
            </div>
        </div>
    );
}
