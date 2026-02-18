"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { leaveCoach } from "@/app/actions/coach-client";
import { useRouter } from "next/navigation";

export function LeaveCoachButton({
  coachClientId,
  coachName,
}: {
  coachClientId: string;
  coachName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isConfirmed =
    confirmText.toUpperCase() === "LEAVE" && acknowledged;

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      cancelRef.current?.focus();
    } else {
      dialogRef.current?.close();
      triggerRef.current?.focus();
      setStep(1);
      setConfirmText("");
      setAcknowledged(false);
      setError(null);
    }
  }, [open]);

  const handleClose = useCallback(() => setOpen(false), []);

  async function handleLeave() {
    if (!isConfirmed) return;
    setLeaving(true);
    setError(null);
    try {
      await leaveCoach({ coachClientId });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave coach");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
      >
        Leave Coach
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-0 shadow-xl backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-900"
        aria-labelledby="leave-dialog-title"
        aria-describedby="leave-dialog-desc"
      >
        <div className="p-6">
          {step === 1 && (
            <>
              <h2
                id="leave-dialog-title"
                className="text-lg font-semibold text-red-600 dark:text-red-400"
              >
                Leave Coach {coachName}?
              </h2>
              <div id="leave-dialog-desc" className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <p>If you leave, the following will happen:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>
                    You will no longer be able to message or receive updates
                    from this coach.
                  </li>
                  <li>
                    You can only rejoin if your coach shares their code with
                    you again.
                  </li>
                  <li>
                    Your existing check-ins, meal plans, and messages will
                    remain visible to you.
                  </li>
                </ul>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  ref={cancelRef}
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                  I understand, continue
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                Confirm leaving Coach {coachName}
              </h2>

              {error && (
                <div
                  role="alert"
                  className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
                >
                  {error}
                </div>
              )}

              {/* Type LEAVE */}
              <div className="mt-4">
                <label
                  htmlFor="leave-confirm-input"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Type <span className="font-mono font-bold">LEAVE</span> to
                  confirm
                </label>
                <input
                  id="leave-confirm-input"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono uppercase tracking-wider focus-visible:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-zinc-600 dark:bg-zinc-800"
                  autoComplete="off"
                />
              </div>

              {/* Acknowledgment checkbox */}
              <label className="mt-4 flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500 dark:border-zinc-600 dark:bg-zinc-800"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  I understand I will lose access to future coaching updates.
                </span>
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={!isConfirmed || leaving}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {leaving ? "Leaving..." : "Leave Coach"}
                </button>
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
