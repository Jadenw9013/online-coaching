import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Workflow state for a client's current check-in cycle.
 * Used by both client and coach surfaces for consistent display.
 */
export type ClientWorkflowState =
    | { status: "due_today"; dayName: string }
    | { status: "completed"; dayName: string }
    | { status: "upcoming"; dayName: string; daysUntil: number }
    | { status: "reviewed"; dayName: string };

/**
 * Compute the current weekly workflow state for a client.
 *
 * @param scheduleDays - Effective schedule days (already resolved from coach + override)
 * @param tz - Client's timezone
 * @param hasCheckedInToday - Whether a check-in exists for today's localDate
 * @param latestCheckInStatus - Status of the latest check-in ("SUBMITTED" | "REVIEWED" | null)
 */
export function getClientWorkflowState(
    scheduleDays: number[],
    tz: string,
    hasCheckedInToday: boolean,
    latestCheckInStatus: "SUBMITTED" | "REVIEWED" | null
): ClientWorkflowState | null {
    if (scheduleDays.length === 0) return null;

    const localDay = dayjs().tz(tz).day();
    const isDueToday = scheduleDays.includes(localDay);
    const todayName = DAY_NAMES[localDay];

    // Due today + already completed
    if (isDueToday && hasCheckedInToday) {
        if (latestCheckInStatus === "REVIEWED") {
            return { status: "reviewed", dayName: todayName };
        }
        return { status: "completed", dayName: todayName };
    }

    // Due today + not completed
    if (isDueToday) {
        return { status: "due_today", dayName: todayName };
    }

    // Not due today — find the next due day
    const sorted = [...new Set(scheduleDays)].sort((a, b) => a - b);
    let bestOffset = 8;
    let bestDay = sorted[0];
    for (const d of sorted) {
        const offset = (d - localDay + 7) % 7;
        if (offset > 0 && offset < bestOffset) {
            bestOffset = offset;
            bestDay = d;
        }
    }
    // If all offsets were 0 (shouldn't happen since isDueToday was false), wrap
    if (bestOffset === 8) {
        bestOffset = 7;
        bestDay = sorted[0];
    }

    return {
        status: "upcoming",
        dayName: DAY_NAMES[bestDay],
        daysUntil: bestOffset,
    };
}
