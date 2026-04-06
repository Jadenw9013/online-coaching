"use client";

import { useState, useTransition } from "react";
import { cancelAccountDeletion } from "@/app/actions/account-deletion";
import { useRouter } from "next/navigation";

export function CancelDeletionButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      try {
        await cancelAccountDeletion();
        router.push("/");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to cancel deletion.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {isPending ? "Restoring account…" : "Cancel Deletion & Restore Account"}
      </button>
      {error && (
        <p className="text-center text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
