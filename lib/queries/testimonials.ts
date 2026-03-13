import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/roles";

export async function getCoachTestimonials(coachId: string) {
    return db.testimonial.findMany({
        where: { coachId, status: "published" },
        include: {
            client: {
                select: {
                    firstName: true,
                    lastName: true,
                    profilePhotoPath: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getMyTestimonialForCoach(coachId: string) {
    const user = await getCurrentDbUser();

    return db.testimonial.findUnique({
        where: {
            coachId_clientId: {
                coachId,
                clientId: user.id,
            },
        },
    });
}

export async function getCoachRatingSummary(coachId: string) {
    const result = await db.testimonial.aggregate({
        where: { coachId, status: "published" },
        _avg: { rating: true },
        _count: { rating: true },
    });

    return {
        averageRating: result._avg.rating ?? 0,
        totalReviews: result._count.rating,
    };
}
