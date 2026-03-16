"use client";

import { useState, useTransition } from "react";
import { TeamBadge } from "@/components/ui/TeamBadge";
import {
  createTeam,
  updateTeam,
  addCoachToTeam,
  removeFromTeam,
  generateTeamInvite,
  dissolveTeam,
  transferHeadCoach,
} from "@/app/actions/teams";
import type { TeamWithMembers } from "@/types/team";
import Link from "next/link";

interface TeamSectionProps {
  user: {
    id: string;
    teamId: string | null;
    teamRole: string | null;
  };
  teamData: TeamWithMembers | null;
  activeInvite?: { inviteToken: string; expiresAt: Date } | null;
  /** Set to true when redirected from ?joined=true to show a success banner. */
  justJoined?: boolean;
}

const APP_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "";

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="border-t border-white/[0.06]" />;
}

function formatExpiry(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TeamSection({ user, teamData, activeInvite, justJoined }: TeamSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // State A: create form
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createdTeamSlug, setCreatedTeamSlug] = useState<string | null>(null);

  // State B identity: inline edit
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState(teamData?.name ?? "");
  const [editDesc, setEditDesc] = useState(teamData?.description ?? "");

  // State B members
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmTransferId, setConfirmTransferId] = useState<string | null>(null);

  // State B invite
  const [inviteToken, setInviteToken] = useState<string | null>(activeInvite?.inviteToken ?? null);
  const [inviteExpiry, setInviteExpiry] = useState<Date | null>(activeInvite?.expiresAt ? new Date(activeInvite.expiresAt) : null);
  const [copiedLink, setCopiedLink] = useState(false);

  // State B COACH leave
  const [confirmLeave, setConfirmLeave] = useState(false);

  // State B danger zone
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [showTransferSelector, setShowTransferSelector] = useState(false);
  const [dissolveText, setDissolveText] = useState("");
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);

  const inviteUrl = inviteToken ? `${APP_URL}/invite/team/${inviteToken}` : null;

  function flash(msg: string, type: "success" | "error") {
    if (type === "success") { setSuccessMsg(msg); setError(null); }
    else { setError(msg); setSuccessMsg(null); }
    setTimeout(() => { setSuccessMsg(null); setError(null); }, 5000);
  }

  function copyInviteLink() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  }

  // ── Flash bar ─────────────────────────────────────────────────────────────
  const flashBar = (error || successMsg) && (
    <div className={`rounded-xl px-4 py-3 text-sm font-medium ${error ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
      {error ?? successMsg}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // STATE A — No team
  // ══════════════════════════════════════════════════════════════════
  if (!teamData) {
    return (
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-100">Team</h2>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
            Create a team to group coaches under a shared brand on your public profile.
            Clients will see your team affiliation on your coaching card.
          </p>
        </div>

        {/* Preview hint */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <p className="mb-2 text-xs text-zinc-500">Preview — how your badge will appear on your card:</p>
          <TeamBadge teamName="Your Team" logoPath={null} role={null} showRole={false} size="sm" />
        </div>

        {flashBar}

        {/* Post-creation success state */}
        {createdTeamSlug ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-lg">✓</span>
              <p className="text-sm font-semibold text-emerald-300">Team created!</p>
            </div>
            <p className="text-xs text-emerald-400/80">
              Your team badge is now visible on your public profile.
            </p>
            <Link
              href={`/coaches/${createdTeamSlug}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition"
            >
              Preview your public profile →
            </Link>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                try {
                  await createTeam({ name: createName, description: createDesc || undefined });
                  // Optimistically show success — slug will be derived from name
                  const slug = createName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                  setCreatedTeamSlug(slug);
                  flash("Team created!", "success");
                } catch (err) {
                  flash(err instanceof Error ? err.message : "Failed to create team", "error");
                }
              });
            }}
          >
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Team Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Apex Performance"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Description <span className="text-zinc-600 font-normal">(optional)</span>
              </label>
              <textarea
                maxLength={300}
                rows={2}
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Briefly describe your team…"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !createName.trim()}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create Team"}
            </button>
          </form>
        )}
      </section>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // STATE B — On a team
  // ══════════════════════════════════════════════════════════════════
  const isHeadCoach = user.teamRole === "HEAD_COACH";
  const otherMembers = teamData.members.filter((m) => m.id !== user.id);

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">

      {/* ── Just-joined success banner ── */}
      {justJoined && (
        <div className="flex items-start gap-3 bg-emerald-500/[0.08] border-b border-emerald-500/20 px-6 py-4">
          <span className="text-emerald-400 text-xl mt-0.5">✓</span>
          <div>
            <p className="text-sm font-semibold text-emerald-300">You&apos;ve joined {teamData.name}!</p>
            <p className="text-xs text-emerald-400/80 mt-0.5">Your team badge is now visible on your public profile.</p>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {flashBar}

        {/* ── SUBSECTION 1: Team Identity ── */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <TeamBadge
                teamName={editingName ? (editName || teamData.name) : teamData.name}
                logoPath={teamData.logoPath}
                role={user.teamRole}
                showRole={true}
                size="md"
              />
              {!editingName && teamData.description && (
                <p className="text-sm text-zinc-400 leading-relaxed">{teamData.description}</p>
              )}
            </div>
            {isHeadCoach && !editingName && (
              <button
                onClick={() => { setEditingName(true); setEditName(teamData.name); setEditDesc(teamData.description ?? ""); }}
                className="shrink-0 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
                title="Edit team details"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
            )}
          </div>

          {/* Inline edit form (HEAD_COACH) */}
          {isHeadCoach && editingName && (
            <form
              className="space-y-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4"
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  try {
                    await updateTeam({ teamId: teamData.id, name: editName, description: editDesc });
                    setEditingName(false);
                    flash("Team updated!", "success");
                  } catch (err) {
                    flash(err instanceof Error ? err.message : "Failed to update", "error");
                  }
                });
              }}
            >
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Team name"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              />
              <textarea
                maxLength={300}
                rows={2}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Team description (optional)…"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending || !editName.trim()}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <Divider />

        {/* ── SUBSECTION 2: Members ── */}
        <div>
          <SectionLabel>Members ({teamData.members.length})</SectionLabel>

          {isHeadCoach && otherMembers.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">No other coaches yet — invite one below.</p>
          ) : (
            <ul className="space-y-2">
              {teamData.members.map((member) => (
                <li key={member.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                        {member.firstName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">
                          {member.firstName} {member.lastName}
                          {member.id === user.id && (
                            <span className="ml-1.5 text-xs text-zinc-500">(you)</span>
                          )}
                        </p>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${member.teamRole === "HEAD_COACH" ? "bg-amber-500/15 text-amber-300" : "bg-zinc-700/60 text-zinc-400"}`}>
                          {member.teamRole === "HEAD_COACH" ? "Head Coach" : "Coach"}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons — HEAD_COACH only, not for self */}
                    {isHeadCoach && member.id !== user.id && (
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Transfer */}
                        {confirmTransferId === member.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-zinc-400">Make head coach?</span>
                            <button
                              disabled={isPending}
                              onClick={() => startTransition(async () => {
                                try {
                                  await transferHeadCoach(teamData.id, member.id);
                                  setConfirmTransferId(null);
                                  flash(`${member.firstName} is now Head Coach.`, "success");
                                } catch (err) {
                                  flash(err instanceof Error ? err.message : "Failed to transfer", "error");
                                  setConfirmTransferId(null);
                                }
                              })}
                              className="text-xs font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button onClick={() => setConfirmTransferId(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmTransferId(member.id)}
                            className="text-xs font-medium text-zinc-500 transition hover:text-amber-400"
                            title="Transfer Head Coach role"
                          >
                            Promote
                          </button>
                        )}

                        {/* Remove */}
                        {confirmRemoveId === member.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-zinc-400">Remove?</span>
                            <button
                              disabled={isPending}
                              onClick={() => startTransition(async () => {
                                try {
                                  await removeFromTeam(member.id);
                                  setConfirmRemoveId(null);
                                  flash(`${member.firstName} removed.`, "success");
                                } catch (err) {
                                  flash(err instanceof Error ? err.message : "Failed to remove", "error");
                                  setConfirmRemoveId(null);
                                }
                              })}
                              className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button onClick={() => setConfirmRemoveId(null)} className="text-xs text-zinc-500 hover:text-zinc-300">No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRemoveId(member.id)}
                            className="text-xs font-medium text-zinc-500 transition hover:text-red-400"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── SUBSECTION 3: Invite link (HEAD_COACH only) ── */}
        {isHeadCoach && (
          <>
            <Divider />
            <div>
              <SectionLabel>Invite a Coach</SectionLabel>

              {inviteUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-3 py-2">
                    <input
                      readOnly
                      value={inviteUrl}
                      className="flex-1 bg-transparent font-mono text-xs text-blue-300 outline-none truncate"
                    />
                    <button
                      onClick={copyInviteLink}
                      className="shrink-0 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20"
                    >
                      {copiedLink ? "Copied!" : "Copy"}
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => startTransition(async () => {
                        try {
                          const result = await generateTeamInvite(teamData.id);
                          if (result.success) {
                            setInviteToken(result.token);
                            const exp = new Date();
                            exp.setDate(exp.getDate() + 7);
                            setInviteExpiry(exp);
                          }
                          flash("New invite link generated.", "success");
                        } catch (err) {
                          flash(err instanceof Error ? err.message : "Failed to generate invite", "error");
                        }
                      })}
                      className="shrink-0 rounded-lg border border-white/10 px-3 py-1 text-xs font-medium text-zinc-400 transition hover:border-white/20 hover:text-zinc-200 disabled:opacity-40"
                    >
                      {isPending ? "…" : "Regenerate"}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {inviteExpiry ? `Expires ${formatExpiry(inviteExpiry)}` : "Expires in 7 days"} · Regenerating invalidates the previous link.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">Share a link so any coach can join your team directly.</p>
                  <button
                    disabled={isPending}
                    onClick={() => startTransition(async () => {
                      try {
                        const result = await generateTeamInvite(teamData.id);
                        if (result.success) {
                          setInviteToken(result.token);
                          const exp = new Date();
                          exp.setDate(exp.getDate() + 7);
                          setInviteExpiry(exp);
                        }
                        flash("Invite link generated!", "success");
                      } catch (err) {
                        flash(err instanceof Error ? err.message : "Failed to generate invite", "error");
                      }
                    })}
                    className="rounded-xl border border-blue-500/20 bg-blue-500/[0.08] px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/15 disabled:opacity-50"
                  >
                    {isPending ? "Generating…" : "Generate invite link"}
                  </button>
                </div>
              )}

              {/* Add coach by ID */}
              <div className="mt-4">
                <p className="mb-2 text-xs text-zinc-600">Or add a coach directly by their account ID:</p>
                <form
                  className="flex flex-col gap-2 sm:flex-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = (form.elements.namedItem("coachId") as HTMLInputElement).value.trim();
                    if (!input) return;
                    startTransition(async () => {
                      try {
                        await addCoachToTeam({ teamId: teamData.id, coachId: input, role: "COACH" });
                        (form.elements.namedItem("coachId") as HTMLInputElement).value = "";
                        flash("Coach added to team!", "success");
                      } catch (err) {
                        flash(err instanceof Error ? err.message : "Failed to add coach", "error");
                      }
                    });
                  }}
                >
                  <input
                    name="coachId"
                    type="text"
                    placeholder="Coach user ID (cuid)"
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.10] disabled:opacity-50"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>

            {/* ── SUBSECTION 4: Danger Zone ── */}
            <Divider />
            <div>
              {!showDangerZone ? (
                <button
                  onClick={() => setShowDangerZone(true)}
                  className="text-xs font-medium text-zinc-600 transition hover:text-red-400"
                >
                  Danger zone ↓
                </button>
              ) : (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-red-400/70">Danger Zone</p>

                  {/* Transfer leadership */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Transfer leadership</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Promote another coach to Head Coach. You&apos;ll become a regular Coach.</p>
                    </div>
                    {otherMembers.length === 0 ? (
                      <p className="text-xs text-zinc-600 italic">No other members to transfer to.</p>
                    ) : !showTransferSelector ? (
                      <button
                        onClick={() => setShowTransferSelector(true)}
                        className="rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/15"
                      >
                        Transfer leadership…
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-400">Select the new Head Coach:</p>
                        <div className="space-y-1">
                          {otherMembers.map((m) => (
                            <button
                              key={m.id}
                              disabled={isPending}
                              onClick={() => {
                                if (!window.confirm(`Promote ${m.firstName} ${m.lastName} to Head Coach? You will become a Coach.`)) return;
                                startTransition(async () => {
                                  try {
                                    await transferHeadCoach(teamData.id, m.id);
                                    flash(`${m.firstName} is now Head Coach.`, "success");
                                    setShowTransferSelector(false);
                                    setShowDangerZone(false);
                                  } catch (err) {
                                    flash(err instanceof Error ? err.message : "Transfer failed", "error");
                                  }
                                });
                              }}
                              className="w-full flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-left transition hover:border-amber-500/30 hover:bg-amber-500/[0.06] disabled:opacity-50"
                            >
                              <div className="h-7 w-7 shrink-0 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                {m.firstName?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <span className="text-sm text-zinc-200">{m.firstName} {m.lastName}</span>
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setShowTransferSelector(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-red-500/10" />

                  {/* Dissolve team */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Dissolve team</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Permanently removes all members and deletes the team. This cannot be undone.</p>
                    </div>
                    {!showDissolveConfirm ? (
                      <button
                        onClick={() => setShowDissolveConfirm(true)}
                        className="rounded-xl border border-red-500/30 bg-red-500/[0.08] px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/15"
                      >
                        Dissolve team…
                      </button>
                    ) : (
                      <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/[0.06] p-4">
                        <p className="text-xs text-red-400">
                          Type <span className="font-mono font-bold">{teamData.name}</span> to confirm:
                        </p>
                        <input
                          type="text"
                          value={dissolveText}
                          onChange={(e) => setDissolveText(e.target.value)}
                          placeholder={teamData.name}
                          className="w-full rounded-xl border border-red-500/30 bg-black/20 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-red-500/60"
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={isPending || dissolveText !== teamData.name}
                            onClick={() => startTransition(async () => {
                              try {
                                await dissolveTeam(teamData.id);
                                flash("Team dissolved.", "success");
                              } catch (err) {
                                flash(err instanceof Error ? err.message : "Failed to dissolve", "error");
                              }
                            })}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isPending ? "Dissolving…" : "Dissolve permanently"}
                          </button>
                          <button
                            onClick={() => { setShowDissolveConfirm(false); setDissolveText(""); }}
                            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={() => setShowDangerZone(false)} className="text-xs text-zinc-600 hover:text-zinc-400">Hide danger zone ↑</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── COACH role: read-only members + leave button ── */}
        {!isHeadCoach && (
          <>
            <Divider />
            <div>
              <SectionLabel>Your Team Members</SectionLabel>
              <ul className="space-y-2 mb-4">
                {teamData.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                      {m.firstName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {m.firstName} {m.lastName}
                        {m.id === user.id && <span className="ml-1.5 text-xs text-zinc-500">(you)</span>}
                      </p>
                      <span className={`text-xs ${m.teamRole === "HEAD_COACH" ? "text-amber-400" : "text-zinc-500"}`}>
                        {m.teamRole === "HEAD_COACH" ? "Head Coach" : "Coach"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {!confirmLeave ? (
                <button
                  onClick={() => setConfirmLeave(true)}
                  className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                >
                  Leave Team
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
                  <p className="text-sm text-zinc-300 flex-1">Leave {teamData.name}?</p>
                  <button
                    disabled={isPending}
                    onClick={() => startTransition(async () => {
                      try {
                        await removeFromTeam(user.id);
                        flash("You have left the team.", "success");
                        setConfirmLeave(false);
                      } catch (err) {
                        flash(err instanceof Error ? err.message : "Failed to leave", "error");
                        setConfirmLeave(false);
                      }
                    })}
                    className="text-sm font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {isPending ? "Leaving…" : "Yes, leave"}
                  </button>
                  <button onClick={() => setConfirmLeave(false)} className="text-sm text-zinc-500 hover:text-zinc-300">Cancel</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
