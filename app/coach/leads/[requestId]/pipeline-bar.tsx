"use client";

const DISPLAY_STAGES = [
    { key: "PENDING", label: "Pending" },
    { key: "CONSULTATION_SCHEDULED", label: "Contacted" },
    { key: "INTAKE_SUBMITTED", label: "Intake" },
    { key: "ACTIVE", label: "Active" },
] as const;

function mapToDisplayIndex(stage: string): number {
    switch (stage) {
        case "PENDING":                return 0;
        case "CONSULTATION_SCHEDULED": return 1;
        case "CONSULTATION_DONE":      return 1;
        case "INTAKE_SENT":            return 1;
        case "INTAKE_SUBMITTED":       return 2;
        case "FORMS_SENT":             return 2;
        case "FORMS_SIGNED":           return 2;
        case "ACTIVE":                 return 3;
        default:                       return 0;
    }
}

export function PipelineBar({ currentStage }: { currentStage: string }) {
    const isDeclined = currentStage === "DECLINED";
    const currentIdx = mapToDisplayIndex(currentStage);

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

    return (
        <nav aria-label="Pipeline progress">
            <div className="flex flex-col gap-2">
                {/* Dots + connector line row */}
                <div className="flex items-center px-1">
                    {DISPLAY_STAGES.map((stage, idx) => {
                        const isCompleted = idx < currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                                {/* Dot */}
                                <div
                                    className={[
                                        "relative z-10 flex shrink-0 items-center justify-center rounded-full transition-all duration-300",
                                        isCompleted
                                            ? "h-7 w-7 bg-emerald-500/[0.18] ring-[1.5px] ring-emerald-500/60"
                                            : isCurrent
                                            ? "h-7 w-7 bg-blue-500/[0.12] ring-2 ring-blue-400"
                                            : "h-7 w-7 bg-white/[0.06] ring-1 ring-white/10",
                                    ].join(" ")}
                                >
                                    {isCompleted ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                                    ) : isCurrent ? (
                                        <span className="text-xs font-bold text-blue-400">{idx + 1}</span>
                                    ) : (
                                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500/35" aria-hidden="true" />
                                    )}
                                </div>

                                {/* Connector line (skip after last) */}
                                {idx < DISPLAY_STAGES.length - 1 && (
                                    <div
                                        className={[
                                            "h-0.5 flex-1 mx-0.5 rounded-full transition-colors duration-300",
                                            idx < currentIdx
                                                ? "bg-emerald-500/40"
                                                : "bg-white/[0.08]",
                                        ].join(" ")}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Labels row */}
                <div className="flex items-start px-0">
                    {DISPLAY_STAGES.map((stage, idx) => {
                        const isCompleted = idx < currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                            <div key={stage.key} className="flex-1 text-center last:flex-none last:w-[28px]">
                                <span
                                    className={[
                                        "text-xs font-medium leading-tight",
                                        isCompleted
                                            ? "text-emerald-400"
                                            : isCurrent
                                            ? "font-bold text-blue-400"
                                            : "text-zinc-500",
                                    ].join(" ")}
                                >
                                    {stage.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
