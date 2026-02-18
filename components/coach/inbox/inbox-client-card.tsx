import Link from "next/link";
import { formatDateUTC } from "@/lib/utils/date";

type WeekStatus = "new" | "reviewed" | "missing";

export type InboxClient = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  weekStatus: WeekStatus;
  hasClientMessage: boolean;
  checkInId: string | null;
  weekOf: Date;
  weight: number | null;
  weightChange: number | null;
  dietCompliance: number | null;
  energyLevel: number | null;
  submittedAt: Date | null;
};

const statusConfig = {
  new: {
    label: "New",
    dot: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  reviewed: {
    label: "Reviewed",
    dot: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
  },
  missing: {
    label: "Missing",
    dot: "bg-zinc-400 dark:bg-zinc-500",
    text: "text-zinc-500 dark:text-zinc-400",
  },
} as const;

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1d ago";
  return `${diffDays}d ago`;
}

export function InboxClientCard({ client }: { client: InboxClient }) {
  const weekDateStr = formatDateUTC(client.weekOf);
  const profileHref = `/coach/clients/${client.id}`;
  const reviewHref = `/coach/clients/${client.id}/review/${weekDateStr}`;

  const status = statusConfig[client.weekStatus];

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      {/* Clickable profile area */}
      <Link
        href={profileHref}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
      >
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold dark:bg-zinc-800">
          {client.firstName?.[0] ?? "?"}
        </div>

        {/* Name + time */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {client.firstName} {client.lastName}
            </p>
            {client.hasClientMessage && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500" aria-label="Has message" />
            )}
          </div>
          {client.submittedAt && (
            <p className="text-xs text-zinc-400">
              {formatTimeAgo(client.submittedAt)}
            </p>
          )}
        </div>

        {/* Metrics — compact */}
        {client.weekStatus !== "missing" && (
          <div className="hidden items-center gap-4 text-xs tabular-nums text-zinc-500 sm:flex">
            {client.weight != null && (
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {client.weight}
                <span className="ml-0.5 font-normal text-zinc-400">lbs</span>
                {client.weightChange != null && client.weightChange !== 0 && (
                  <span
                    className={`ml-1 ${
                      client.weightChange < 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-500"
                    }`}
                    aria-label={`Weight change: ${client.weightChange > 0 ? "+" : ""}${client.weightChange} lbs`}
                  >
                    {client.weightChange > 0 ? "+" : ""}{client.weightChange}
                  </span>
                )}
              </span>
            )}
            {client.dietCompliance != null && (
              <span>D:{client.dietCompliance}</span>
            )}
            {client.energyLevel != null && (
              <span>E:{client.energyLevel}</span>
            )}
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-block h-2 w-2 rounded-full ${status.dot}`} aria-hidden="true" />
          <span
            className={`text-xs font-medium ${status.text}`}
            aria-label={`Status: ${status.label}`}
          >
            {status.label}
          </span>
        </div>
      </Link>

      {/* Secondary action: Review This Week */}
      {client.weekStatus !== "missing" && (
        <Link
          href={reviewHref}
          className="hidden shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 sm:block dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Review
        </Link>
      )}
    </div>
  );
}
