import Image from "next/image";

type TeamBadgeProps = {
  teamName: string;
  logoPath?: string | null;
  role?: string | null; // "HEAD_COACH" | "COACH" | null
  showRole?: boolean; // default false — only true on coach/marketplace surfaces
  size?: "sm" | "md"; // default "md"
};

const ROLE_LABELS: Record<string, string> = {
  HEAD_COACH: "Head Coach",
  COACH: "Coach",
};

export function TeamBadge({
  teamName,
  logoPath,
  role,
  showRole = false,
  size = "md",
}: TeamBadgeProps) {
  if (!teamName) return null;

  const isSm = size === "sm";

  return (
    <div className={`inline-flex flex-wrap items-center ${isSm ? "gap-1.5" : "gap-2"}`}>
      {/* Team pill */}
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 backdrop-blur-sm ${
          isSm ? "px-2 py-0.5" : "px-3 py-1"
        }`}
      >
        {/* Logo or placeholder icon */}
        <div
          className={`shrink-0 overflow-hidden rounded ${isSm ? "h-3.5 w-3.5" : "h-4 w-4"}`}
        >
          {logoPath ? (
            <Image
              src={logoPath}
              alt={`${teamName} logo`}
              width={isSm ? 14 : 16}
              height={isSm ? 14 : 16}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded bg-blue-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-blue-400 ${isSm ? "h-2 w-2" : "h-2.5 w-2.5"}`}
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          )}
        </div>

        {/* Team name — Chakra Petch (heading font via font-display) */}
        <span
          className={`font-display font-semibold tracking-tight text-blue-300 ${
            isSm ? "text-xs" : "text-sm"
          }`}
        >
          {teamName}
        </span>
      </div>

      {/* Role pill — only when showRole is true and a known role is set */}
      {showRole && role && ROLE_LABELS[role] && (
        <span
          className={`rounded-full font-medium ${
            role === "HEAD_COACH"
              ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
              : "bg-zinc-700/60 text-zinc-400 ring-1 ring-zinc-600/40"
          } ${isSm ? "px-1.5 py-0.5 text-xs" : "px-2.5 py-0.5 text-xs"}`}
        >
          {ROLE_LABELS[role]}
        </span>
      )}
    </div>
  );
}
