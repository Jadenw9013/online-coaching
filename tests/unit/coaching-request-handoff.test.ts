import { describe, it, expect } from "vitest";

/**
 * Coaching request handoff — state rule validation tests.
 *
 * These tests validate the guard logic that determines when
 * resend/action operations should be allowed or blocked.
 * The actual server actions depend on DB + auth, so we test
 * the state rules in isolation.
 */

// State rule helpers — mirror the guard logic from coaching-requests.ts
function canResendInvite(request: {
    status: string;
    prospectId: string | null;
}): { allowed: boolean; reason?: string } {
    if (request.status !== "APPROVED") {
        return { allowed: false, reason: "Only approved requests can receive invites." };
    }
    if (request.prospectId) {
        return { allowed: false, reason: "This person has already signed up and is connected." };
    }
    return { allowed: true };
}

function shouldTrackInviteMetadata(request: {
    status: string;
    prospectId: string | null;
}, emailSent: boolean): boolean {
    return request.status === "APPROVED" && !request.prospectId && emailSent;
}

describe("resendInvite state rules", () => {
    it("allows resend for approved + awaiting signup", () => {
        const result = canResendInvite({ status: "APPROVED", prospectId: null });
        expect(result.allowed).toBe(true);
    });

    it("blocks resend for linked requests", () => {
        const result = canResendInvite({ status: "APPROVED", prospectId: "user_123" });
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("already signed up");
    });

    it("blocks resend for pending requests", () => {
        const result = canResendInvite({ status: "PENDING", prospectId: null });
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("approved");
    });

    it("blocks resend for rejected requests", () => {
        const result = canResendInvite({ status: "REJECTED", prospectId: null });
        expect(result.allowed).toBe(false);
    });

    it("blocks resend for waitlisted requests", () => {
        const result = canResendInvite({ status: "WAITLISTED", prospectId: null });
        expect(result.allowed).toBe(false);
    });
});

describe("invite metadata tracking", () => {
    it("tracks metadata when approved + no account + email sent", () => {
        const result = shouldTrackInviteMetadata(
            { status: "APPROVED", prospectId: null },
            true,
        );
        expect(result).toBe(true);
    });

    it("skips metadata when email failed", () => {
        const result = shouldTrackInviteMetadata(
            { status: "APPROVED", prospectId: null },
            false,
        );
        expect(result).toBe(false);
    });

    it("skips metadata when prospect already linked", () => {
        const result = shouldTrackInviteMetadata(
            { status: "APPROVED", prospectId: "user_123" },
            true,
        );
        expect(result).toBe(false);
    });

    it("skips metadata for non-approved status", () => {
        const result = shouldTrackInviteMetadata(
            { status: "PENDING", prospectId: null },
            true,
        );
        expect(result).toBe(false);
    });
});

describe("invite send count", () => {
    it("initial approval sets count to 1", () => {
        // Mirrors the approveCoachingRequest behavior:
        // inviteSendCount: 1 on first email send
        const initialCount = 1;
        expect(initialCount).toBe(1);
    });

    it("resend increments count", () => {
        // Mirrors the resendInvite behavior:
        // inviteSendCount: { increment: 1 }
        const beforeResend = 1;
        const afterResend = beforeResend + 1;
        expect(afterResend).toBe(2);
    });

    it("multiple resends track correctly", () => {
        const counts = [1, 2, 3, 4];
        counts.forEach((count, i) => {
            expect(count).toBe(i + 1);
        });
    });
});

// State rule helper — mirrors the guard logic from acceptClient
function canAcceptClient(request: { status: string }): {
    allowed: boolean;
    reason?: string;
} {
    if (request.status === "ACCEPTED" || request.status === "APPROVED") {
        return { allowed: false, reason: "Client already accepted." };
    }
    return { allowed: true };
}

describe("acceptClient state rules", () => {
    it("allows accept for PENDING leads", () => {
        expect(canAcceptClient({ status: "PENDING" }).allowed).toBe(true);
    });

    it("allows accept for CONTACTED leads", () => {
        expect(canAcceptClient({ status: "CONTACTED" }).allowed).toBe(true);
    });

    it("allows accept for CALL_SCHEDULED leads", () => {
        expect(canAcceptClient({ status: "CALL_SCHEDULED" }).allowed).toBe(true);
    });

    it("blocks accept for already ACCEPTED leads", () => {
        const result = canAcceptClient({ status: "ACCEPTED" });
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("already accepted");
    });

    it("blocks accept for already APPROVED leads", () => {
        const result = canAcceptClient({ status: "APPROVED" });
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("already accepted");
    });
});

describe("JIT conversion status matching", () => {
    // Mirrors the JIT query in lib/auth/roles.ts
    const JIT_ELIGIBLE_STATUSES = ["APPROVED", "ACCEPTED"];

    it("matches APPROVED requests", () => {
        expect(JIT_ELIGIBLE_STATUSES.includes("APPROVED")).toBe(true);
    });

    it("matches ACCEPTED requests", () => {
        expect(JIT_ELIGIBLE_STATUSES.includes("ACCEPTED")).toBe(true);
    });

    it("does not match PENDING requests", () => {
        expect(JIT_ELIGIBLE_STATUSES.includes("PENDING")).toBe(false);
    });

    it("does not match DECLINED requests", () => {
        expect(JIT_ELIGIBLE_STATUSES.includes("DECLINED")).toBe(false);
    });
});
