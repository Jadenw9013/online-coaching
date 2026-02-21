"use client";

import { useState } from "react";
import { markCheckInReviewed } from "@/app/actions/check-in";
import { useRouter } from "next/navigation";

export function MarkReviewedButton({ checkInId }: { checkInId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await markCheckInReviewed({ checkInId });
      router.refresh();
    } catch (err) {
      console.error("Failed to mark reviewed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label="Mark this check-in as reviewed"
      className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50"
    >
      {loading ? "Updating..." : "Mark Reviewed"}
    </button>
  );
}
