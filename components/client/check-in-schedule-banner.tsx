"use client";

import Link from "next/link";
import type { CadenceStatus } from "@/lib/scheduling/cadence";

export function CheckInScheduleBanner({
  cadenceStatus,
  statusLabel,
  nextDueLabel,
  latestReviewedCheckInId,
}: {
  cadenceStatus: CadenceStatus;
  statusLabel: string;
  nextDueLabel?: string;
  latestReviewedCheckInId?: string;
}) {
  // ── Due: prominent blue CTA ───────────────────────────────────────────────
  if (cadenceStatus === "due") {
    return (
      <Link
        href="/client/check-in"
        className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-blue-500/30 px-5 py-5 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1e]"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(59,130,246,0.08) 50%, transparent 100%)",
          minHeight: "80px",
        }}
        aria-label="Submit your check-in"
      >
        {/* Left accent bar */}
        <div className="h-10 w-1 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />

        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-zinc-100">
            Time to check in
          </p>
          <p className="mt-0.5 text-sm text-zinc-400">
            {statusLabel}
          </p>
        </div>

        {/* Arrow button */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 transition-all group-hover:bg-blue-500 group-hover:shadow-[0_0_16px_rgba(37,99,235,0.4)]" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
      </Link>
    );
  }

  // ── Overdue: red urgent CTA ───────────────────────────────────────────────
  if (cadenceStatus === "overdue") {
    return (
      <Link
        href="/client/check-in"
        className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-red-500/30 px-5 py-5 transition-all hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1e]"
        style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.08) 50%, transparent 100%)",
          minHeight: "80px",
        }}
        aria-label="Submit overdue check-in"
      >
        {/* Left accent bar */}
        <div className="h-10 w-1 shrink-0 rounded-full bg-red-500" aria-hidden="true" />

        {/* Icon with pulse */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
          <div className="absolute inset-0 rounded-xl bg-red-500/10 motion-safe:animate-pulse" aria-hidden="true" />
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative text-red-400" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-red-300">
            Check-in overdue
          </p>
          <p className="mt-0.5 text-sm text-zinc-400">
            {statusLabel}
          </p>
        </div>

        {/* Arrow button */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 transition-all group-hover:bg-red-500" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
      </Link>
    );
  }

  // ── Submitted: amber muted info card ──────────────────────────────────────
  if (cadenceStatus === "submitted") {
    return (
      <div
        className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-300">
            {statusLabel}
          </p>
          <p className="mt-0.5 text-sm text-zinc-400">
            {nextDueLabel || "Your coach will review it soon"}
          </p>
        </div>
      </div>
    );
  }

  // ── Reviewed: emerald — links to reviewed check-in ────────────────────────
  if (cadenceStatus === "reviewed") {
    const inner = (
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-300">
            Your coach left feedback
          </p>
          <p className="mt-0.5 text-sm text-zinc-400">
            {nextDueLabel || "Tap to view your check-in review"}
          </p>
        </div>
        {latestReviewedCheckInId && (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        )}
      </div>
    );

    if (latestReviewedCheckInId) {
      return (
        <Link
          href={`/client/check-ins/${latestReviewedCheckInId}`}
          className="group block rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1e]"
          role="status"
          aria-live="polite"
        >
          {inner}
        </Link>
      );
    }

    return (
      <div
        className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4"
        role="status"
        aria-live="polite"
      >
        {inner}
      </div>
    );
  }

  // ── Upcoming: zinc info, muted ─────────────────────────────────────────────
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border border-zinc-700/60 bg-zinc-800/20 px-5 py-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-700/50">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-300">
          {statusLabel}
        </p>
        {nextDueLabel && (
          <p className="mt-0.5 text-sm text-zinc-500">
            {nextDueLabel}
          </p>
        )}
      </div>
    </div>
  );
}
