"use server";

import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/roles";

/**
 * Get all coaching requests for the current authenticated user.
 * Matches by prospectId (if linked) OR prospectEmail (pre-signup requests).
 */
export async function getMyCoachingRequests() {
    const user = await getCurrentDbUser();

    const requests = await db.coachingRequest.findMany({
        where: {
            OR: [
                { prospectId: user.id },
                { prospectEmail: user.email.toLowerCase() },
            ],
        },
        include: {
            coachProfile: {
                include: {
                    user: {
                        select: { firstName: true, lastName: true, profilePhotoPath: true },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return requests;
}
