"use client";

import { useState } from "react";
import { removeClient } from "@/app/actions/coach-client";
import { useRouter } from "next/navigation";

export function RemoveClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText.toUpperCase() === "REMOVE" && acknowledged;

  function handleClose() {
    setOpen(false);
    setConfirmText("");
    setAcknowledged(false);
    setError(null);
  }

  async function handleRemove() {
    if (!isConfirmed) return;
    setRemoving(true);
    setError(null);
    try {
      await removeClient({ clientId });
      setOpen(false);
      router.push("/coach/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove client");
    } finally {
      setRemoving(false);
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
        Remove Client
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-client-title"
          aria-describedby="remove-client-desc"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog card */}
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-zinc-900 p-6 shadow-2xl">
            <h2
              id="remove-client-title"
              className="text-base font-semibold text-red-400"
            >
              Remove {clientName}?
            </h2>
            <p
              id="remove-client-desc"
              className="mt-2 text-sm leading-relaxed text-zinc-400"
            >
              This will remove <strong className="text-zinc-200">{clientName}</strong> from
              your coaching roster. They will no longer appear in your inbox or
              receive updates from you.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            {/* Type REMOVE */}
            <div className="mt-4">
              <label
                htmlFor="remove-confirm-input"
                className="block text-xs font-semibold uppercase tracking-widest text-zinc-500"
              >
                Type <span className="font-mono text-zinc-300">REMOVE</span> to confirm
              </label>
              <input
                id="remove-confirm-input"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="REMOVE"
                className="mt-2 w-full rounded-xl border border-zinc-700/60 bg-zinc-800/30 px-4 py-2.5 font-mono text-sm uppercase tracking-wider text-zinc-100 placeholder-zinc-600 focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                style={{ fontSize: "max(1rem, 16px)" }}
                autoComplete="off"
              />
            </div>

            {/* Acknowledgment */}
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500"
              />
              <span className="text-sm leading-relaxed text-zinc-400">
                I understand this does not delete the client&apos;s historical
                check-ins or meal plans.
              </span>
            </label>

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
                onClick={handleRemove}
                disabled={!isConfirmed || removing}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ minHeight: 40 }}
              >
                {removing ? "Removing…" : "Remove Client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
