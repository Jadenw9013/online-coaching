import { describe, it, expect } from "vitest";
import {
  isBetaActive,
  hasBillingAccess,
  isInGracePeriod,
  requiresPayment,
  getBillingBannerState,
} from "@/lib/billing/access";
import type { BillingUserLike } from "@/lib/billing/access";
import { getPlanLimits } from "@/lib/billing/entitlements";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const NOW = new Date("2026-06-15T12:00:00Z");

function coach(overrides: Partial<BillingUserLike> = {}): BillingUserLike {
  return { role: "COACH", ...overrides };
}

function client(overrides: Partial<BillingUserLike> = {}): BillingUserLike {
  return { role: "CLIENT", ...overrides };
}

// ---------------------------------------------------------------------------
// isBetaActive / hasBillingAccess
// ---------------------------------------------------------------------------

describe("isBetaActive / hasBillingAccess", () => {
  it("beta coach with betaAccessEndsAt 30 days in future → access true", () => {
    const user = coach({
      billingState: "BETA",
      betaAccessEndsAt: new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000),
    });
    expect(isBetaActive(user, NOW)).toBe(true);
    expect(hasBillingAccess(user, NOW)).toBe(true);
  });

  it("beta coach with betaAccessEndsAt 1 day in past → access false", () => {
    const user = coach({
      billingState: "BETA",
      betaAccessEndsAt: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000),
    });
    expect(isBetaActive(user, NOW)).toBe(false);
    expect(hasBillingAccess(user, NOW)).toBe(false);
  });

  it("beta coach with both betaAccessEndsAt and createdAt null → access false, no crash", () => {
    const user = coach({
      billingState: "BETA",
      betaAccessEndsAt: null,
      createdAt: null,
    });
    expect(isBetaActive(user, NOW)).toBe(false);
    expect(hasBillingAccess(user, NOW)).toBe(false);
  });

  it("beta coach created 3 days ago with betaAccessEndsAt 5 days from now → access true (MIN window)", () => {
    const user = coach({
      billingState: "BETA",
      createdAt: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000),
      betaAccessEndsAt: new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000),
    });
    // createdAt + 14 days is 11 days from now, which is > betaAccessEndsAt (5 days)
    // effectiveEnd = max(5 days from now, 11 days from now) = 11 days from now
    expect(isBetaActive(user, NOW)).toBe(true);
    expect(hasBillingAccess(user, NOW)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Grace period
// ---------------------------------------------------------------------------

describe("isInGracePeriod", () => {
  it("billingState === GRACE_PERIOD → hasBillingAccess true", () => {
    const user = coach({ billingState: "GRACE_PERIOD" });
    expect(isInGracePeriod(user, NOW)).toBe(true);
    expect(hasBillingAccess(user, NOW)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Paid subscribers
// ---------------------------------------------------------------------------

describe("paid subscribers", () => {
  it("subscriptionStatus === ACTIVE → hasBillingAccess true", () => {
    const user = coach({ subscriptionStatus: "ACTIVE" });
    expect(hasBillingAccess(user, NOW)).toBe(true);
  });

  it("subscriptionStatus === TRIALING → hasBillingAccess true", () => {
    const user = coach({ subscriptionStatus: "TRIALING" });
    expect(hasBillingAccess(user, NOW)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Unpaid
// ---------------------------------------------------------------------------

describe("unpaid coaches", () => {
  it("subscriptionStatus === PAST_DUE, no grace → requiresPayment true", () => {
    const user = coach({ subscriptionStatus: "PAST_DUE" });
    expect(requiresPayment(user, NOW)).toBe(true);
  });

  it("subscriptionStatus === CANCELED, no grace → requiresPayment true", () => {
    const user = coach({ subscriptionStatus: "CANCELED" });
    expect(requiresPayment(user, NOW)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Client safety
// ---------------------------------------------------------------------------

describe("client safety", () => {
  it("client with no billing fields → hasBillingAccess true, requiresPayment false", () => {
    const user = client();
    expect(hasBillingAccess(user, NOW)).toBe(true);
    expect(requiresPayment(user, NOW)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getBillingBannerState
// ---------------------------------------------------------------------------

describe("getBillingBannerState", () => {
  it("active paid → NONE", () => {
    const user = coach({ subscriptionStatus: "ACTIVE" });
    expect(getBillingBannerState(user, NOW)).toBe("NONE");
  });

  it("grace period → GRACE_PERIOD", () => {
    const user = coach({ billingState: "GRACE_PERIOD" });
    expect(getBillingBannerState(user, NOW)).toBe("GRACE_PERIOD");
  });

  it("requires payment → REQUIRES_PAYMENT", () => {
    const user = coach({ subscriptionStatus: "CANCELED" });
    expect(getBillingBannerState(user, NOW)).toBe("REQUIRES_PAYMENT");
  });

  it("beta expiring in 10 days → BETA_EXPIRING_SOON", () => {
    const user = coach({
      billingState: "BETA",
      betaAccessEndsAt: new Date(NOW.getTime() + 10 * 24 * 60 * 60 * 1000),
      createdAt: new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000), // created 60 days ago
    });
    expect(getBillingBannerState(user, NOW)).toBe("BETA_EXPIRING_SOON");
  });
});

// ---------------------------------------------------------------------------
// getPlanLimits
// ---------------------------------------------------------------------------

describe("getPlanLimits", () => {
  it("STARTER → maxClients 10", () => {
    expect(getPlanLimits("STARTER")).toEqual({ maxClients: 10 });
  });

  it("PRO → maxClients 50", () => {
    expect(getPlanLimits("PRO")).toEqual({ maxClients: 50 });
  });

  it("BETA → maxClients 50", () => {
    expect(getPlanLimits("BETA")).toEqual({ maxClients: 50 });
  });
});
