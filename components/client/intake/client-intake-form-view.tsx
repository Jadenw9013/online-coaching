"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { saveClientIntakeDraft } from "@/app/actions/intake";
import Link from "next/link";
import type { IntakeFormSection, IntakeAnswersShape } from "@/lib/intake-form-defaults";

type Props = {
    requestId: string;
    coachName: string;
    existingAnswers: Record<string, unknown> | null;
    sections: IntakeFormSection[];
};

type SaveState = "idle" | "saving" | "saved" | "error";

const SECTION_ICONS = [
    <svg key="1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    <svg key="2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
    <svg key="3" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    <svg key="4" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>,
];

export function ClientIntakeFormView({ requestId, coachName, existingAnswers, sections }: Props) {
    const [answers, setAnswers] = useState<Record<string, string>>(() => {
        const flat: Record<string, string> = {};
        const existing = existingAnswers as IntakeAnswersShape | null;
        if (existing?.sections) {
            for (const sec of existing.sections) {
                for (const a of sec.answers) flat[a.questionId] = a.value;
            }
        } else if (existingAnswers && typeof existingAnswers === "object") {
            Object.entries(existingAnswers).forEach(([k, v]) => { if (typeof v === "string") flat[k] = v; });
        }
        return flat;
    });

    const [saveState, setSaveState] = useState<SaveState>("idle");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const buildAnswersShape = useCallback((): IntakeAnswersShape => ({
        sections: sections.map((sec) => ({
            sectionId: sec.id, sectionTitle: sec.title,
            answers: sec.questions.map((q) => ({ questionId: q.id, questionLabel: q.label, value: answers[q.id] ?? "" })),
        })),
        _savedAt: Date.now(),
    }), [sections, answers]);

    const doSave = useCallback(async () => {
        setSaveState("saving");
        try {
            const shape = buildAnswersShape();
            await saveClientIntakeDraft({ requestId, answers: shape as unknown as Record<string, unknown> });
            setSaveState("saved");
            setTimeout(() => setSaveState("idle"), 2500);
        } catch {
            setSaveState("error");
            setTimeout(() => setSaveState("idle"), 3000);
        }
    }, [requestId, buildAnswersShape]);

    const scheduleAutoSave = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => doSave(), 800);
    }, [doSave]);

    const set = (qId: string, value: string) => { setAnswers(p => ({ ...p, [qId]: value })); scheduleAutoSave(); };

    const filledCount = useMemo(() => sections.flatMap(s => s.questions).filter(q => answers[q.id]?.trim()).length, [sections, answers]);
    const totalCount = useMemo(() => sections.flatMap(s => s.questions).length, [sections]);
    const progressPct = totalCount ? Math.round((filledCount / totalCount) * 100) : 0;

    return (
        <div className="space-y-5">
            {/* ── Sticky header ── */}
            <div className="sticky top-0 z-20 -mx-4 bg-[#0a0f1e]/95 backdrop-blur-xl px-4 pt-3 pb-2 border-b border-white/[0.04]">
                <div className="flex items-center justify-between gap-4 mb-2">
                    <Link href="/client" className="group flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5"><path d="M15 18l-6-6 6-6"/></svg>
                        Dashboard
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-xs tabular-nums text-zinc-500">{filledCount}/{totalCount}</span>
                        <span className={`text-xs font-medium transition-colors ${
                            saveState === "saving" ? "text-amber-400" :
                            saveState === "saved" ? "text-emerald-400" :
                            saveState === "error" ? "text-red-400" : "text-transparent"
                        }`}>
                            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved" : saveState === "error" ? "Failed" : "·"}
                        </span>
                    </div>
                </div>
                <div className="h-[3px] w-full rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
                </div>
            </div>

            {/* ── Title ── */}
            <div className="pt-1">
                <h1 className="text-[22px] font-bold tracking-tight text-zinc-100">Intake Form</h1>
                <p className="text-sm text-zinc-500 mt-0.5">For {coachName} · Auto-saves as you type</p>
            </div>

            {/* ── Sections ── */}
            {sections.map((section, sIdx) => (
                <section key={section.id} className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent overflow-hidden">
                    <div className="px-5 pt-5 pb-4 border-b border-white/[0.04]">
                        <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                                {SECTION_ICONS[sIdx] ?? <span className="text-xs font-bold">{sIdx + 1}</span>}
                            </span>
                            <div>
                                <h2 className="text-base font-semibold text-zinc-100">{section.title}</h2>
                                {section.description && <p className="text-[13px] text-zinc-500 mt-0.5">{section.description}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="px-5 py-4 space-y-5">
                        {section.questions.map((q) => {
                            const filled = !!answers[q.id]?.trim();
                            return (
                                <div key={q.id} className="space-y-1.5">
                                    <label htmlFor={`q-${q.id}`} className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                                        {filled && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0"><path d="M20 6 9 17l-5-5"/></svg>}
                                        {q.label}
                                        {q.required && <span className="text-red-400/80 text-xs">*</span>}
                                    </label>
                                    {q.type === "long_text" ? (
                                        <textarea id={`q-${q.id}`} rows={3} value={answers[q.id] ?? ""} onChange={e => set(q.id, e.target.value)} placeholder={q.placeholder}
                                            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[15px] text-zinc-100 placeholder-zinc-600 transition-all focus:border-blue-500/40 focus:bg-blue-500/[0.02] focus:outline-none focus:ring-2 focus:ring-blue-500/15 resize-y"
                                            style={{ fontSize: "max(15px, 16px)", minHeight: "76px" }} />
                                    ) : (
                                        <input id={`q-${q.id}`} type="text" value={answers[q.id] ?? ""} onChange={e => set(q.id, e.target.value)} placeholder={q.placeholder}
                                            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[15px] text-zinc-100 placeholder-zinc-600 transition-all focus:border-blue-500/40 focus:bg-blue-500/[0.02] focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                                            style={{ fontSize: "max(15px, 16px)", minHeight: "48px" }} />
                                    )}
                                    {q.helperText && <p className="text-xs text-zinc-600 pl-1">{q.helperText}</p>}
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}

            {/* ── Done card ── */}
            <section className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent overflow-hidden">
                <div className="px-5 py-8 text-center space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 ring-1 ring-emerald-500/15">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M20 6 9 17l-5-5" /></svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-200">Your answers are saved automatically</p>
                        <p className="text-[13px] text-zinc-500 mt-1">Your coach can see your responses in real-time.</p>
                    </div>
                    <Link href="/client" className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800/80 border border-white/[0.06] px-6 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                        Back to Dashboard
                    </Link>
                </div>
            </section>

            <div className="h-6" />
        </div>
    );
}
