"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";

const toggleSchema = z.object({
    coachProfileId: z.string().cuid(),
});

export async function toggleSavedCoach(data: z.infer<typeof toggleSchema>) {
    const user = await getCurrentDbUser();
    const validated = toggleSchema.parse(data);

    // Check if already saved
    const existing = await db.savedCoach.findUnique({
        where: {
            userId_coachProfileId: {
                userId: user.id,
                coachProfileId: validated.coachProfileId,
            },
        },
    });

    if (existing) {
        await db.savedCoach.delete({ where: { id: existing.id } });
        revalidatePath("/coaches");
        revalidatePath("/client/saved-coaches");
        return { saved: false };
    }

    await db.savedCoach.create({
        data: {
            userId: user.id,
            coachProfileId: validated.coachProfileId,
        },
    });

    revalidatePath("/coaches");
    revalidatePath("/client/saved-coaches");
    return { saved: true };
}
