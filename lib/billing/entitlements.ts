export type PlanLimits = {
  maxClients: number;
};

export function getPlanLimits(tier: "BETA" | "STARTER" | "PRO"): PlanLimits {
  switch (tier) {
    case "STARTER":
      return { maxClients: 10 };
    case "PRO":
      return { maxClients: 50 };
    case "BETA":
      return { maxClients: 50 };
    default:
      return { maxClients: 0 };
  }
}
