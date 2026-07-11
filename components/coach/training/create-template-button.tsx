"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTrainingTemplate } from "@/app/actions/training-templates";

export function CreateTemplateButton({
  variant = "header",
}: {
  variant?: "header" | "inline";
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      const result = await createTrainingTemplate({ name: "New Template" });
      if ("templateId" in result) {
        router.push(`/coach/templates/${result.templateId}`);
      }
    } catch {
      setCreating(false);
    }
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleCreate}
        disabled={creating}
        className="mt-1 text-sm font-semibold text-zinc-100 underline underline-offset-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
      >
        {creating ? "Creating…" : "Create your first template"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCreate}
      disabled={creating}
      className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
    >
      {creating ? "Creating…" : "New Template"}
    </button>
  );
}
