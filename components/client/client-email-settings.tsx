"use client";

import { useState, useTransition, useMemo } from "react";
import { updateNotificationPreferences } from "@/app/actions/notification-preferences";
import { Toggle } from "@/components/ui/toggle";

export function ClientEmailSettings({
  initialEmailCheckInReminders,
  initialEmailMealPlanUpdates,
  initialEmailCoachMessages,
}: {
  initialEmailCheckInReminders: boolean;
  initialEmailMealPlanUpdates: boolean;
  initialEmailCoachMessages: boolean;
}) {
  const [emailCheckInReminders, setEmailCheckInReminders] = useState(initialEmailCheckInReminders);
  const [emailMealPlanUpdates, setEmailMealPlanUpdates] = useState(initialEmailMealPlanUpdates);
  const [emailCoachMessages, setEmailCoachMessages] = useState(initialEmailCoachMessages);

  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  const hasUnsavedChanges = useMemo(() => {
    return (
      emailCheckInReminders !== initialEmailCheckInReminders ||
      emailMealPlanUpdates !== initialEmailMealPlanUpdates ||
      emailCoachMessages !== initialEmailCoachMessages
    );
  }, [emailCheckInReminders, emailMealPlanUpdates, emailCoachMessages, initialEmailCheckInReminders, initialEmailMealPlanUpdates, initialEmailCoachMessages]);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await updateNotificationPreferences({
          emailCheckInReminders,
          emailMealPlanUpdates,
          emailCoachMessages,
        });
        showToast("Settings saved");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-zinc-500">
        Manage which emails you receive. Transactional emails (welcome, coach connected, check-in reviewed) are always sent.
      </p>

      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">{error}</p>}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Check-in Reminders
            </p>
            <p className="text-xs text-zinc-500">
              Email me when a check-in is due.
            </p>
          </div>
          <Toggle
            checked={emailCheckInReminders}
            onChange={() => setEmailCheckInReminders(!emailCheckInReminders)}
            label="Email Check-in Reminders"
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Meal Plan Updates
            </p>
            <p className="text-xs text-zinc-500">
              Email me when my coach updates my meal plan.
            </p>
          </div>
          <Toggle
            checked={emailMealPlanUpdates}
            onChange={() => setEmailMealPlanUpdates(!emailMealPlanUpdates)}
            label="Email Meal Plan Updates"
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Coach Messages
            </p>
            <p className="text-xs text-zinc-500">
              Email me when my coach sends a message.
            </p>
          </div>
          <Toggle
            checked={emailCoachMessages}
            onChange={() => setEmailCoachMessages(!emailCoachMessages)}
            label="Email Coach Messages"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        {hasUnsavedChanges && (
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400" role="status">
            Unsaved changes
          </p>
        )}
        <div className="ml-auto flex items-center gap-3">
          {toast && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400" role="alert">
              {toast}
            </p>
          )}
          <button
            type="button"
            disabled={isPending || !hasUnsavedChanges}
            onClick={handleSave}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-gradient-to-r dark:from-blue-600 dark:to-blue-500 dark:text-white dark:shadow-lg dark:shadow-blue-500/20 dark:hover:brightness-110 whitespace-nowrap"
          >
            {isPending ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
