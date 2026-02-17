import Link from "next/link";

export function CheckInStatus({
  status,
  weekLabel,
  checkInDate,
}: {
  status: "none" | "submitted" | "reviewed";
  weekLabel: string;
  checkInDate?: string;
}) {
  if (status === "none") {
    return (
      <Link
        href="/client/check-in"
        className="group block rounded-xl bg-zinc-900 px-5 py-5 text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold sm:text-lg">Submit Your Weekly Check-In</p>
            <p className="mt-0.5 text-sm opacity-70">
              Week of {weekLabel}
            </p>
          </div>
          <span className="text-2xl transition-transform group-hover:translate-x-0.5" aria-hidden="true">
            &rarr;
          </span>
        </div>
      </Link>
    );
  }

  if (status === "submitted") {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800/50 dark:bg-amber-950/50"
        role="status"
        aria-live="polite"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800/50">
          <span className="text-sm" aria-hidden="true">&#9203;</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Waiting for coach review
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Week of {weekLabel}
            {checkInDate && <span className="ml-1 opacity-70">&middot; submitted {checkInDate}</span>}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/client/check-in"
      className="group flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 transition-colors hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:border-green-800/50 dark:bg-green-950/50 dark:hover:bg-green-900/50"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-200 dark:bg-green-800/50">
        <span className="text-sm" aria-hidden="true">&#10003;</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-green-800 dark:text-green-200">
          Coach reviewed your check-in!
        </p>
        <p className="text-xs text-green-600 dark:text-green-400">
          Week of {weekLabel} &middot; view feedback
        </p>
      </div>
      <span className="text-green-400 transition-transform group-hover:translate-x-0.5 dark:text-green-600" aria-hidden="true">
        &rarr;
      </span>
    </Link>
  );
}
