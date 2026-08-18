// Shared status badge — single source of truth for coach-facing check-in
// status colors so the dashboard list and individual client pages can't
// drift into inconsistent (or low-contrast) treatments of the same status.

export type BadgeIcon = "pulse-red" | "pulse-amber" | "check" | "clock" | "arrow";

export type BadgeInfo = {
  classes: string;
  icon: BadgeIcon;
  defaultLabel: string;
};

export const BADGE_MAP: Record<string, BadgeInfo> = {
  overdue: {
    classes: "bg-red-500/15 text-red-400 border border-red-500/20",
    icon: "pulse-red",
    defaultLabel: "Overdue",
  },
  due: {
    classes: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    icon: "pulse-amber",
    defaultLabel: "Due Today",
  },
  submitted: {
    classes: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    icon: "arrow",
    defaultLabel: "Review",
  },
  reviewed: {
    classes: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    icon: "check",
    defaultLabel: "Reviewed",
  },
  upcoming: {
    classes: "bg-slate-500/15 text-slate-300 border border-slate-500/20",
    icon: "clock",
    defaultLabel: "Upcoming",
  },
  // weekStatus fallbacks
  new: {
    classes: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    icon: "arrow",
    defaultLabel: "Review",
  },
  missing: {
    classes: "bg-red-500/25 text-red-300 border border-red-500/40",
    icon: "pulse-red",
    defaultLabel: "Missing",
  },
  not_due: {
    classes: "bg-slate-500/15 text-slate-300 border border-slate-500/20",
    icon: "clock",
    defaultLabel: "Upcoming",
  },
};

export function StatusBadge({ info, label }: { info: BadgeInfo; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${info.classes}`}
    >
      {info.icon === "pulse-red" && (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 motion-safe:animate-pulse" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
        </span>
      )}
      {info.icon === "pulse-amber" && (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 motion-safe:animate-pulse" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
        </span>
      )}
      {info.icon === "check" && (
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
      )}
      {info.icon === "clock" && (
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
      )}
      {info.icon === "arrow" && (
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
      )}
      {label}
    </span>
  );
}
