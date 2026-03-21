import { BillingUserLike, requiresPayment } from "./access";
import { getPlanLimits } from "./entitlements";

export function assertCoachBillingAccess(user: BillingUserLike): void {
  if (requiresPayment(user)) {
    throw new Error(
      "Your billing status needs attention before you can continue."
    );
  }
}

export function assertCoachCanAddClient(
  user: BillingUserLike,
  currentClientCount: number
): void {
  assertCoachBillingAccess(user);
  const limits = getPlanLimits(user.subscriptionTier ?? "BETA");
  if (currentClientCount >= limits.maxClients) {
    throw new Error(
      "You have reached your client limit. Please upgrade your plan."
    );
  }
}

export function assertCoachCanUsePaidWorkflow(user: BillingUserLike): void {
  assertCoachBillingAccess(user);
}
