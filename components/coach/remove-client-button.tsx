"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isConfirmed =
    confirmText.toUpperCase() === "REMOVE" && acknowledged;

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      cancelRef.current?.focus();
    } else {
      dialogRef.current?.close();
      triggerRef.current?.focus();
      setConfirmText("");
      setAcknowledged(false);
      setError(null);
    }
  }, [open]);

  const handleClose = useCallback(() => setOpen(false), []);

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
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
      >
        Remove Client
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-0 shadow-xl backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-900"
        aria-labelledby="remove-dialog-title"
        aria-describedby="remove-dialog-desc"
      >
        <div className="p-6">
          <h2
            id="remove-dialog-title"
            className="text-lg font-semibold text-red-600 dark:text-red-400"
          >
            Remove {clientName}?
          </h2>
          <p
            id="remove-dialog-desc"
            className="mt-2 text-sm text-zinc-600 dark:text-zinc-400"
          >
            This will remove <strong>{clientName}</strong> from your coaching
            roster. They will no longer appear in your inbox or receive updates
            from you.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
            >
              {error}
            </div>
          )}

          {/* Type REMOVE */}
          <div className="mt-4">
            <label
              htmlFor="remove-confirm-input"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Type <span className="font-mono font-bold">REMOVE</span> to
              confirm
            </label>
            <input
              id="remove-confirm-input"
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
              I understand this does not delete the client&apos;s historical
              check-ins or meal plans.
            </span>
          </label>

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
              onClick={handleRemove}
              disabled={!isConfirmed || removing}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {removing ? "Removing..." : "Remove Client"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
