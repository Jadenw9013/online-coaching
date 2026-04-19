import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";

const becomeCoachSchema = z.object({
  accessCode: z.string().min(1, "Access code is required"),
});

// ── Per-user rate limiting (in-memory, resets on deploy) ──────────────
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 3;
const attemptMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = attemptMap.get(userId);
  if (!entry || now > entry.resetAt) {
    attemptMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

/** Timing-safe string comparison to prevent side-channel attacks. */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to maintain constant time, then return false
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * POST /api/become-coach
 *
 * REST endpoint for iOS (mirrors the become-coach server action).
 * Validates the access code against STEADFAST_COACH_ACCESS_CODE and
 * grants coach capabilities to the authenticated user.
 *
 * Security: timing-safe comparison, per-user rate limiting (3/15m), audit log.
 *
 * Body: { accessCode: string }
 * 200 → updated user JSON
 * 401 → not authenticated
 * 403 → invalid code or already a coach
 * 422 → validation error
 * 429 → rate limited
 */
export async function POST(req: NextRequest) {
  let dbUser: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    dbUser = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  if (isRateLimited(dbUser.id)) {
    console.warn(`[become-coach] RATE LIMITED userId=${dbUser.id}`);
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = becomeCoachSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter an access code." },
        { status: 422 }
      );
    }

    const { accessCode } = parsed.data;

    // Check if coach registration is available
    const validCode = process.env.STEADFAST_COACH_ACCESS_CODE;
    if (!validCode) {
      return NextResponse.json(
        { error: "Coach registration is not available at this time." },
        { status: 403 }
      );
    }

    // Timing-safe code validation
    if (!safeCompare(accessCode.trim(), validCode.trim())) {
      console.warn(`[become-coach] FAILED attempt userId=${dbUser.id} at=${new Date().toISOString()}`);
      return NextResponse.json(
        { error: "Invalid access code. Please check with your administrator." },
        { status: 403 }
      );
    }

    // Already a coach
    if (dbUser.isCoach) {
      return NextResponse.json(
        { error: "You already have coach access." },
        { status: 403 }
      );
    }

    // Grant coach capabilities
    const updated = await db.user.update({
      where: { id: dbUser.id },
      data: {
        isCoach: true,
        isClient: true,
        activeRole: "COACH",
      },
    });

    console.warn(`[become-coach] SUCCESS userId=${dbUser.id} at=${new Date().toISOString()}`);

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[POST /api/become-coach]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
