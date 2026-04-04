"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { saveIntakeDraft, markIntakeReadyToSend, sendFormsForSignature } from "@/app/actions/intake";
import Link from "next/link";
import type { IntakeFormSection, IntakeAnswersShape } from "@/lib/intake-form-defaults";

type Props = {
    requestId: string;
    prospectName: string;
    prospectEmail: string | null;
    prefillGoals: string | null;
    existingAnswers: Record<string, unknown> | null;
    submissionId: string | null;
    submissionStatus: string | null;
    sections: IntakeFormSection[];
};

type SaveState = "idle" | "saving" | "saved" | "error" | "local";

const SECTION_ICONS = [
    /* 1 – Personal */
    <svg key="1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    /* 2 – Health */
    <svg key="2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
    /* 3 – Goals */
    <svg key="3" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    /* 4 – Lifestyle */
    <svg key="4" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>,
];

export function IntakeFormView({
    requestId, prospectName, prospectEmail, prefillGoals,
    existingAnswers, submissionId, submissionStatus, sections,
}: Props) {
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
        if (prefillGoals && !flat.q_goal) flat.q_goal = prefillGoals;
        return flat;
    });

    const [coachNotes, setCoachNotes] = useState(() => {
        const existing = existingAnswers as IntakeAnswersShape | null;
        return existing?._coachNotes ?? "";
    });

    const [saveState, setSaveState] = useState<SaveState>("idle");
    const [error, setError] = useState<string | null>(null);
    const [sentEmail, setSentEmail] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [sending, setSending] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const localKey = `intake-draft-${requestId}`;

    const buildAnswersShape = useCallback((): IntakeAnswersShape => ({
        sections: sections.map((sec) => ({
            sectionId: sec.id, sectionTitle: sec.title,
            answers: sec.questions.map((q) => ({ questionId: q.id, questionLabel: q.label, value: answers[q.id] ?? "" })),
        })),
        _coachNotes: coachNotes, _savedAt: Date.now(),
    }), [sections, answers, coachNotes]);

    const doSave = useCallback(async () => {
        setSaveState("saving");
        try {
            const shape = buildAnswersShape();
            await saveIntakeDraft({ requestId, answers: shape as unknown as Record<string, unknown> });
            setSaveState("saved");
            try { localStorage.removeItem(localKey); } catch { /* */ }
            setTimeout(() => setSaveState("idle"), 2500);
        } catch {
            try { localStorage.setItem(localKey, JSON.stringify({ answers, coachNotes, _savedAt: Date.now() })); } catch { /* */ }
            setSaveState("local");
        }
    }, [requestId, localKey, buildAnswersShape, answers, coachNotes]);

    const scheduleAutoSave = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => doSave(), 800);
    }, [doSave]);

    const set = (qId: string, value: string) => { setAnswers(p => ({ ...p, [qId]: value })); scheduleAutoSave(); };
    const setNotes = (value: string) => { setCoachNotes(value); scheduleAutoSave(); };

    const handleSendForSignature = async () => {
        setError(null); setSending(true);
        try {
            const shape = buildAnswersShape();
            await saveIntakeDraft({ requestId, answers: shape as unknown as Record<string, unknown> });
            const readyResult = await markIntakeReadyToSend({ requestId, coachNotes });
            if (!readyResult.success) {
                if ("missingFields" in readyResult && readyResult.missingFields) setError(`Missing required fields: ${(readyResult.missingFields as string[]).join(", ")}`);
                setSending(false); return;
            }
            const sendResult = await sendFormsForSignature({ requestId });
            if (!sendResult.success) { setError(sendResult.message ?? "Failed to send."); setSending(false); return; }
            setSentEmail(sendResult.email ?? prospectEmail ?? "the client");
        } catch (e) { setError(e instanceof Error ? e.message : "Failed to send."); setSending(false); }
    };

    const filledCount = useMemo(() => sections.flatMap(s => s.questions).filter(q => answers[q.id]?.trim()).length, [sections, answers]);
    const totalCount = useMemo(() => sections.flatMap(s => s.questions).length, [sections]);
    const progressPct = totalCount ? Math.round((filledCount / totalCount) * 100) : 0;

    if (sentEmail || submissionStatus === "SENT" || submissionStatus === "SIGNED") {
        return (
            <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 ring-1 ring-emerald-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Forms Sent</h1>
                    <p className="mt-2 text-sm text-zinc-400 max-w-sm">
                        Sent to <strong className="text-zinc-200">{sentEmail ?? prospectEmail ?? "the client"}</strong>. They&apos;ll receive an email with a link to review and sign.
                    </p>
                </div>
                <Link href={`/coach/leads/${requestId}`} className="rounded-xl bg-zinc-800/80 border border-white/[0.06] px-6 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 transition-all">
                    ← Back to Lead
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* ── Sticky header ── */}
            <div className="sticky top-0 z-20 -mx-4 bg-[#0a0f1e]/95 backdrop-blur-xl px-4 pt-3 pb-2 border-b border-white/[0.04]">
                <div className="flex items-center justify-between gap-4 mb-2">
                    <Link href={`/coach/leads/${requestId}`} className="group flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5"><path d="M15 18l-6-6 6-6"/></svg>
                        Back
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-xs tabular-nums text-zinc-500">{filledCount}/{totalCount}</span>
                        <span className={`text-xs font-medium transition-colors ${
                            saveState === "saving" ? "text-amber-400" :
                            saveState === "saved" ? "text-emerald-400" :
                            saveState === "local" ? "text-orange-400" :
                            saveState === "error" ? "text-red-400" : "text-transparent"
                        }`}>
                            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved" : saveState === "local" ? "Saved locally" : saveState === "error" ? "Failed" : "·"}
                        </span>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="h-[3px] w-full rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
                </div>
            </div>

            {/* ── Title ── */}
            <div className="pt-1">
                <h1 className="text-[22px] font-bold tracking-tight text-zinc-100">Intake Form</h1>
                <p className="text-sm text-zinc-500 mt-0.5">{prospectName} · Auto-saves as you type</p>
            </div>

            {/* ── Sections ── */}
            {sections.map((section, sIdx) => (
                <section key={section.id} className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent overflow-hidden">
                    {/* Section header */}
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

                    {/* Questions */}
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

            {/* ── Coach Notes ── */}
            <section className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent overflow-hidden">
                <div className="px-5 pt-5 pb-4 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </span>
                        <div>
                            <h2 className="text-base font-semibold text-zinc-100">Coach Notes</h2>
                            <p className="text-[13px] text-zinc-500 mt-0.5">Private — not visible to the client</p>
                        </div>
                    </div>
                </div>
                <div className="px-5 py-4">
                    <textarea value={coachNotes} onChange={e => setNotes(e.target.value)} placeholder="Add notes from your consultation…"
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[15px] text-zinc-100 placeholder-zinc-600 transition-all focus:border-amber-500/40 focus:bg-amber-500/[0.02] focus:outline-none focus:ring-2 focus:ring-amber-500/15 resize-y"
                        rows={3} style={{ fontSize: "max(15px, 16px)", minHeight: "76px" }} />
                </div>
            </section>

            {/* ── Send for Signature ── */}
            <section className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent overflow-hidden">
                <div className="px-5 pt-5 pb-4 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                        </span>
                        <div>
                            <h2 className="text-base font-semibold text-zinc-100">Send for Signature</h2>
                            <p className="text-[13px] text-zinc-500 mt-0.5">Email the completed form to {prospectName.split(" ")[0]}</p>
                        </div>
                    </div>
                </div>
                <div className="px-5 py-4 space-y-4">
                    {!prospectEmail && (
                        <div className="flex items-start gap-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                            <p className="text-sm text-amber-300/90">Add the prospect&apos;s email on the lead page first.</p>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-500/15 bg-red-500/[0.04] px-4 py-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                            <p className="text-sm text-red-300/90">{error}</p>
                        </div>
                    )}
                    <label className="flex items-start gap-3 cursor-pointer group rounded-xl border border-white/[0.04] bg-white/[0.015] px-4 py-3.5 hover:bg-white/[0.03] transition-colors">
                        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                            className="mt-0.5 h-[18px] w-[18px] rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500 shrink-0" />
                        <span className="text-sm text-zinc-400 group-hover:text-zinc-300 leading-relaxed">
                            I confirm this information is complete and ready to send to {prospectName.split(" ")[0]} for review and signature.
                        </span>
                    </label>
                    <button disabled={!confirmed || !prospectEmail || sending} onClick={handleSendForSignature}
                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 transition-all hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                        style={{ minHeight: "52px" }}>
                        {sending ? "Sending…" : "Send for Signature →"}
                    </button>
                </div>
            </section>

            <div className="h-6" />
        </div>
    );
}
