import { describe, it, expect } from "vitest";
import {
    getEffectiveScheduleDays,
    getNextDueDay,
    isCheckInDueToday,
} from "@/lib/scheduling/periods";
import { getClientWorkflowState } from "@/lib/scheduling/workflow-state";

describe("getEffectiveScheduleDays", () => {
    it("uses client override when non-empty", () => {
        expect(getEffectiveScheduleDays([1, 3], [5])).toEqual([5]);
    });

    it("falls back to coach default when client override is empty", () => {
        expect(getEffectiveScheduleDays([1, 3], [])).toEqual([1, 3]);
    });

    it("falls back to [1] (Monday) when both are empty", () => {
        expect(getEffectiveScheduleDays([], [])).toEqual([1]);
    });
});

describe("isCheckInDueToday", () => {
    it("returns false for empty schedule", () => {
        expect(isCheckInDueToday([], "UTC")).toBe(false);
    });

    it("returns true when today's day is in the schedule", () => {
        const todayDay = new Date().getUTCDay();
        expect(isCheckInDueToday([todayDay], "UTC")).toBe(true);
    });

    it("returns false when today's day is not in the schedule", () => {
        const todayDay = new Date().getUTCDay();
        const otherDay = (todayDay + 3) % 7;
        expect(isCheckInDueToday([otherDay], "UTC")).toBe(false);
    });
});

describe("getNextDueDay", () => {
    it("returns null for empty schedule", () => {
        expect(getNextDueDay([], "America/New_York")).toBeNull();
    });

    it("returns a valid result with the correct day name", () => {
        const result = getNextDueDay([1, 3, 5], "America/New_York");
        expect(result).not.toBeNull();
        expect(result!.dayName).toBeTruthy();
        expect(result!.dayIndex).toBeGreaterThanOrEqual(0);
        expect(result!.dayIndex).toBeLessThanOrEqual(6);
        expect(result!.daysUntil).toBeGreaterThanOrEqual(0);
        expect(result!.daysUntil).toBeLessThanOrEqual(6);
    });

    it("returns daysUntil=0 when today is a due day", () => {
        const now = new Date();
        const todayDay = new Date(
            now.toLocaleString("en-US", { timeZone: "UTC" })
        ).getDay();
        const result = getNextDueDay([todayDay], "UTC");
        expect(result).not.toBeNull();
        expect(result!.daysUntil).toBe(0);
        expect(result!.dayIndex).toBe(todayDay);
    });

    it("returns correct offset for a single future day", () => {
        const now = new Date();
        const todayDay = new Date(
            now.toLocaleString("en-US", { timeZone: "UTC" })
        ).getDay();
        const futureDay = (todayDay + 2) % 7;
        const result = getNextDueDay([futureDay], "UTC");
        expect(result).not.toBeNull();
        expect(result!.daysUntil).toBe(2);
        expect(result!.dayIndex).toBe(futureDay);
    });
});

describe("cron schedule-awareness logic", () => {
    function isDueToday(scheduleDays: number[], tz: string, serverTime: Date): boolean {
        const d = new Date(serverTime.toLocaleString("en-US", { timeZone: tz }));
        return scheduleDays.includes(d.getDay());
    }

    it("identifies due day correctly for Monday schedule", () => {
        const now = new Date();
        const daysUntilMonday = (1 - now.getDay() + 7) % 7;
        const monday = new Date(now);
        monday.setDate(monday.getDate() + daysUntilMonday);
        monday.setHours(10, 0, 0, 0);
        expect(isDueToday([1], "UTC", monday)).toBe(true);
        expect(isDueToday([2], "UTC", monday)).toBe(false);
    });

    it("works with multiple due days", () => {
        const now = new Date();
        // Derive today's day the same way isDueToday does for UTC
        const todayDay = new Date(now.toLocaleString("en-US", { timeZone: "UTC" })).getDay();
        expect(isDueToday([todayDay, (todayDay + 3) % 7], "UTC", now)).toBe(true);
    });

    it("skips non-due days correctly", () => {
        const now = new Date();
        const todayDay = new Date(now.toLocaleString("en-US", { timeZone: "UTC" })).getDay();
        const otherDay = (todayDay + 1) % 7;
        expect(isDueToday([otherDay], "UTC", now)).toBe(false);
    });
});

describe("getClientWorkflowState", () => {
    // Helper to get today's day of week in UTC
    function todayDow(): number {
        return new Date(new Date().toLocaleString("en-US", { timeZone: "UTC" })).getDay();
    }

    it("returns null for empty schedule", () => {
        expect(getClientWorkflowState([], "UTC", false, null)).toBeNull();
    });

    it("returns due_today when today is a due day and not checked in", () => {
        const day = todayDow();
        const result = getClientWorkflowState([day], "UTC", false, null);
        expect(result).not.toBeNull();
        expect(result!.status).toBe("due_today");
    });

    it("returns completed when today is a due day and checked in (submitted)", () => {
        const day = todayDow();
        const result = getClientWorkflowState([day], "UTC", true, "SUBMITTED");
        expect(result).not.toBeNull();
        expect(result!.status).toBe("completed");
    });

    it("returns reviewed when today is a due day and check-in reviewed", () => {
        const day = todayDow();
        const result = getClientWorkflowState([day], "UTC", true, "REVIEWED");
        expect(result).not.toBeNull();
        expect(result!.status).toBe("reviewed");
    });

    it("returns upcoming when today is not a due day", () => {
        const day = todayDow();
        const futureDay = (day + 2) % 7;
        const result = getClientWorkflowState([futureDay], "UTC", false, null);
        expect(result).not.toBeNull();
        expect(result!.status).toBe("upcoming");
        if (result!.status === "upcoming") {
            expect(result!.daysUntil).toBe(2);
        }
    });

    it("returns upcoming with correct day name", () => {
        const day = todayDow();
        const futureDay = (day + 1) % 7;
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const result = getClientWorkflowState([futureDay], "UTC", false, null);
        expect(result).not.toBeNull();
        if (result!.status === "upcoming") {
            expect(result!.dayName).toBe(dayNames[futureDay]);
        }
    });
});
