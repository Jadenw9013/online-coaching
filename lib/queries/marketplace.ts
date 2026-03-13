import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/roles";

export interface CoachFilters {
    goal?: string;
    type?: string;
    accepting?: boolean;
    service?: string;
    clientType?: string;
    minRating?: number;
    sort?: string; // "rating" | "newest" | "" (default = best match)
    q?: string; // keyword search by name/headline/bio
}

export async function getPublishedCoaches(filters?: CoachFilters) {
    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isPublished: true };

    if (filters?.type) {
        where.coachingType = filters.type;
    }
    if (filters?.accepting) {
        where.acceptingClients = true;
    }
    if (filters?.goal) {
        where.clientGoals = { has: filters.goal };
    }
    if (filters?.service) {
        where.services = { has: filters.service };
    }
    if (filters?.clientType) {
        where.clientTypes = { has: filters.clientType };
    }
    if (filters?.q) {
        const term = filters.q.trim();
        where.OR = [
            { headline: { contains: term, mode: "insensitive" } },
            { bio: { contains: term, mode: "insensitive" } },
            { user: { firstName: { contains: term, mode: "insensitive" } } },
            { user: { lastName: { contains: term, mode: "insensitive" } } },
        ];
    }

    const profiles = await db.coachProfile.findMany({
        where,
        include: {
            user: {
                select: { id: true, firstName: true, lastName: true, profilePhotoPath: true },
            },
        },
    });

    // Fetch testimonial aggregates and client counts in parallel
    const coachIds = profiles.map((p) => p.user.id);
    const [ratingData, clientCounts] = await Promise.all([
        db.testimonial.groupBy({
            by: ["coachId"],
            where: { coachId: { in: coachIds }, status: "published" },
            _avg: { rating: true },
            _count: { rating: true },
        }),
        db.coachClient.groupBy({
            by: ["coachId"],
            where: { coachId: { in: coachIds } },
            _count: true,
        }),
    ]);

    const ratingMap = new Map(
        ratingData.map((r) => [r.coachId, { avg: r._avg.rating ?? 0, count: r._count.rating }])
    );
    const clientCountMap = new Map(
        clientCounts.map((c) => [c.coachId, c._count])
    );

    // Compute ranking score and sort
    const ranked = profiles
        .map((profile) => {
            const rating = ratingMap.get(profile.user.id) ?? { avg: 0, count: 0 };
            const clientCount = clientCountMap.get(profile.user.id) ?? 0;

            // ── Profile completeness (0–1) ──
            // Each signal checks a field that improves conversion/trust.
            const completenessChecks = [
                !!profile.headline,                              // Professional headline
                !!profile.bio,                                   // Coaching philosophy
                !!profile.experience,                            // Experience section
                !!profile.pricing,                               // Transparent pricing
                (profile.services?.length ?? 0) > 0,             // Services listed
                (profile.clientGoals?.length ?? 0) > 0,          // Goals coached
                !!profile.user.profilePhotoPath,                 // Profile photo
                !!profile.bannerPhotoPath,                       // Banner image
                !!profile.certifications,                        // Credentials
                !!profile.coachingType,                          // Online/in-person/hybrid
            ];
            const completeness = completenessChecks.filter(Boolean).length / completenessChecks.length;

            // ── Trust score ──
            const normalizedRating = rating.avg / 5;
            const normalizedCount = Math.min(rating.count / 10, 1);
            const availabilityBoost = profile.acceptingClients ? 0.1 : 0;

            const trustScore =
                normalizedRating * 0.50 +
                normalizedCount * 0.20 +
                completeness * 0.20 +
                availabilityBoost;

            return {
                ...profile,
                ratingSummary: { averageRating: rating.avg, totalReviews: rating.count },
                clientCount,
                rankScore: trustScore,
            };
        })
        // Apply minRating filter post-aggregation
        .filter((p) => {
            if (filters?.minRating && filters.minRating > 0) {
                return p.ratingSummary.averageRating >= filters.minRating;
            }
            return true;
        });

    // ── Sort ──
    if (filters?.sort === "rating") {
        ranked.sort((a, b) =>
            b.ratingSummary.averageRating - a.ratingSummary.averageRating ||
            b.ratingSummary.totalReviews - a.ratingSummary.totalReviews
        );
    } else if (filters?.sort === "newest") {
        ranked.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else {
        // Default: Best Match (trust score desc, then recency)
        ranked.sort((a, b) => b.rankScore - a.rankScore || b.createdAt.getTime() - a.createdAt.getTime());
    }

    return ranked;
}

export async function getCoachProfileBySlug(slug: string) {
    const profile = await db.coachProfile.findUnique({
        where: { slug, isPublished: true },
        include: {
            user: {
                select: { id: true, firstName: true, lastName: true, profilePhotoPath: true },
            },
            portfolioItems: {
                orderBy: { sortOrder: "asc" },
            },
        },
    });

    if (!profile) return null;

    const [testimonials, ratingAgg] = await Promise.all([
        db.testimonial.findMany({
            where: { coachId: profile.user.id, status: "published" },
            include: {
                client: {
                    select: { firstName: true, lastName: true },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        db.testimonial.aggregate({
            where: { coachId: profile.user.id, status: "published" },
            _avg: { rating: true },
            _count: { rating: true },
        }),
    ]);

    return {
        ...profile,
        testimonials,
        ratingSummary: {
            averageRating: ratingAgg._avg.rating ?? 0,
            totalReviews: ratingAgg._count.rating,
        },
    };
}

export async function getMyCoachProfile() {
    const user = await getCurrentDbUser();
    if (!user.isCoach) throw new Error("Unauthorized");

    const [profile, testimonialCount] = await Promise.all([
        db.coachProfile.findUnique({
            where: { userId: user.id },
            include: {
                portfolioItems: {
                    orderBy: { sortOrder: "asc" },
                },
            },
        }),
        db.testimonial.count({
            where: { coachId: user.id, status: "published" },
        }),
    ]);

    return { profile, testimonialCount };
}

export async function getMyCoachingRequests(coachProfileId: string) {
    const user = await getCurrentDbUser();
    if (!user.isCoach) throw new Error("Unauthorized");

    // Additional check to verify ownership of the profile
    const profile = await db.coachProfile.findUnique({
        where: { id: coachProfileId }
    });

    if (!profile || profile.userId !== user.id) {
        throw new Error("Unauthorized");
    }

    return db.coachingRequest.findMany({
        where: { coachProfileId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            prospectName: true,
            prospectEmail: true,
            status: true,
            intakeAnswers: true,
            createdAt: true,
            prospectId: true,
            inviteLastSentAt: true,
            inviteSendCount: true,
        },
    });
}
