import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Compute the local date string (YYYY-MM-DD) for a given instant in a given timezone.
 * DST-safe via dayjs timezone plugin.
 */
export function getLocalDate(instant: Date, tz: string): string {
  return dayjs(instant).tz(tz).format("YYYY-MM-DD");
}

/**
 * Normalize any date to the Monday of its ISO week at midnight UTC.
 */
export function normalizeToMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the Monday of the current ISO week at midnight UTC.
 */
export function getCurrentWeekMonday(): Date {
  return normalizeToMonday(new Date());
}

/**
 * Parse a "YYYY-MM-DD" string and normalize to its Monday at midnight UTC.
 */
export function parseWeekStartDate(dateStr: string): Date {
  const date = new Date(dateStr + "T00:00:00Z");
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return normalizeToMonday(date);
}

/**
 * Format a Date as "YYYY-MM-DD" in UTC.
 */
export function formatDateUTC(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get the Sunday end-of-week (23:59:59.999 UTC) for a given Monday.
 */
export function getWeekEnd(monday: Date): Date {
  const end = new Date(monday);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}
