"use client";

import { useState, useTransition, useMemo } from "react";
import { updateCoachEmailPreferences } from "@/app/actions/notification-preferences";
import { Toggle } from "@/components/ui/toggle";

export function CoachEmailSettings({
  initialEmailClientCheckIns,
  initialEmailClientMessages,
  initialEmailCoachingRequests,
}: {
  initialEmailClientCheckIns: boolean;
  initialEmailClientMessages: boolean;
  initialEmailCoachingRequests: boolean;
}) {
  const [emailClientCheckIns, setEmailClientCheckIns] = useState(initialEmailClientCheckIns);
  const [emailClientMessages, setEmailClientMessages] = useState(initialEmailClientMessages);
  const [emailCoachingRequests, setEmailCoachingRequests] = useState(initialEmailCoachingRequests);

  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  const hasUnsavedChanges = useMemo(() => {
    return (
      emailClientCheckIns !== initialEmailClientCheckIns ||
      emailClientMessages !== initialEmailClientMessages ||
      emailCoachingRequests !== initialEmailCoachingRequests
    );
  }, [emailClientCheckIns, emailClientMessages, emailCoachingRequests, initialEmailClientCheckIns, initialEmailClientMessages, initialEmailCoachingRequests]);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await updateCoachEmailPreferences({
          emailClientCheckIns,
          emailClientMessages,
          emailCoachingRequests,
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
        Manage which emails you receive. Transactional emails are always sent.
      </p>

      {error && <p className="text-xs font-medium text-red-600" role="alert">{error}</p>}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900">
              Client Check-ins
            </p>
            <p className="text-xs text-zinc-500">
              Email me when a client submits a check-in.
            </p>
          </div>
          <Toggle
            checked={emailClientCheckIns}
            onChange={() => setEmailClientCheckIns(!emailClientCheckIns)}
            label="Email Client Check-ins"
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900">
              Client Messages
            </p>
            <p className="text-xs text-zinc-500">
              Email me when a client sends a message.
            </p>
          </div>
          <Toggle
            checked={emailClientMessages}
            onChange={() => setEmailClientMessages(!emailClientMessages)}
            label="Email Client Messages"
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900">
              Coaching Requests
            </p>
            <p className="text-xs text-zinc-500">
              Email me when a prospect submits a coaching request.
            </p>
          </div>
          <Toggle
            checked={emailCoachingRequests}
            onChange={() => setEmailCoachingRequests(!emailCoachingRequests)}
            label="Email Coaching Requests"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-200">
        {hasUnsavedChanges && (
          <p className="text-xs font-medium text-amber-600" role="status">
            Unsaved changes
          </p>
        )}
        <div className="ml-auto flex items-center gap-3">
          {toast && (
            <p className="text-xs font-medium text-emerald-600" role="alert">
              {toast}
            </p>
          )}
          <button
            type="button"
            disabled={isPending || !hasUnsavedChanges}
            onClick={handleSave}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-50 whitespace-nowrap"
          >
            {isPending ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
