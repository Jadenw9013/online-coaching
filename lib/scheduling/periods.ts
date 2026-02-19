import { normalizeToMonday, getWeekEnd } from "@/lib/utils/date";

export type CheckInPeriod = {
  periodStart: Date; // Monday 00:00 UTC (same as weekOf)
  periodEnd: Date; // Sunday 23:59 UTC
  dueDays: number[]; // 0-6 day-of-week indexes
  label: string; // e.g. "Feb 10 – Feb 16"
};

/**
 * Get effective schedule days for a client.
 * Client override (non-empty array) wins over coach default.
 * Falls back to [1] (Monday) if both are empty.
 */
export function getEffectiveScheduleDays(
  coachDays: number[],
  clientOverride: number[]
): number[] {
  if (clientOverride.length > 0) return clientOverride;
  if (coachDays.length > 0) return coachDays;
  return [1]; // default Monday
}

/**
 * Get the current check-in period for a given date.
 * Periods are always Mon-Sun, matching the weekOf semantics.
 */
export function getCurrentPeriod(
  date: Date,
  scheduleDays: number[]
): CheckInPeriod {
  const periodStart = normalizeToMonday(date);
  const periodEnd = getWeekEnd(periodStart);
  return {
    periodStart,
    periodEnd,
    dueDays: scheduleDays,
    label: formatPeriodLabel(periodStart, periodEnd),
  };
}

/**
 * Format a period as "Mon D – Mon D" range label.
 * e.g. "Feb 10 – Feb 16"
 */
export function formatPeriodLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  };
  const startStr = start.toLocaleDateString("en-US", opts);
  const endStr = end.toLocaleDateString("en-US", opts);
  return `${startStr} \u2013 ${endStr}`;
}
