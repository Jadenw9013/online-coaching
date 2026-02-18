"use client";

import { useState, useTransition } from "react";
import { updateNotificationPreferences } from "@/app/actions/notification-preferences";

export function NotificationSettings({
  initialMealPlanUpdates,
  initialCheckInReminders,
}: {
  initialMealPlanUpdates: boolean;
  initialCheckInReminders: boolean;
}) {
  const [mealPlan, setMealPlan] = useState(initialMealPlanUpdates);
  const [checkIn, setCheckIn] = useState(initialCheckInReminders);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  function toggle(field: "emailMealPlanUpdates" | "emailCheckInReminders", value: boolean) {
    if (field === "emailMealPlanUpdates") setMealPlan(value);
    else setCheckIn(value);

    startTransition(async () => {
      await updateNotificationPreferences({ [field]: value });
      showToast("Settings saved");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Meal plan updates
          </p>
          <p className="text-xs text-zinc-500">
            Email me when my coach updates my meal plan.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={mealPlan}
          disabled={isPending}
          onClick={() => toggle("emailMealPlanUpdates", !mealPlan)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
            mealPlan ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform dark:bg-zinc-900 ${
              mealPlan ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Check-in reminders
          </p>
          <p className="text-xs text-zinc-500">
            Email me a reminder to submit my weekly check-in.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checkIn}
          disabled={isPending}
          onClick={() => toggle("emailCheckInReminders", !checkIn)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
            checkIn ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform dark:bg-zinc-900 ${
              checkIn ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {toast && (
        <p className="text-xs font-medium text-green-600 dark:text-green-400">
          {toast}
        </p>
      )}
    </div>
  );
}
