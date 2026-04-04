"use server";

import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/roles";

/**
 * Get all coaching requests for the current authenticated user.
 * Matches by prospectId (if linked) OR prospectEmail (pre-signup requests).
 */
export async function getMyCoachingRequests() {
    const user = await getCurrentDbUser();

    // NOTE: explicit select avoids selecting Int[]/String[]/Json columns
    // (intakeAnswers, specialties, services, etc.) that can trip up the
    // @prisma/adapter-pg driver on Neon pooled connections.
    const requests = await db.coachingRequest.findMany({
        where: {
            OR: [
                { prospectId: user.id },
                { prospectEmail: user.email.toLowerCase() },
            ],
        },
        select: {
            id: true,
            status: true,
            createdAt: true,
            coachProfile: {
                select: {
                    slug: true,
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
