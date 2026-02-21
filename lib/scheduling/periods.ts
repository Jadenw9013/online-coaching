import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { normalizeToMonday, getWeekEnd } from "@/lib/utils/date";

dayjs.extend(utc);
dayjs.extend(timezone);

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
 * (Legacy — kept for coach review page compatibility.)
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
 * Compute the schedule-defined period for a given instant + timezone.
 *
 * periodStart = most recent occurrence of ANY scheduled day <= today (local time).
 * periodEnd   = next occurrence of a scheduled day strictly after periodStart.
 *
 * DST-safe via dayjs timezone plugin.
 */
export function computeCurrentPeriod(
  checkInDays: number[],
  instant: Date,
  tz: string
): { periodStartDate: string; periodEndDate: string; label: string } {
  const days = checkInDays.length > 0 ? checkInDays : [1]; // fallback Monday
  const sorted = [...new Set(days)].sort((a, b) => a - b);

  const localNow = dayjs(instant).tz(tz).startOf("day");
  const localWeekday = localNow.day(); // 0=Sun..6=Sat

  // Find the most recent scheduled day <= today
  let startOffset = 0;
  for (let offset = 0; offset <= 6; offset++) {
    const candidateDay = ((localWeekday - offset) % 7 + 7) % 7;
    if (sorted.includes(candidateDay)) {
      startOffset = offset;
      break;
    }
  }
  const periodStart = localNow.subtract(startOffset, "day");

  // Find the next scheduled day strictly after periodStart
  let endOffset = 0;
  for (let offset = 1; offset <= 7; offset++) {
    const candidateDay = (periodStart.day() + offset) % 7;
    if (sorted.includes(candidateDay)) {
      endOffset = offset;
      break;
    }
  }
  const periodEnd = periodStart.add(endOffset, "day");

  const periodStartDate = periodStart.format("YYYY-MM-DD");
  const periodEndDate = periodEnd.format("YYYY-MM-DD");

  return {
    periodStartDate,
    periodEndDate,
    label: formatPeriodDateLabel(periodStartDate, periodEndDate),
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

/**
 * Format a period from YYYY-MM-DD strings.
 * e.g. "Feb 10 – Feb 14"
 */
export function formatPeriodDateLabel(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return startDate || "—";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  const s = new Date(startDate + "T00:00:00Z").toLocaleDateString("en-US", opts);
  const e = new Date(endDate + "T00:00:00Z").toLocaleDateString("en-US", opts);
  return `${s} \u2013 ${e}`;
}
