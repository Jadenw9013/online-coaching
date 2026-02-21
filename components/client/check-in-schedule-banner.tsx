"use client";

import Link from "next/link";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function CheckInScheduleBanner({
  checkInDays,
  checkedInToday,
  todayDayOfWeek,
}: {
  checkInDays: number[];
  checkedInToday: boolean;
  todayDayOfWeek: number;
}) {
  // No assigned days → no banner
  if (checkInDays.length === 0) return null;

  // Today is not a scheduled check-in day → no banner
  if (!checkInDays.includes(todayDayOfWeek)) return null;

  // Already checked in today → no banner
  if (checkedInToday) return null;

  const dayName = DAY_NAMES[todayDayOfWeek];

  return (
    <Link
      href="/client/check-in"
      className="group block rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50 to-indigo-50/50 px-6 py-4 transition-all hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-blue-800/40 dark:from-blue-950/40 dark:to-indigo-950/20 dark:hover:border-blue-700"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-200/80 dark:bg-blue-800/40">
          <span className="text-sm" aria-hidden="true">&#128197;</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
            {dayName} check-in scheduled
          </p>
          <p className="mt-0.5 text-xs text-blue-600/80 dark:text-blue-400/80">
            Tap to submit your check-in for today
          </p>
        </div>
        <span className="text-blue-400 transition-transform group-hover:translate-x-1 dark:text-blue-600" aria-hidden="true">
          &rarr;
        </span>
      </div>
    </Link>
  );
}
