"use client";

import { useState } from "react";
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

  const isConfirmed = confirmText.toUpperCase() === "LEAVE" && acknowledged;

  function handleClose() {
    setOpen(false);
    setStep(1);
    setConfirmText("");
    setAcknowledged(false);
    setError(null);
  }

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
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        style={{ minHeight: 40 }}
      >
        Leave Coach
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-dialog-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog card */}
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-zinc-900 p-6 shadow-2xl">
            {step === 1 && (
              <>
                <h2
                  id="leave-dialog-title"
                  className="text-base font-semibold text-red-400"
                >
                  Leave Coach {coachName}?
                </h2>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
                  <p>If you leave, the following will happen:</p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>You will no longer be able to message or receive updates from this coach.</li>
                    <li>You can only rejoin if your coach invites you again.</li>
                    <li>Your existing check-ins, meal plans, and messages will remain visible to you.</li>
                  </ul>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-white/[0.15] hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                    style={{ minHeight: 40 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    style={{ minHeight: 40 }}
                  >
                    I understand, continue
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-base font-semibold text-red-400">
                  Confirm leaving Coach {coachName}
                </h2>

                {error && (
                  <div
                    role="alert"
                    className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400"
                  >
                    {error}
                  </div>
                )}

                <div className="mt-4">
                  <label
                    htmlFor="leave-confirm-input"
                    className="block text-xs font-semibold uppercase tracking-widest text-zinc-500"
                  >
                    Type <span className="font-mono text-zinc-300">LEAVE</span> to confirm
                  </label>
                  <input
                    id="leave-confirm-input"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="LEAVE"
                    className="mt-2 w-full rounded-xl border border-zinc-700/60 bg-zinc-800/30 px-4 py-2.5 font-mono text-sm uppercase tracking-wider text-zinc-100 placeholder-zinc-600 focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    style={{ fontSize: "max(1rem, 16px)" }}
                    autoComplete="off"
                  />
                </div>

                <label className="mt-4 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm leading-relaxed text-zinc-400">
                    I understand I will lose access to future coaching updates.
                  </span>
                </label>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-white/[0.15] hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                    style={{ minHeight: 40 }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={!isConfirmed || leaving}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ minHeight: 40 }}
                  >
                    {leaving ? "Leaving…" : "Leave Coach"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
