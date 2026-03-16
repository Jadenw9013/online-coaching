"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";

const CreateTeamSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional(),
});

const UpdateTeamSchema = z.object({
  teamId: z.string().cuid(),
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(300).optional(),
  logoPath: z.string().optional(),
});

const MemberSchema = z.object({
  teamId: z.string().cuid(),
  coachId: z.string().cuid(),
  role: z.enum(["HEAD_COACH", "COACH"]),
});

/** Any coach can create a team; they automatically become HEAD_COACH. */
export async function createTeam(formData: z.infer<typeof CreateTeamSchema>) {
  const user = await getCurrentDbUser();
  if (!user.isCoach) throw new Error("Only coaches can create a team.");

  const data = CreateTeamSchema.parse(formData);
  const baseSlug = data.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const team = await db.team.create({
    data: {
      name: data.name,
      slug: `${baseSlug}-${Date.now()}`,
      description: data.description,
    },
  });

  await db.user.update({
    where: { id: user.id },
    data: { teamId: team.id, teamRole: "HEAD_COACH" },
  });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true, teamId: team.id };
}

/** HEAD_COACH only: update team name, description, or logo path. */
export async function updateTeam(formData: z.infer<typeof UpdateTeamSchema>) {
  const user = await getCurrentDbUser();
  if (user.teamRole !== "HEAD_COACH" || user.teamId !== formData.teamId) {
    throw new Error("Only the head coach can update team details.");
  }

  const data = UpdateTeamSchema.parse(formData);
  await db.team.update({
    where: { id: data.teamId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.logoPath && { logoPath: data.logoPath }),
    },
  });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true };
}

/** HEAD_COACH only: add another coach to the team by userId. */
export async function addCoachToTeam(formData: z.infer<typeof MemberSchema>) {
  const user = await getCurrentDbUser();
  if (user.teamRole !== "HEAD_COACH" || user.teamId !== formData.teamId) {
    throw new Error("Only the head coach can add members.");
  }

  const data = MemberSchema.parse(formData);
  await db.user.update({
    where: { id: data.coachId },
    data: { teamId: data.teamId, teamRole: data.role },
  });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true };
}

/** HEAD_COACH removes a coach, or any coach removes themselves. */
export async function removeFromTeam(coachId: string) {
  const user = await getCurrentDbUser();
  const isSelf = user.id === coachId;
  const isHeadCoach = user.teamRole === "HEAD_COACH";

  if (!isSelf && !isHeadCoach) {
    throw new Error("You don't have permission to remove this coach.");
  }

  await db.user.update({
    where: { id: coachId },
    data: { teamId: null, teamRole: null },
  });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true };
}

// ── Step 3: Team Invite Actions ───────────────────────────────────────────────

/** HEAD_COACH only: generate a shareable team invite link (7-day expiry). */
export async function generateTeamInvite(teamId: string) {
  const user = await getCurrentDbUser();
  if (user.teamRole !== "HEAD_COACH" || user.teamId !== teamId) {
    throw new Error("Only the head coach can generate team invites.");
  }

  // Expire any existing pending invites for this team first
  await db.teamInvite.updateMany({
    where: { teamId, status: "PENDING" },
    data: { status: "EXPIRED" },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await db.teamInvite.create({
    data: { teamId, expiresAt },
    select: { inviteToken: true },
  });

  revalidatePath("/coach/settings");
  return { success: true, token: invite.inviteToken };
}

/** Any authenticated coach can call this to join via a valid token. */
export async function acceptTeamInvite(token: string) {
  const user = await getCurrentDbUser();
  if (!user.isCoach) throw new Error("Only coaches can join a team.");
  if (user.teamId) throw new Error("You are already on a team. Leave your current team first.");

  const invite = await db.teamInvite.findUnique({
    where: { inviteToken: token },
    select: { id: true, teamId: true, status: true, expiresAt: true },
  });

  if (!invite) throw new Error("Invite not found.");
  if (invite.status !== "PENDING") throw new Error("This invite has already been used or expired.");
  if (invite.expiresAt < new Date()) {
    await db.teamInvite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
    throw new Error("This invite link has expired. Ask your head coach to generate a new one.");
  }

  // Join the team as COACH — do NOT mark invite ACCEPTED so others can still use the same link
  await db.user.update({
    where: { id: user.id },
    data: { teamId: invite.teamId, teamRole: "COACH" },
  });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true, teamId: invite.teamId };
}

// ── Polish pass: Dissolve team + transfer leadership ──────────────────────────

/** HEAD_COACH only: removes all members and deletes the team. Irreversible. */
export async function dissolveTeam(teamId: string) {
  const user = await getCurrentDbUser();
  if (user.teamRole !== "HEAD_COACH" || user.teamId !== teamId) {
    throw new Error("Only the head coach can dissolve the team.");
  }

  // Remove all members first
  await db.user.updateMany({
    where: { teamId },
    data: { teamId: null, teamRole: null },
  });

  // Delete the team (cascades to TeamInvite records via onDelete: Cascade)
  await db.team.delete({ where: { id: teamId } });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true };
}

/** HEAD_COACH only: promote another team member to HEAD_COACH, caller becomes COACH. */
export async function transferHeadCoach(teamId: string, newHeadCoachId: string) {
  const user = await getCurrentDbUser();
  if (user.teamRole !== "HEAD_COACH" || user.teamId !== teamId) {
    throw new Error("Only the head coach can transfer leadership.");
  }

  await db.user.update({
    where: { id: newHeadCoachId },
    data: { teamRole: "HEAD_COACH" },
  });

  await db.user.update({
    where: { id: user.id },
    data: { teamRole: "COACH" },
  });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true };
}
