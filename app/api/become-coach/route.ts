import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";

const becomeCoachSchema = z.object({
  accessCode: z.string().min(1, "Access code is required"),
});

/**
 * POST /api/become-coach
 *
 * REST endpoint for iOS (mirrors the become-coach server action).
 * Validates the access code against STEADFAST_COACH_ACCESS_CODE and
 * grants coach capabilities to the authenticated user.
 *
 * Body: { accessCode: string }
 * 200 → updated user JSON
 * 401 → not authenticated
 * 403 → invalid code or already a coach
 * 422 → validation error
 */
export async function POST(req: NextRequest) {
  let dbUser: Awaited<ReturnType<typeof getCurrentDbUser>>;
  try {
    dbUser = await getCurrentDbUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Validate the access code
    if (accessCode.trim() !== validCode.trim()) {
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

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[POST /api/become-coach]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
