import { MIN_BETA_ACCESS_DAYS } from "./config";

export type BillingUserLike = {
  role?: "COACH" | "CLIENT" | null;
  subscriptionTier?: "BETA" | "STARTER" | "PRO" | null;
  subscriptionStatus?:
    | "NONE"
    | "TRIALING"
    | "ACTIVE"
    | "PAST_DUE"
    | "CANCELED"
    | null;
  billingState?:
    | "BETA"
    | "GRACE_PERIOD"
    | "REQUIRES_PAYMENT"
    | "ACTIVE"
    | null;
  betaAccessEndsAt?: Date | null;
  createdAt?: Date | null;
};

export type BillingBannerState =
  | "NONE"
  | "BETA_EXPIRING_SOON"
  | "GRACE_PERIOD"
  | "REQUIRES_PAYMENT";

/**
 * Returns true if the user is in an active beta period.
 *
 * Effective beta end = max(betaAccessEndsAt, createdAt + MIN_BETA_ACCESS_DAYS)
 * This guarantees newly added beta coaches get a minimum access window.
 * If both betaAccessEndsAt and createdAt are null, returns false safely.
 */
export function isBetaActive(
  user: BillingUserLike,
  now: Date = new Date()
): boolean {
  if (user.billingState !== "BETA") return false;

  const candidates: Date[] = [];

  if (user.betaAccessEndsAt) {
    candidates.push(new Date(user.betaAccessEndsAt));
  }

  if (user.createdAt) {
    const minEnd = new Date(user.createdAt);
    minEnd.setDate(minEnd.getDate() + MIN_BETA_ACCESS_DAYS);
    candidates.push(minEnd);
  }

  // If both are null, no valid end date exists — beta is not active
  if (candidates.length === 0) return false;

  // Effective beta end = the later of the two dates
  const effectiveEnd = new Date(
    Math.max(...candidates.map((d) => d.getTime()))
  );

  return effectiveEnd.getTime() > now.getTime();
}

/**
 * Returns true if the user's billing state is GRACE_PERIOD.
 */
export function isInGracePeriod(
  user: BillingUserLike,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  now: Date = new Date()
): boolean {
  return user.billingState === "GRACE_PERIOD";
}

/**
 * Returns true if the user has billing access.
 *
 * - Clients always have access (never blocked).
 * - Coaches have access if any of: isBetaActive, isInGracePeriod,
 *   subscriptionStatus === "ACTIVE", subscriptionStatus === "TRIALING".
 */
export function hasBillingAccess(
  user: BillingUserLike,
  now: Date = new Date()
): boolean {
  if (user.role === "CLIENT") return true;

  if (isBetaActive(user, now)) return true;
  if (isInGracePeriod(user, now)) return true;
  if (user.subscriptionStatus === "ACTIVE") return true;
  if (user.subscriptionStatus === "TRIALING") return true;

  return false;
}

/**
 * Returns true only if role === "COACH" AND hasBillingAccess is false.
 * Never returns true for clients.
 */
export function requiresPayment(
  user: BillingUserLike,
  now: Date = new Date()
): boolean {
  if (user.role !== "COACH") return false;
  return !hasBillingAccess(user, now);
}

/**
 * Returns the billing banner state to display to the user.
 */
export function getBillingBannerState(
  user: BillingUserLike,
  now: Date = new Date()
): BillingBannerState {
  if (requiresPayment(user, now)) return "REQUIRES_PAYMENT";
  if (isInGracePeriod(user, now)) return "GRACE_PERIOD";

  // Beta expiring soon: beta is active AND betaAccessEndsAt is within 30 days
  if (isBetaActive(user, now) && user.betaAccessEndsAt) {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const endsAt = new Date(user.betaAccessEndsAt);
    if (endsAt.getTime() - now.getTime() <= thirtyDaysMs) {
      return "BETA_EXPIRING_SOON";
    }
  }

  return "NONE";
}
