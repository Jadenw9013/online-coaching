"use client";

import { useState } from "react";
import { cancelCoachingRequest } from "@/app/actions/coaching-requests";
import Link from "next/link";

type Request = {
    id: string;
    status: string;
    consultationStage: string;
    createdAt: Date;
    coachProfile: {
        slug: string;
        user: {
            firstName: string | null;
            lastName: string | null;
        };
    };
};

export function MyRequestsCard({ requests }: { requests: Request[] }) {
    const [cancelingId, setCancelingId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (requests.length === 0) return null;

    const active = requests.filter((r) => r.status === "PENDING" || r.status === "WAITLISTED");
    const past = requests.filter((r) => r.status === "APPROVED" || r.status === "REJECTED");

    async function handleCancel(id: string) {
        if (confirmId !== id) { setConfirmId(id); return; }
        setCancelingId(id);
        setError(null);
        try {
            await cancelCoachingRequest(id);
            setConfirmId(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to cancel.");
        } finally { setCancelingId(null); }
    }

    const statusBadge = (status: string) => {
        const styles: Record<string, { bg: string; dot: string; text: string; label: string }> = {
            PENDING:    { bg: "bg-amber-500/10", dot: "bg-amber-400", text: "text-amber-400", label: "Pending" },
            WAITLISTED: { bg: "bg-blue-500/10",  dot: "bg-blue-400",  text: "text-blue-400",  label: "Waitlisted" },
            APPROVED:   { bg: "bg-emerald-500/10", dot: "bg-emerald-400", text: "text-emerald-400", label: "Accepted" },
            REJECTED:   { bg: "bg-zinc-500/10", dot: "bg-zinc-500", text: "text-zinc-500", label: "Declined" },
        };
        const s = styles[status];
        if (!s) return null;
        return (
            <span className={`inline-flex items-center gap-1.5 rounded-full ${s.bg} px-2.5 py-0.5 text-xs font-medium ${s.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                {s.label}
            </span>
        );
    };

    const formatDate = (d: Date) =>
        new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return (
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-5">
            <h2 className="text-sm font-semibold text-zinc-100">Your Coaching Requests</h2>

            {error && (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-500/15 bg-red-500/[0.04] px-3 py-2.5 text-sm text-red-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                    {error}
                </div>
            )}

            {active.length > 0 && (
                <div className="mt-4 space-y-3">
                    {active.map((req) => {
                        const coachName = `${req.coachProfile.user.firstName ?? ""} ${req.coachProfile.user.lastName ?? ""}`.trim() || "Coach";
                        return (
                            <div key={req.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                                <div className="flex items-center justify-between gap-3 px-4 py-3">
                                    <div className="min-w-0">
                                        <Link href={`/coaches/${req.coachProfile.slug}`} className="text-sm font-medium text-zinc-200 hover:text-blue-400 transition-colors">
                                            {coachName}
                                        </Link>
                                        <div className="mt-1 flex items-center gap-2">
                                            {statusBadge(req.status)}
                                            <span className="text-[11px] text-zinc-600">{formatDate(req.createdAt)}</span>
                                        </div>
                                    </div>
                                    {req.status === "PENDING" && (
                                        <button
                                            onClick={() => handleCancel(req.id)}
                                            disabled={cancelingId !== null}
                                            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                                                confirmId === req.id
                                                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                                            }`}
                                        >
                                            {cancelingId === req.id ? "Canceling…" : confirmId === req.id ? "Confirm" : "Cancel"}
                                        </button>
                                    )}
                                </div>
                                {/* Intake Form CTA */}
                                <div className="border-t border-white/[0.04] px-4 py-3">
                                    <Link
                                        href={`/client/intake/${req.id}`}
                                        className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/15 hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/25 transition-all active:scale-[0.98]"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                                        Fill Out Intake Form
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {past.length > 0 && (
                <div className="mt-5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">Past</p>
                    <div className="space-y-2">
                        {past.slice(0, 3).map((req) => {
                            const coachName = `${req.coachProfile.user.firstName ?? ""} ${req.coachProfile.user.lastName ?? ""}`.trim() || "Coach";
                            return (
                                <div key={req.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 bg-white/[0.01]">
                                    <Link href={`/coaches/${req.coachProfile.slug}`} className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                                        {coachName}
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        {statusBadge(req.status)}
                                        <span className="text-[11px] text-zinc-600">{formatDate(req.createdAt)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
