"use client";

import { useTransition } from "react";
import { resetToDefaultTemplate } from "@/app/actions/check-in-templates";
import { useRouter } from "next/navigation";

export function ResetTemplateButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleReset() {
    if (!confirm("Reset to default? Clients will only see core fields (weight, diet, energy, notes, photos).")) {
      return;
    }
    startTransition(async () => {
      await resetToDefaultTemplate();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={isPending}
      className="rounded-lg border border-white/[0.1] px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50"
    >
      {isPending ? "Resetting..." : "Reset to Default"}
    </button>
  );
}
