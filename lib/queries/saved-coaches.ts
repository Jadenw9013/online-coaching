import { db } from "@/lib/db";

/**
 * Get all saved coaches for a user, with coach profile + user data for display.
 */
export async function getSavedCoaches(userId: string) {
    return db.savedCoach.findMany({
        where: { userId },
        include: {
            coachProfile: {
                select: {
                    id: true,
                    slug: true,
                    headline: true,
                    pricing: true,
                    isPublished: true,
                    acceptingClients: true,
                    coachingType: true,
                    location: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            profilePhotoPath: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Get the set of coachProfileIds that a user has saved.
 * Used for rendering save state on cards/profiles.
 */
export async function getSavedCoachIds(userId: string): Promise<Set<string>> {
    const saved = await db.savedCoach.findMany({
        where: { userId },
        select: { coachProfileId: true },
    });
    return new Set(saved.map((s) => s.coachProfileId));
}
