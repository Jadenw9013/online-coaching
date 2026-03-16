export type TeamInfo = {
  id: string;
  name: string;
  slug: string;
  logoPath: string | null;
};

export type CoachTeamData = {
  teamId: string | null;
  teamRole: string | null; // "HEAD_COACH" | "COACH" | null
  team: TeamInfo | null;
};

export type TeamMember = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profilePhotoPath: string | null;
  teamRole: string | null;
};

export type TeamWithMembers = TeamInfo & {
  description: string | null;
  members: TeamMember[];
};
