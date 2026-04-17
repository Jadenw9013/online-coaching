import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook verification failed", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, public_metadata } =
      evt.data;

    const email = email_addresses[0]?.email_address;
    if (!email) {
      return new Response("No email found", { status: 400 });
    }

    const isCoach =
      (public_metadata?.role as string)?.toUpperCase() === "COACH";
    const activeRole = isCoach ? "COACH" : "CLIENT" as const;

    try {
      await db.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          firstName: first_name,
          lastName: last_name,
          activeRole,
          isCoach,
          isClient: !isCoach,
        },
        create: {
          clerkId: id,
          email,
          firstName: first_name,
          lastName: last_name,
          activeRole,
          isCoach,
          isClient: !isCoach,
        },
      });
    } catch (err: unknown) {
      // Handle re-registration: email exists under a different clerkId
      // (e.g. user deleted their account, Clerk user was purged, now re-signing up)
      const isUniqueViolation =
        err instanceof Error && err.message.includes("Unique constraint");
      if (!isUniqueViolation) throw err;

      const existingByEmail = await db.user.findUnique({ where: { email } });
      if (!existingByEmail) throw err;

      // Cancel any pending deletion request
      const deletionRequest = await db.accountDeletionRequest.findUnique({
        where: { userId: existingByEmail.id },
      });
      if (deletionRequest && deletionRequest.status === "PENDING") {
        await db.accountDeletionRequest.update({
          where: { id: deletionRequest.id },
          data: { status: "CANCELLED", cancelledAt: new Date() },
        });
      }

      // Re-associate the existing DB user with the new Clerk identity
      await db.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkId: id,
          email,
          firstName: first_name,
          lastName: last_name,
          activeRole,
          isCoach,
          isClient: !isCoach,
          isDeactivated: false,
        },
      });
    }
  }

  return new Response("OK", { status: 200 });
}
