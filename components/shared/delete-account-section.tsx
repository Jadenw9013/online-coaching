"use client";

import { useState, useTransition } from "react";
import { requestAccountDeletion } from "@/app/actions/account-deletion";
import { useRouter } from "next/navigation";

const COACH_DATA = [
  "Your profile and all account information",
  "Your coaching marketplace profile",
  "All client relationships (your clients will remain on Steadfast but without a coach)",
  "All meal plans and training programs you created",
  "All messages between you and your clients",
  "All leads and pipeline data",
  "All uploaded files and photos",
];

const CLIENT_DATA = [
  "Your profile and all account information",
  "All check-ins and progress photos you submitted",
  "Your meal plan and training program history",
  "All messages between you and your coach",
  "Your intake questionnaire responses",
  "All uploaded photos",
];

export function DeleteAccountSection({
  role,
}: {
  role: "coach" | "client" | "both";
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText === "DELETE MY ACCOUNT";

  const dataItems =
    role === "both"
      ? [...new Set([...COACH_DATA, ...CLIENT_DATA])]
      : role === "coach"
        ? COACH_DATA
        : CLIENT_DATA;

  function handleSubmit() {
    if (!isConfirmed) return;
    setError(null);
    startTransition(async () => {
      try {
        await requestAccountDeletion({
          reason: reason || undefined,
          confirmationText: confirmText,
        });
        router.push("/account-deletion-pending");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to request deletion."
        );
      }
    });
  }

  return (
    <section
      aria-labelledby="danger-zone-heading"
      className="animate-fade-in"
      style={{ animationDelay: "300ms" }}
    >
      <h2
        id="danger-zone-heading"
        className="mb-3 text-xs font-semibold uppercase tracking-widest text-red-500"
      >
        Danger Zone
      </h2>
      <div
        className="sf-glass-card overflow-hidden"
        style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
      >
        {/* Collapsed header */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/[0.02]"
        >
          <div>
            <p className="text-sm font-medium text-red-400">
              Delete Account
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Permanently delete your account and all associated data
            </p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-white/[0.06] p-5 space-y-5">
            {/* What will be deleted */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
                What will be deleted
              </p>
              <ul className="space-y-1.5">
                {dataItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-zinc-400"
                  >
                    <span className="text-red-400 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Grace period notice */}
            <div
              className="rounded-xl p-3"
              style={{
                background: "rgba(250,204,21,0.06)",
                border: "1px solid rgba(250,204,21,0.15)",
              }}
            >
              <p className="text-xs text-yellow-500/80">
                Your account will be fully deleted{" "}
                <strong className="text-yellow-400">30 days</strong> after
                requesting deletion. You can cancel anytime before that date
                to restore full access.
              </p>
            </div>

            {/* Reason (optional) */}
            <div>
              <label
                htmlFor="deletion-reason"
                className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5"
              >
                Reason (optional)
              </label>
              <textarea
                id="deletion-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us understand why you're leaving…"
                rows={2}
                maxLength={1000}
                className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/30 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none"
                style={{ fontSize: "max(1rem, 16px)" }}
              />
            </div>

            {/* Confirmation input */}
            <div>
              <label
                htmlFor="delete-confirm-input"
                className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5"
              >
                Type{" "}
                <span className="font-mono text-zinc-300">
                  DELETE MY ACCOUNT
                </span>{" "}
                to confirm
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                autoComplete="off"
                className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/30 px-4 py-2.5 font-mono text-sm tracking-wider text-zinc-100 placeholder-zinc-600 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                style={{ fontSize: "max(1rem, 16px)" }}
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-2.5 text-sm text-red-400"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isConfirmed || isPending}
              className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isPending
                ? "Scheduling deletion…"
                : "Schedule Account Deletion"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
