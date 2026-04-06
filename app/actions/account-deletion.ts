"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { sendEmail } from "@/lib/email/sendEmail";
import { revalidatePath } from "next/cache";

// ── requestAccountDeletion ───────────────────────────────────────────────────

const requestSchema = z.object({
  reason: z.string().max(1000).optional(),
  confirmationText: z.string(),
});

export async function requestAccountDeletion(input: unknown): Promise<{
  success: boolean;
  scheduledPurgeAt?: string; // ISO string for RSC safety
  message?: string;
}> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");
  if (parsed.data.confirmationText !== "DELETE MY ACCOUNT") {
    throw new Error('You must type "DELETE MY ACCOUNT" to confirm.');
  }

  const user = await getCurrentDbUser();

  // Idempotent: return existing pending request if one exists
  const existing = await db.accountDeletionRequest.findUnique({
    where: { userId: user.id },
  });
  if (existing && existing.status === "PENDING") {
    return {
      success: true,
      scheduledPurgeAt: existing.scheduledPurgeAt.toISOString(),
    };
  }

  const scheduledPurgeAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Derive role string
  const roleAtRequest =
    user.isCoach && user.isClient
      ? "BOTH"
      : user.isCoach
        ? "COACH"
        : "CLIENT";

  // ── Coach path: notify clients ──────────────────────────────────────────────
  if (user.isCoach) {
    try {
      const clients = await db.coachClient.findMany({
        where: { coachId: user.id },
        select: { client: { select: { email: true, firstName: true } } },
      });
      const purgeDate = scheduledPurgeAt.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      for (const { client } of clients) {
        sendEmail({
          to: client.email,
          subject: "Important: Your coach is leaving Steadfast",
          text: `Hi ${client.firstName || "there"},\n\nYour coach ${user.firstName || ""} has requested to delete their Steadfast account. Their account will be fully removed on ${purgeDate}.\n\nUntil then, your existing meal plans, check-ins, and data remain available. After that date, you'll still have access to your own data, but will no longer be linked to this coach.\n\nIf you have questions, please reach out to your coach directly before the deletion date.\n\n— The Steadfast Team`,
        }).catch(() => {});
      }
    } catch {
      /* notification failure must not block deletion request */
    }
  }

  // ── Client path: notify coach ───────────────────────────────────────────────
  if (user.isClient) {
    try {
      const assignment = await db.coachClient.findFirst({
        where: { clientId: user.id },
        select: { coach: { select: { email: true, firstName: true } } },
      });
      if (assignment) {
        sendEmail({
          to: assignment.coach.email,
          subject: `Your client ${user.firstName || ""} has requested account deletion`,
          text: `Hi ${assignment.coach.firstName || "Coach"},\n\nYour client ${user.firstName || ""} (${user.email}) has requested to delete their Steadfast account. Their account will be fully removed in 30 days.\n\nTheir check-in history will remain in your records until then.\n\n— The Steadfast Team`,
        }).catch(() => {});
      }
    } catch {
      /* notification failure must not block */
    }
  }

  // ── Create deletion request + deactivate user ──────────────────────────────
  // TODO: If Stripe is integrated, cancel subscription here and set
  //       stripeSubscriptionCancelledAt on the request.

  await db.accountDeletionRequest.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      scheduledPurgeAt,
      deletionReason: parsed.data.reason || null,
      roleAtRequest,
    },
    update: {
      status: "PENDING",
      scheduledPurgeAt,
      deletionReason: parsed.data.reason || null,
      roleAtRequest,
      cancelledAt: null,
    },
  });

  await db.user.update({
    where: { id: user.id },
    data: { isDeactivated: true },
  });

  revalidatePath("/");
  return { success: true, scheduledPurgeAt: scheduledPurgeAt.toISOString() };
}

// ── cancelAccountDeletion ────────────────────────────────────────────────────

export async function cancelAccountDeletion(): Promise<{
  success: boolean;
  message?: string;
}> {
  const user = await getCurrentDbUser();

  const request = await db.accountDeletionRequest.findUnique({
    where: { userId: user.id },
  });
  if (!request || request.status !== "PENDING") {
    throw new Error("No pending deletion request found.");
  }
  if (request.scheduledPurgeAt < new Date()) {
    throw new Error(
      "Grace period has expired — account cannot be restored."
    );
  }

  await db.accountDeletionRequest.update({
    where: { id: request.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  await db.user.update({
    where: { id: user.id },
    data: { isDeactivated: false },
  });

  revalidatePath("/");
  return { success: true };
}
