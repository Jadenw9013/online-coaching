// ── Status State Model (mirrors iOS ClientStatusBadgeModel) ─────────────────
// This file is framework-agnostic so it can be imported from both Server and
// Client components.

export type StatusState = "locked_in" | "on_track" | "needs_focus" | "off_plan" | "overdue";

/**
 * Derives the status state from adherence data.
 * Mirrors iOS `clientStatusModel(for:)` logic.
 */
export function deriveStatusState(opts: {
  cadenceStatus?: string | null;
  weeklyScore?: number | null;
  liveScore?: number | null;
}): StatusState {
  const { cadenceStatus, weeklyScore, liveScore } = opts;

  if (cadenceStatus === "overdue") return "overdue";

  // Blended score (iOS formula)
  let blended = 70; // default
  if (weeklyScore != null && liveScore != null) {
    blended = Math.round(weeklyScore * 0.75 + liveScore * 0.25);
  } else if (weeklyScore != null) {
    blended = weeklyScore;
  } else if (liveScore != null) {
    blended = liveScore;
  }

  if (blended >= 85) return "locked_in";
  if (blended >= 65) return "on_track";
  if (blended >= 40) return "needs_focus";
  return "off_plan";
}
