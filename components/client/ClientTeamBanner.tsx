import { getClientCoachTeamInfo } from "@/lib/queries/teams";
import { TeamBadge } from "@/components/ui/TeamBadge";

interface ClientTeamBannerProps {
  clientId: string;
}

/**
 * Server component — fetches the client's coach's team info and renders a
 * subtle banner. Returns null silently if the coach has no team.
 */
export async function ClientTeamBanner({ clientId }: ClientTeamBannerProps) {
  const teamData = await getClientCoachTeamInfo(clientId);

  if (!teamData?.team) return null;

  return (
    <div className="animate-fade-in rounded-xl border border-blue-500/15 bg-blue-500/[0.06] px-4 py-3">
      <div className="flex items-center gap-3">
        <TeamBadge
          teamName={teamData.team.name}
          logoPath={teamData.team.logoPath}
          showRole={false}
          size="sm"
        />
        <p className="text-xs text-zinc-400">
          Your coaching is provided through{" "}
          <span className="font-medium text-zinc-300">{teamData.team.name}</span>.
        </p>
      </div>
    </div>
  );
}
