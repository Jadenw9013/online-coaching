import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purgeUserAccount } from "@/lib/account-deletion/purge";

/**
 * Cron endpoint: purge accounts whose 30-day grace period has expired.
 * Called by the checkin-reminders cron or manually with CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let processed = 0;
  let errors = 0;

  try {
    const expiredRequests = await db.accountDeletionRequest.findMany({
      where: {
        status: "PENDING",
        scheduledPurgeAt: { lte: new Date() },
      },
      select: { id: true, userId: true },
    });

    for (const request of expiredRequests) {
      try {
        await db.accountDeletionRequest.update({
          where: { id: request.id },
          data: { status: "PURGING", purgeStartedAt: new Date() },
        });

        await purgeUserAccount(request.userId);
        processed++;
      } catch (err) {
        console.error(`[purge-cron] Failed to purge user ${request.userId}:`, err);
        // Revert to PENDING so it retries next cycle
        await db.accountDeletionRequest.update({
          where: { id: request.id },
          data: {
            status: "PENDING",
            retryCount: { increment: 1 },
          },
        }).catch(() => {});
        errors++;
      }
    }
  } catch (err) {
    console.error("[purge-cron] Fatal error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ processed, errors });
}
