"use client";

const STAGES = [
    { key: "PENDING", label: "Pending" },
    { key: "CONSULTATION_SCHEDULED", label: "Consultation" },
    { key: "INTAKE_SENT", label: "Intake Sent" },
    { key: "INTAKE_SUBMITTED", label: "Intake Received" },
    { key: "ACTIVE", label: "Active" },
] as const;

function stageIndex(key: string): number {
    return STAGES.findIndex((s) => s.key === key);
}

export function PipelineBar({ currentStage }: { currentStage: string }) {
    const currentIdx = stageIndex(currentStage);
    const isDeclined = currentStage === "DECLINED";

    const displayIdx = currentIdx >= 0 ? currentIdx : (() => {
        if (currentStage === "CONSULTATION_DONE") return stageIndex("CONSULTATION_SCHEDULED");
        if (currentStage === "FORMS_SENT") return stageIndex("INTAKE_SENT");
        if (currentStage === "FORMS_SIGNED") return stageIndex("INTAKE_SUBMITTED");
        return 0;
    })();

    if (isDeclined) {
        return (
            <div
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-3"
                role="status"
                aria-label="Pipeline stage: Inactive"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                <span className="text-sm font-medium text-zinc-500">Inactive</span>
            </div>
        );
    }

    // Progress fill: percentage of the track that is complete (0–100)
    const fillPct = STAGES.length > 1 ? (displayIdx / (STAGES.length - 1)) * 100 : 0;

    return (
        <nav aria-label="Pipeline progress" className="overflow-x-auto scrollbar-none">
            {/* min-w keeps labels readable on small screens */}
            <ol className="relative flex min-w-[440px] items-start justify-between pt-1 pb-0.5">

                {/* ── Horizontal track ─────────────────────────────────────────────
                    The track spans from the center of the first dot to the center of
                    the last dot. With 5 equal-width flex-1 items and justify-between,
                    each item center is at: (2i+1) / (2*N) × 100% of the total width.
                    So first center ≈ 10%, last center ≈ 90%.
                ─────────────────────────────────────────────────────────────────── */}
                <div
                    className="pointer-events-none absolute left-[10%] right-[10%] top-[19px] h-px bg-zinc-800"
                    aria-hidden="true"
                >
                    {/* Filled portion — emerald → blue gradient */}
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500/50 via-blue-500/40 to-blue-500/40 transition-[width] duration-700 ease-out"
                        style={{ width: `${fillPct}%` }}
                    />
                </div>

                {STAGES.map((stage, idx) => {
                    const isCompleted = idx < displayIdx;
                    const isCurrent = idx === displayIdx;
                    // Pulse on the "Active" step when one step away (about to be activated)
                    const isPulsingNext = idx > displayIdx && stage.key === "ACTIVE" && displayIdx === STAGES.length - 2;

                    return (
                        <li
                            key={stage.key}
                            className="relative flex flex-1 flex-col items-center gap-2"
                            aria-current={isCurrent ? "step" : undefined}
                            aria-label={`${stage.label}${isCompleted ? " (completed)" : isCurrent ? " (current)" : " (upcoming)"}`}
                        >
                            {/* ── Step dot ────────────────────────────────── */}
                            <div
                                className={[
                                    "relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full transition-all duration-300",
                                    isCompleted
                                        ? "bg-emerald-500/10 ring-1 ring-emerald-500/40 text-emerald-400"
                                        : isCurrent
                                        ? "bg-blue-600/20 ring-2 ring-blue-500/70 text-blue-400 shadow-[0_0_14px_rgba(37,99,235,0.3)]"
                                        : isPulsingNext
                                        ? "bg-blue-500/5 ring-1 ring-blue-500/30 text-blue-500/50"
                                        : "bg-zinc-900 ring-1 ring-zinc-800 text-zinc-700",
                                ].join(" ")}
                            >
                                {isCompleted ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                                ) : isCurrent ? (
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-400" aria-hidden="true" />
                                ) : isPulsingNext ? (
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400/60" aria-hidden="true" />
                                ) : (
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" aria-hidden="true" />
                                )}
                            </div>

                            {/* ── Label ───────────────────────────────────── */}
                            <span
                                className={[
                                    "whitespace-nowrap text-center text-[11px] font-medium leading-tight",
                                    isCompleted
                                        ? "text-emerald-400/60"
                                        : isCurrent
                                        ? "text-blue-300"
                                        : "text-zinc-600",
                                ].join(" ")}
                            >
                                {stage.label}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
