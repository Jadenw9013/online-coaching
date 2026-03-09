"use client";

import Link from "next/link";
import type { ClientWorkflowState } from "@/lib/scheduling/workflow-state";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function CheckInScheduleBanner({
  checkInDays,
  workflowState,
}: {
  checkInDays: number[];
  workflowState: ClientWorkflowState | null;
}) {
  // No assigned days → no banner
  if (checkInDays.length === 0 || !workflowState) return null;

  // Due today — not yet completed
  if (workflowState.status === "due_today") {
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
              {workflowState.dayName} check-in due today
            </p>
            <p className="mt-0.5 text-xs text-blue-600/80 dark:text-blue-400/80">
              Tap to submit your check-in
            </p>
          </div>
          <span className="text-blue-400 transition-transform group-hover:translate-x-1 dark:text-blue-600" aria-hidden="true">
            &rarr;
          </span>
        </div>
      </Link>
    );
  }

  // Completed today (submitted, waiting for review)
  if (workflowState.status === "completed") {
    return (
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-green-50/50 px-6 py-4 dark:border-emerald-800/40 dark:from-emerald-950/40 dark:to-green-950/20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-200/80 dark:bg-emerald-800/40">
            <span className="text-sm" aria-hidden="true">&#10003;</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              {workflowState.dayName}&apos;s check-in submitted
            </p>
            <p className="mt-0.5 text-xs text-emerald-600/80 dark:text-emerald-400/80">
              Waiting for coach review
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Reviewed
  if (workflowState.status === "reviewed") {
    return (
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-green-50/50 px-6 py-4 dark:border-emerald-800/40 dark:from-emerald-950/40 dark:to-green-950/20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-200/80 dark:bg-emerald-800/40">
            <span className="text-sm" aria-hidden="true">&#10003;</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              Check-in reviewed
            </p>
            <p className="mt-0.5 text-xs text-emerald-600/80 dark:text-emerald-400/80">
              Your coach has reviewed this week&apos;s check-in
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Upcoming — next due day
  const daysLabel = workflowState.daysUntil === 1
    ? "tomorrow"
    : `in ${workflowState.daysUntil} days`;

  const scheduleDayLabels = [...checkInDays]
    .sort((a, b) => a - b)
    .map((d) => DAY_NAMES[d]?.slice(0, 3))
    .join(", ");

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 to-zinc-100/50 px-6 py-4 dark:border-zinc-800/40 dark:from-zinc-900/40 dark:to-zinc-950/20">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200/80 dark:bg-zinc-800/40">
          <span className="text-sm" aria-hidden="true">&#128197;</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Next check-in: <span className="font-bold">{workflowState.dayName}</span>
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {daysLabel} &middot; Schedule: {scheduleDayLabels}
          </p>
        </div>
      </div>
    </div>
  );
}
