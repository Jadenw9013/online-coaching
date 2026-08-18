import { describe, it, expect } from "vitest";
import { parseCheckInMessage, formatMessagePreview } from "@/lib/messages/check-in-message";

describe("parseCheckInMessage", () => {
    it("extracts checkInId, date, and notes from a check-in protocol message", () => {
        const result = parseCheckInMessage("[CHECKIN:abc123:Aug 8]Feeling good this week");
        expect(result).toEqual({ checkInId: "abc123", date: "Aug 8", notes: "Feeling good this week" });
    });

    it("trims whitespace from notes", () => {
        const result = parseCheckInMessage("[CHECKIN:abc123:Aug 8]  Feeling good  ");
        expect(result?.notes).toBe("Feeling good");
    });

    it("returns empty notes when the check-in had no notes", () => {
        const result = parseCheckInMessage("[CHECKIN:abc123:Aug 8]");
        expect(result?.notes).toBe("");
    });

    it("returns null for a plain, non-protocol message", () => {
        expect(parseCheckInMessage("Hey coach, quick question")).toBeNull();
    });
});

describe("formatMessagePreview", () => {
    it("strips the check-in protocol prefix and shows the notes", () => {
        expect(formatMessagePreview("[CHECKIN:abc123:Aug 8]Fucked week but still went down")).toBe(
            "Fucked week but still went down"
        );
    });

    it("falls back to a friendly label when a check-in has no notes", () => {
        expect(formatMessagePreview("[CHECKIN:abc123:Aug 8]")).toBe("Sent a check-in");
    });

    it("leaves plain messages untouched", () => {
        expect(formatMessagePreview("Hey coach, quick question")).toBe("Hey coach, quick question");
    });

    it("truncates long messages with an ellipsis", () => {
        const long = "a".repeat(80);
        const result = formatMessagePreview(long);
        expect(result.length).toBe(61); // 60 chars + ellipsis
        expect(result.endsWith("…")).toBe(true);
    });

    it("does not truncate messages at or under the limit", () => {
        const exact = "a".repeat(60);
        expect(formatMessagePreview(exact)).toBe(exact);
    });
});
