"use client";

import { useState } from "react";

export function ExportPdfButton({
  mealPlanId,
  variant = "default",
}: {
  mealPlanId: string;
  variant?: "default" | "small";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mealplans/${mealPlanId}/export`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("content-disposition");
      const match = disposition?.match(/filename="(.+)"/);
      a.download = match?.[1] ?? "meal-plan.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "small") {
    return (
      <div>
        <button
          type="button"
          onClick={handleExport}
          disabled={loading}
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:hover:text-zinc-300"
          aria-label="Export meal plan as PDF"
        >
          {loading ? "Exporting..." : "Export PDF"}
        </button>
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        aria-label="Export meal plan as PDF"
      >
        {loading ? "Exporting..." : "Export PDF"}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
