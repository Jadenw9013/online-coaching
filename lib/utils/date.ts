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
