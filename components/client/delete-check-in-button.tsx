"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { deleteCheckIn } from "@/app/actions/check-in";
import { useRouter } from "next/navigation";

export function DeleteCheckInButton({ checkInId }: { checkInId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const modal = open
    ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-ci-title"
          aria-describedby="delete-ci-desc"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Dialog card */}
          <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-zinc-900 p-6 shadow-2xl">
            <h2 id="delete-ci-title" className="text-base font-semibold text-zinc-100">
              Delete check-in?
            </h2>
            <p id="delete-ci-desc" className="mt-2 text-sm leading-relaxed text-zinc-400">
              This will remove the check-in from your history and your coach&apos;s
              inbox. You can resubmit for the same week afterwards.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-white/[0.15] hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {/* Three-dot trigger */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setOpen(true); }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        aria-label="Check-in options"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>

      {modal}
    </>
  );
}
