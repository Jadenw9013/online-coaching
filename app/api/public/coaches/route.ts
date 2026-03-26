import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createServiceClient } from "@/lib/supabase/server";

const PHOTO_BUCKET = "profile-photos";
const TTL = 60 * 60; // 1 hour

// ── GET — public coach directory (no auth) ────────────────────────────────────

export async function GET() {
  try {
    const profiles = await db.coachProfile.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        slug: true,
        bio: true,
        specialties: true,
        pricing: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoPath: true,
          },
        },
      },
    });

    // Fetch testimonial aggregates in bulk
    const coachUserIds = profiles.map((p) => p.user.id);

    const testimonialAggs = await db.testimonial.groupBy({
      by: ["coachId"],
      where: {
        coachId: { in: coachUserIds },
        status: "published",
        reviewText: { not: null },
      },
      _count: true,
      _avg: { rating: true },
    });

    const statsMap = new Map(
      testimonialAggs.map((t) => [
        t.coachId,
        { testimonialCount: t._count, averageRating: t._avg.rating ?? null },
      ])
    );

    // Sign profile photo URLs
    const supabase = createServiceClient();

    const coaches = await Promise.all(
      profiles.map(async (p) => {
        const stats = statsMap.get(p.user.id) ?? {
          testimonialCount: 0,
          averageRating: null,
        };

        let signedPhotoUrl: string | null = null;
        if (p.user.profilePhotoPath) {
          const { data } = await supabase.storage
            .from(PHOTO_BUCKET)
            .createSignedUrl(p.user.profilePhotoPath, TTL);
          signedPhotoUrl = data?.signedUrl ?? null;
        }

        return {
          id: p.id,
          slug: p.slug,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          profilePhotoPath: signedPhotoUrl,
          bio: p.bio,
          specialties: p.specialties,
          pricing: p.pricing,
          testimonialCount: stats.testimonialCount,
          averageRating: stats.averageRating,
        };
      })
    );

    // Sort by testimonialCount DESC
    coaches.sort((a, b) => b.testimonialCount - a.testimonialCount);

    return NextResponse.json({ coaches });
  } catch (err) {
    console.error("[GET /api/public/coaches]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

