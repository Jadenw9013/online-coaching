import { db } from "@/lib/db";

/**
 * Check if a client is eligible to leave a testimonial for their coach.
 * Eligible = has CoachClient relationship + no existing testimonial.
 */
export async function getTestimonialEligibility(clientId: string) {
    // Get the client's active coach relationship
    const coachClient = await db.coachClient.findFirst({
        where: { clientId },
        include: {
            coach: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    coachProfile: { select: { slug: true } },
                },
            },
        },
    });

    if (!coachClient) {
        return { eligible: false, coachId: null, coachName: null, existingTestimonial: null };
    }

    // Check for existing testimonial
    const existingTestimonial = await db.testimonial.findUnique({
        where: {
            coachId_clientId: {
                coachId: coachClient.coachId,
                clientId,
            },
        },
    });

    const coachName = `${coachClient.coach.firstName ?? ""} ${coachClient.coach.lastName ?? ""}`.trim() || "your coach";

    return {
        eligible: !existingTestimonial,
        coachId: coachClient.coachId,
        coachName,
        slug: coachClient.coach.coachProfile?.slug ?? null,
        existingTestimonial,
    };
}
