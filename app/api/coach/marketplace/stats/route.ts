import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";

// GET /api/coach/marketplace/stats
// Returns rating summary and clients coached count for the authenticated coach.
// Called by the mobile app coach profile screen.
export async function GET() {
  let user: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    user = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.isCoach) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const profile = await db.coachProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      // No marketplace profile yet — return zero stats
      return NextResponse.json({
        stats: {
          reviewCount: 0,
          averageRating: 0,
          clientsCoached: 0,
        },
      });
    }

    const [requestCounts, testimonialAgg] = await Promise.all([
      db.coachingRequest.groupBy({
        by: ["status"],
        where: { coachProfileId: profile.id },
        _count: true,
      }),
      db.testimonial.aggregate({
        where: { coachId: user.id, status: "published" },
        _count: true,
        _avg: { rating: true },
      }),
    ]);

    // Sum "approved" coaching requests as "clients coached"
    let clientsCoached = 0;
    for (const group of requestCounts) {
      if (group.status.toLowerCase() === "approved") {
        clientsCoached += group._count;
      }
    }

    return NextResponse.json({
      stats: {
        reviewCount: testimonialAgg._count,
        averageRating: testimonialAgg._avg.rating ?? 0,
        clientsCoached,
      },
    });
  } catch (err) {
    console.error("[GET /api/coach/marketplace/stats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
