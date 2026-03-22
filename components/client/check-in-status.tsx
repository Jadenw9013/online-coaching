import Link from "next/link";

export function CheckInStatus({
  status,
  weekLabel,
  statusLabel,
  nextDueLabel,
  checkInDate,
  checkInId,
}: {
  status: "none" | "submitted" | "reviewed";
  weekLabel: string;
  statusLabel?: string;
  nextDueLabel?: string;
  checkInDate?: string;
  checkInId?: string;
}) {
  if (status === "none") {
    return (
      <Link
        href="/client/check-in"
        className="group relative block overflow-hidden rounded-2xl px-6 py-6 text-white transition-all hover:shadow-xl hover:shadow-blue-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1e]"
        style={{
          background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)",
          minHeight: "80px",
        }}
        role="status"
        aria-live="polite"
      >
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-lg font-bold sm:text-xl">Submit Your Check-In</p>
            <p className="mt-1 text-sm text-white/70">
              {statusLabel || weekLabel}
            </p>
            {nextDueLabel && (
              <p className="mt-0.5 text-xs text-white/50">{nextDueLabel}</p>
            )}
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </div>
      </Link>
    );
  }

  if (status === "submitted") {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-5"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-300">
              {statusLabel || "Waiting for coach review"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {checkInDate && <span>Submitted {checkInDate}</span>}
              {nextDueLabel && <span> &middot; {nextDueLabel}</span>}
              {!checkInDate && !nextDueLabel && weekLabel}
            </p>
            <Link
              href="/client/check-in"
              className="mt-1 inline-block text-xs font-medium text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors"
            >
              Update check-in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // status === "reviewed"
  if (checkInId) {
    return (
      <Link
        href={`/client/check-ins/${checkInId}`}
        className="group relative block overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-5 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1e]"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-emerald-300">
              Your coach left feedback
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {nextDueLabel || `${weekLabel} · tap to view`}
            </p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </Link>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-emerald-300">
            Check-in reviewed
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {nextDueLabel || weekLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
