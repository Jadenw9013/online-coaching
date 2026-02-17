"use client";

import { useState } from "react";
import { becomeCoach } from "@/app/actions/become-coach";

export function BecomeCoachForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await becomeCoach({ accessCode: code.trim() });
      if (result && "error" in result) {
        setError(result.error);
      }
    } catch {
      // redirect throws NEXT_REDIRECT — expected behavior
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm font-medium">Become a Coach</p>
      <p className="mt-0.5 text-xs text-zinc-500">
        Have a coach access code? Enter it below.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <label htmlFor="coach-access-code" className="sr-only">
          Coach access code
        </label>
        <input
          id="coach-access-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Access code"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus-visible:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button
          type="submit"
          disabled={submitting || !code.trim()}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {submitting ? "Verifying..." : "Activate"}
        </button>
      </form>
    </div>
  );
}
