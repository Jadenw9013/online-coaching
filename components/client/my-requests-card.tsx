"use client";

import { useState } from "react";
import { cancelCoachingRequest } from "@/app/actions/coaching-requests";
import Link from "next/link";

type Request = {
    id: string;
    status: string;
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
        if (confirmId !== id) {
            setConfirmId(id);
            return;
        }
        setCancelingId(id);
        setError(null);
        try {
            await cancelCoachingRequest(id);
            setConfirmId(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to cancel.");
        } finally {
            setCancelingId(null);
        }
    }

    const statusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Pending
                    </span>
                );
            case "WAITLISTED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Waitlisted
                    </span>
                );
            case "APPROVED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        Accepted
                    </span>
                );
            case "REJECTED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-500/20 dark:text-zinc-400">
                        Declined
                    </span>
                );
            default:
                return null;
        }
    };

    const formatDate = (d: Date) =>
        new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return (
        <div className="rounded-2xl border border-zinc-200/80 bg-white px-5 py-5 dark:border-zinc-800/80 dark:bg-[#0a1224]">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Your Coaching Requests</h2>

            {error && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                    {error}
                </div>
            )}

            {active.length > 0 && (
                <div className="mt-4 space-y-3">
                    {active.map((req) => {
                        const coachName = `${req.coachProfile.user.firstName ?? ""} ${req.coachProfile.user.lastName ?? ""}`.trim() || "Coach";
                        return (
                            <div key={req.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                                <div className="min-w-0">
                                    <Link
                                        href={`/coaches/${req.coachProfile.slug}`}
                                        className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                                    >
                                        {coachName}
                                    </Link>
                                    <div className="mt-0.5 flex items-center gap-2">
                                        {statusBadge(req.status)}
                                        <span className="text-[11px] text-zinc-400">{formatDate(req.createdAt)}</span>
                                    </div>
                                </div>
                                {req.status === "PENDING" && (
                                    <button
                                        onClick={() => handleCancel(req.id)}
                                        disabled={cancelingId !== null}
                                        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                                            confirmId === req.id
                                                ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                        }`}
                                    >
                                        {cancelingId === req.id ? "Canceling..." : confirmId === req.id ? "Confirm Cancel" : "Cancel"}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {past.length > 0 && (
                <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">Past</p>
                    <div className="space-y-2">
                        {past.slice(0, 3).map((req) => {
                            const coachName = `${req.coachProfile.user.firstName ?? ""} ${req.coachProfile.user.lastName ?? ""}`.trim() || "Coach";
                            return (
                                <div key={req.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2">
                                    <div className="min-w-0">
                                        <Link
                                            href={`/coaches/${req.coachProfile.slug}`}
                                            className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
                                        >
                                            {coachName}
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {statusBadge(req.status)}
                                        <span className="text-[11px] text-zinc-400">{formatDate(req.createdAt)}</span>
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
