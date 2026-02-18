import { describe, it, expect } from "vitest";
import {
  normalizeToMonday,
  parseWeekStartDate,
  formatDateUTC,
} from "@/lib/utils/date";

describe("normalizeToMonday", () => {
  it("returns Monday unchanged", () => {
    // 2025-01-06 is a Monday
    const monday = new Date("2025-01-06T00:00:00Z");
    const result = normalizeToMonday(monday);
    expect(result.getUTCDay()).toBe(1);
    expect(result.toISOString()).toBe("2025-01-06T00:00:00.000Z");
  });

  it("rolls Wednesday back to Monday", () => {
    // 2025-01-08 is a Wednesday
    const wed = new Date("2025-01-08T12:30:00Z");
    const result = normalizeToMonday(wed);
    expect(result.getUTCDay()).toBe(1);
    expect(result.toISOString()).toBe("2025-01-06T00:00:00.000Z");
  });

  it("rolls Sunday back to previous Monday", () => {
    // 2025-01-12 is a Sunday
    const sun = new Date("2025-01-12T23:59:59Z");
    const result = normalizeToMonday(sun);
    expect(result.getUTCDay()).toBe(1);
    expect(result.toISOString()).toBe("2025-01-06T00:00:00.000Z");
  });

  it("zeros out time components", () => {
    const date = new Date("2025-01-07T15:45:30.123Z");
    const result = normalizeToMonday(date);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  it("does not mutate the original date", () => {
    const original = new Date("2025-01-08T12:00:00Z");
    const originalIso = original.toISOString();
    normalizeToMonday(original);
    expect(original.toISOString()).toBe(originalIso);
  });
});

describe("parseWeekStartDate", () => {
  it('parses "2025-01-06" to Monday midnight UTC', () => {
    const result = parseWeekStartDate("2025-01-06");
    expect(result.toISOString()).toBe("2025-01-06T00:00:00.000Z");
  });

  it("normalizes a non-Monday date string to its Monday", () => {
    // 2025-01-09 is Thursday → should normalize to 2025-01-06
    const result = parseWeekStartDate("2025-01-09");
    expect(result.toISOString()).toBe("2025-01-06T00:00:00.000Z");
  });

  it("throws for invalid date strings", () => {
    expect(() => parseWeekStartDate("not-a-date")).toThrow("Invalid date string");
  });
});

describe("formatDateUTC", () => {
  it('formats as "YYYY-MM-DD"', () => {
    const date = new Date("2025-01-06T00:00:00Z");
    expect(formatDateUTC(date)).toBe("2025-01-06");
  });

  it("pads single-digit months and days", () => {
    const date = new Date("2025-03-01T00:00:00Z");
    expect(formatDateUTC(date)).toBe("2025-03-01");
  });
});
