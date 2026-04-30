"use client";

import { type CSSProperties } from "react";
import Link from "next/link";
import { deriveStatusState, type StatusState } from "@/lib/status";

// Re-export so existing imports (`from "@/components/client/status-card"`) keep working
export { deriveStatusState, type StatusState };

export type StatusCardData = {
  state: StatusState;
  streakWeeks: number;
  opensCheckIn: boolean;
};

const STATUS_CONFIG: Record<StatusState, {
  headline: string;
  kicker: string;
  supporting: string;
  icon: string; // SVG path
  glowColor: string;
  badgeColor: string;
  ringColor: string;
  atmosphere: string;
}> = {
  locked_in: {
    headline: "Locked In",
    kicker: "Elite consistency",
    supporting: "You are following the plan with real consistency. Keep the standard high.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", // check circle
    glowColor: "#5FA7FF",
    badgeColor: "#89D0FF",
    ringColor: "#9DE4FF",
    atmosphere: "#192A43",
  },
  on_track: {
    headline: "On Track",
    kicker: "Solid momentum",
    supporting: "You are stacking good weeks. Stay steady and protect the routine.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z", // lightning bolt
    glowColor: "#4E7DFF",
    badgeColor: "#80B6FF",
    ringColor: "#8DC5FF",
    atmosphere: "#1B223C",
  },
  needs_focus: {
    headline: "Needs Focus",
    kicker: "Small reset",
    supporting: "A few stronger choices this week will move you right back into rhythm.",
    icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", // eye/scope
    glowColor: "#5C8AF2",
    badgeColor: "#94B8FF",
    ringColor: "#AAC7FF",
    atmosphere: "#20253E",
  },
  off_plan: {
    headline: "Reset Week",
    kicker: "Fresh start",
    supporting: "This is a reset moment. One completed workout and one strong check-in gets things moving again.",
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", // refresh
    glowColor: "#6074A6",
    badgeColor: "#9DB3D8",
    ringColor: "#AEB7CF",
    atmosphere: "#23263A",
  },
  overdue: {
    headline: "Check-In Due",
    kicker: "Action needed",
    supporting: "Your coach is waiting on this week's check-in so they can guide the next move.",
    icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", // exclamation circle
    glowColor: "#6EA4FF",
    badgeColor: "#AED2FF",
    ringColor: "#C0DDFF",
    atmosphere: "#1E2740",
  },
};


// ── Component ───────────────────────────────────────────────────────────────

export function StatusCard({ data }: { data: StatusCardData }) {
  const config = STATUS_CONFIG[data.state];
  const hasCTA = data.opensCheckIn;

  const style: CSSProperties = {
    "--sf-card-highlight": config.glowColor,
    "--sf-card-atmosphere": config.atmosphere,
  } as CSSProperties;

  const content = (
    <div className="sf-surface-card" style={style}>
      <div className="sf-surface-edge" aria-hidden="true" />

      {/* Header row */}
      <div className="relative z-[1] flex items-center justify-between">
        <span className="sf-section-label">CHECK-IN</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white/80"
          aria-hidden="true"
        >
          <path d={config.icon} />
        </svg>
      </div>

      {/* Headline */}
      <div className="relative z-[1] flex flex-col items-center gap-1 py-3">
        <h2
          className="text-[24px] font-black tracking-wider"
          style={{ color: "white" }}
        >
          {config.headline}
        </h2>
        {data.streakWeeks > 0 && (
          <p
            className="text-[11px] font-black uppercase tracking-wider"
            style={{ color: config.badgeColor, opacity: 0.95 }}
          >
            {data.streakWeeks === 1 ? "1 week streak" : `${data.streakWeeks} week streak`}
          </p>
        )}
      </div>

      {/* CTA button */}
      {hasCTA && (
        <div className="relative z-[1] flex justify-center">
          <span
            className="inline-flex items-center rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white"
            style={{
              background: `linear-gradient(90deg, ${config.glowColor}, ${config.badgeColor})`,
            }}
          >
            OPEN CHECK-IN
          </span>
        </div>
      )}
    </div>
  );

  if (hasCTA) {
    return (
      <Link
        href="/client/check-in"
        className="block transition-transform hover:scale-[0.99] active:scale-[0.97]"
        aria-label="Open check-in"
      >
        {content}
      </Link>
    );
  }

  return (
    <Link
      href="/client/check-in"
      className="block transition-transform hover:scale-[0.99] active:scale-[0.97]"
      aria-label="View check-in status"
    >
      {content}
    </Link>
  );
}
