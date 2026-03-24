import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { getSignedDownloadUrls } from "@/lib/supabase/storage";

export async function GET() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  let user: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    user = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.isClient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const checkIns = await db.checkIn.findMany({
      where: { clientId: user.id, deletedAt: null },
      orderBy: { submittedAt: "desc" },
      take: 50,
      select: {
        id: true,
        weekOf: true,
        status: true,
        weight: true,
        dietCompliance: true,
        energyLevel: true,
        submittedAt: true,
        photos: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, storagePath: true },
        },
      },
    });

    // Bulk-sign all photo paths across all check-ins in one call
    const allPaths = checkIns.flatMap((c) => c.photos.map((p) => p.storagePath));
    const signedList = allPaths.length
      ? await getSignedDownloadUrls(allPaths).catch(() => [])
      : [];
    const urlMap = new Map(signedList.map((u) => [u.path, u.signedUrl]));

    return NextResponse.json({
      checkIns: checkIns.map((c) => ({
        id: c.id,
        weekOf: c.weekOf.toISOString(),
        status: c.status,
        weight: c.weight,
        dietCompliance: c.dietCompliance,
        energyLevel: c.energyLevel,
        submittedAt: c.submittedAt.toISOString(),
        photos: c.photos.map((p) => ({
          id: p.id,
          path: p.storagePath,
          url: urlMap.get(p.storagePath) ?? null,
        })),
      })),
    });
  } catch (err) {
    console.error("[GET /api/client/checkins]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
