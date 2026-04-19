"use server";

import { z } from "zod";
import { timingSafeEqual } from "crypto";
import { getCurrentDbUser, ensureCoachCode } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

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
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function becomeCoach(input: unknown) {
  const user = await getCurrentDbUser();

  // Rate limiting
  if (isRateLimited(user.id)) {
    console.warn(`[become-coach] RATE LIMITED userId=${user.id}`);
    return { error: "Too many attempts. Please try again later." };
  }

  const parsed = becomeCoachSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please enter an access code." };
  }

  const { accessCode } = parsed.data;

  const validCode = process.env.STEADFAST_COACH_ACCESS_CODE;
  if (!validCode) {
    return { error: "Coach registration is not available at this time." };
  }

  // Timing-safe code validation
  if (!safeCompare(accessCode.trim(), validCode.trim())) {
    console.warn(`[become-coach] FAILED attempt userId=${user.id} at=${new Date().toISOString()}`);
    return { error: "Invalid access code. Please check with your administrator." };
  }

  if (user.isCoach) {
    return { error: "You already have coach access." };
  }

  // Grant coach capabilities
  await db.user.update({
    where: { id: user.id },
    data: {
      isCoach: true,
      isClient: true,
      activeRole: "COACH",
    },
  });

  // Ensure they have a coach code
  await ensureCoachCode(user.id);

  console.warn(`[become-coach] SUCCESS userId=${user.id} at=${new Date().toISOString()}`);

  redirect("/coach/dashboard");
}
