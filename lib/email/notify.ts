import { db } from "@/lib/db";
import { sendEmail } from "./send";
import { mealPlanUpdatedEmail } from "./templates/meal-plan-updated";
import { checkinReminderEmail } from "./templates/checkin-reminder";
import type { ReminderStage } from "@/app/generated/prisma/enums";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  // NEXT_PUBLIC_APP_URL should be set in production
  return process.env.NEXT_PUBLIC_APP_URL ?? "";
}

export async function notifyMealPlanUpdate({
  clientId,
  mealPlanId,
}: {
  clientId: string;
  mealPlanId: string;
}) {
  try {
    const client = await db.user.findUnique({
      where: { id: clientId },
      select: {
        email: true,
        firstName: true,
        emailMealPlanUpdates: true,
      },
    });

    if (!client || !client.emailMealPlanUpdates) return;

    const plan = await db.mealPlan.findUnique({
      where: { id: mealPlanId },
      select: { weekOf: true },
    });
    if (!plan) return;

    const weekLabel = plan.weekOf.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const viewUrl = `${getBaseUrl()}/client`;
    const { subject, html, text } = mealPlanUpdatedEmail({
      clientName: client.firstName ?? "there",
      weekLabel,
      viewUrl,
    });

    await sendEmail({ to: client.email, subject, html, text });

    await db.notificationLog.create({
      data: {
        type: "MEAL_PLAN_UPDATE",
        clientId,
        mealPlanId,
      },
    });
  } catch (error) {
    console.error("[notify] Failed to send meal plan update email:", error);
  }
}

export async function notifyCheckinReminder({
  clientId,
  windowStartDate,
  stage,
}: {
  clientId: string;
  windowStartDate: Date;
  stage: ReminderStage;
}) {
  try {
    const client = await db.user.findUnique({
      where: { id: clientId },
      select: {
        email: true,
        firstName: true,
        emailCheckInReminders: true,
      },
    });

    if (!client || !client.emailCheckInReminders) return;

    const weekLabel = windowStartDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const dueLabel = stage === "OVERDUE" ? "overdue" : "due soon";
    const submitUrl = `${getBaseUrl()}/client/check-in`;

    const { subject, html, text } = checkinReminderEmail({
      clientName: client.firstName ?? "there",
      weekLabel,
      dueLabel,
      submitUrl,
    });

    await sendEmail({ to: client.email, subject, html, text });

    await db.notificationLog.create({
      data: {
        type: "CHECKIN_REMINDER",
        clientId,
        windowStartDate,
        stage,
      },
    });
  } catch (error) {
    // Unique constraint violation means already sent — that's fine
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return;
    }
    console.error("[notify] Failed to send check-in reminder email:", error);
  }
}
