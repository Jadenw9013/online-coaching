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
    <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.04] px-5 py-4">
      <p className="text-sm font-medium">Become a Coach</p>
      <p className="mt-0.5 text-xs text-zinc-500">
        Have a coach access code? Enter it below.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-2 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-400"
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
          className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/20"
        />
        <button
          type="submit"
          disabled={submitting || !code.trim()}
          className="rounded-lg border border-white/[0.1] px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50"
        >
          {submitting ? "Verifying..." : "Activate"}
        </button>
      </form>
    </div>
  );
}
