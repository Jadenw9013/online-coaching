"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { deleteCheckIn } from "@/app/actions/check-in";
import { useRouter } from "next/navigation";

export function DeleteCheckInButton({ checkInId }: { checkInId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      cancelRef.current?.focus();
    } else {
      dialogRef.current?.close();
      triggerRef.current?.focus();
    }
  }, [open]);

  const handleClose = useCallback(() => setOpen(false), []);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteCheckIn({ checkInId });
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to delete check-in:", err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        aria-label="Check-in actions"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-0 shadow-xl backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-900"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
      >
        <div className="p-6">
          <h2
            id="delete-dialog-title"
            className="text-lg font-semibold"
          >
            Delete check-in?
          </h2>
          <p
            id="delete-dialog-desc"
            className="mt-2 text-sm text-zinc-500"
          >
            This will remove the check-in from your history and your
            coach&apos;s inbox. You can resubmit for the same week
            afterwards.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              ref={cancelRef}
              type="button"
              onClick={handleClose}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
