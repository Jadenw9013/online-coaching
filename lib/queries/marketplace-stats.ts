import { db } from "@/lib/db";

/**
 * Get marketplace stats for a coach's profile.
 */
export async function getMarketplaceStats(coachProfileId: string) {
    const [requests, testimonials] = await Promise.all([
        db.coachingRequest.groupBy({
            by: ["status"],
            where: { coachProfileId },
            _count: true,
        }),
        db.testimonial.aggregate({
            where: {
                coach: { coachProfile: { id: coachProfileId } },
                status: "published",
            },
            _count: true,
            _avg: { rating: true },
        }),
    ]);

    const requestCounts = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        waitlisted: 0,
    };

    for (const group of requests) {
        requestCounts.total += group._count;
        const key = group.status.toLowerCase() as keyof typeof requestCounts;
        if (key in requestCounts) {
            requestCounts[key] = group._count;
        }
    }

    return {
        requests: requestCounts,
        reviews: {
            count: testimonials._count,
            averageRating: testimonials._avg.rating ?? 0,
        },
    };
}
