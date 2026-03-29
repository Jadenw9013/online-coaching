"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { saveReviewEdits } from "@/app/actions/intake";
import { saveCoachNotes } from "@/app/actions/coach-notes";

// ── Types ─────────────────────────────────────────────────────────────────────

type IntakeAnswer = { questionId: string; label: string; value: string; required?: boolean };
type IntakeSection = { sectionId: string; sectionTitle: string; answers: IntakeAnswer[] };
type FormAnswers = { sections: IntakeSection[] };
type LegacyResponse = { questionLabel: string; answer: string };
type ManualFields = { goals?: string; training?: string; injuries?: string; diet?: string; other?: string };

type Props = {
    intakePacketId: string | null;
    formAnswers: FormAnswers | null;
    submittedAt: string | null;
    coachNotes: string | null;
    legacyResponses: LegacyResponse[] | null;
    clientName: string;
    clientId: string;
    manualNotes: string | null;  // CoachClient.coachNotes
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function parseManualNotes(raw: string | null): ManualFields {
    if (!raw) return {};
    try { return JSON.parse(raw) as ManualFields; } catch { return { other: raw }; }
}

function hasAnyManualNotes(f: ManualFields) {
    return Object.values(f).some(v => v?.trim());
}

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="shrink-0 text-zinc-700 group-hover:text-zinc-400 transition-colors" aria-hidden="true">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
    </svg>
);

// ── CoachNotesField (saves to IntakePacket.coachNotes) ────────────────────────

function CoachNotesField({ intakePacketId, initialValue, onSaveStart, onSaved }: {
    intakePacketId: string | null;
    initialValue: string;
    onSaveStart: () => void;
    onSaved: () => void;
}) {
    const [value, setValue] = useState(initialValue);
    const [, startTransition] = useTransition();

    const handleBlur = () => {
        if (!intakePacketId || value === initialValue) return;
        onSaveStart();
        startTransition(async () => {
            try { await saveReviewEdits({ packetId: intakePacketId, coachNotes: value }); onSaved(); }
            catch { /* silent */ }
        });
    };

    return (
        <textarea
            aria-label="Coach notes"
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={handleBlur}
            placeholder="Add private notes about this client…"
            rows={3}
            className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/30 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
            style={{ fontSize: "max(1rem, 16px)" }}
        />
    );
}

// ── ManualIntakeForm (saves to CoachClient.coachNotes as JSON) ────────────────

const MANUAL_FIELDS: { key: keyof ManualFields; label: string; placeholder: string }[] = [
    { key: "goals",    label: "Goals",               placeholder: "What are they working toward?" },
    { key: "training", label: "Training Background", placeholder: "Experience level, days/week, equipment…" },
    { key: "injuries", label: "Injuries / Health",   placeholder: "Any injuries, conditions, or limitations…" },
    { key: "diet",     label: "Diet & Nutrition",    placeholder: "Dietary restrictions, preferences, habits…" },
    { key: "other",    label: "Other Notes",          placeholder: "Anything else relevant…" },
];

function ManualIntakeForm({ clientId, initial }: { clientId: string; initial: ManualFields }) {
    const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
    const [committed, setCommitted] = useState<ManualFields>(initial);
    const [, startTransition] = useTransition();

    const handleBlur = (key: keyof ManualFields, value: string) => {
        const updated = { ...committed, [key]: value };
        setCommitted(updated);
        setSaveState("saving");
        startTransition(async () => {
            try {
                await saveCoachNotes({ clientId, notes: JSON.stringify(updated) });
                setSaveState("saved");
                setTimeout(() => setSaveState("idle"), 2500);
            } catch { setSaveState("idle"); }
        });
    };

    return (
        <div className="sf-glass-card">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <PencilIcon />
                    Optional — fill at your own pace · Changes auto-save
                </p>
                {saveState !== "idle" && (
                    <p role="status" aria-live="polite" className="text-xs text-zinc-500">
                        {saveState === "saving" ? "Saving…" : "✓ Saved"}
                    </p>
                )}
            </div>
            <div className="divide-y divide-white/[0.04] px-5 py-2">
                {MANUAL_FIELDS.map(f => (
                    <div key={f.key} className="flex gap-4 py-4">
                        <div className="w-[38%] shrink-0 pr-4 pt-2">
                            <p className="text-xs font-medium text-zinc-500">{f.label}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                            <textarea
                                aria-label={f.label}
                                defaultValue={committed[f.key] ?? ""}
                                onBlur={e => handleBlur(f.key, e.target.value)}
                                placeholder={f.placeholder}
                                rows={2}
                                className="w-full rounded-lg border border-zinc-700/40 bg-zinc-800/30 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20 resize-y"
                                style={{ fontSize: "max(1rem, 16px)", minHeight: "48px" }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function IntakeSummaryPanel({
    intakePacketId,
    formAnswers,
    submittedAt,
    coachNotes,
    legacyResponses,
    clientName,
    clientId,
    manualNotes,
}: Props) {
    const [sections, setSections] = useState<IntakeSection[]>(formAnswers?.sections ?? []);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState("");
    const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
    const [, startTransition] = useTransition();
    const [showManualForm, setShowManualForm] = useState(false);

    const startEdit = useCallback((id: string, value: string) => { setEditingId(id); setDraft(value); }, []);
    const cancelEdit = useCallback(() => { setEditingId(null); setDraft(""); }, []);

    const finishEdit = useCallback((sIdx: number, aIdx: number) => {
        if (!intakePacketId) return;
        const updated = sections.map((s, si) =>
            si !== sIdx ? s : { ...s, answers: s.answers.map((a, ai) => ai !== aIdx ? a : { ...a, value: draft.trim() }) }
        );
        setSections(updated);
        setEditingId(null);
        setSaveState("saving");
        startTransition(async () => {
            try {
                await saveReviewEdits({ packetId: intakePacketId, formAnswers: { sections: updated } as unknown as Record<string, unknown> });
                setSaveState("saved");
                setTimeout(() => setSaveState("idle"), 2500);
            } catch { setSaveState("idle"); }
        });
    }, [intakePacketId, draft, sections, startTransition]);

    // ── IntakePacket mode ─────────────────────────────────────────────────────
    if (formAnswers && sections.length > 0) {
        return (
            <div className="sf-glass-card">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                    <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <PencilIcon />
                        Click any answer to edit · Changes auto-save
                    </p>
                    <div className="flex items-center gap-3">
                        {saveState !== "idle" && (
                            <p role="status" aria-live="polite" className="text-xs text-zinc-500">
                                {saveState === "saving" ? "Saving…" : "✓ Saved"}
                            </p>
                        )}
                        {submittedAt && <p className="text-xs text-zinc-600">Submitted {formatDate(submittedAt)}</p>}
                    </div>
                </div>
                <div className="px-5 py-4 space-y-8">
                    {sections.map((section, sIdx) => (
                        <div key={section.sectionId}>
                            <p className="mb-3 border-b border-white/[0.04] pb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                                {section.sectionTitle}
                            </p>
                            <div>
                                {section.answers.map((a, aIdx) => {
                                    const isEditing = editingId === a.questionId;
                                    const isEmpty = !a.value?.trim();
                                    const isLast = aIdx === section.answers.length - 1;
                                    return (
                                        <div key={a.questionId} className={`flex gap-4 py-3 ${!isLast ? "border-b border-white/[0.04]" : ""}`}>
                                            <div className="w-[40%] shrink-0 pr-4">
                                                <p id={`lbl-${a.questionId}`} className="text-xs font-medium leading-snug text-zinc-500">{a.label}</p>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {isEditing ? (
                                                    <textarea
                                                        autoFocus
                                                        aria-label={`Edit ${a.label}`}
                                                        value={draft}
                                                        onChange={e => setDraft(e.target.value)}
                                                        onBlur={() => finishEdit(sIdx, aIdx)}
                                                        onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); cancelEdit(); } }}
                                                        className="w-full rounded-lg border border-blue-500/50 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
                                                        style={{ fontSize: "max(1rem, 16px)", minHeight: "48px" }}
                                                        rows={draft.length > 100 ? 4 : 2}
                                                    />
                                                ) : (
                                                    <div
                                                        role="button" tabIndex={0}
                                                        aria-labelledby={`lbl-${a.questionId}`}
                                                        aria-label={`Edit ${a.label}`}
                                                        onClick={() => startEdit(a.questionId, a.value)}
                                                        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startEdit(a.questionId, a.value); } }}
                                                        className="group flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-1 -mx-2 transition-all duration-150 hover:border-zinc-700/30 hover:bg-zinc-800/50"
                                                    >
                                                        {isEmpty ? <span className="text-sm text-zinc-600">—</span>
                                                            : <span className="text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap">{a.value}</span>}
                                                        <PencilIcon />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {/* Coach notes — always shown, editable */}
                    <div>
                        <p className="mb-2 border-b border-white/[0.04] pb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">Coach Notes</p>
                        <p className="mb-2 text-xs italic text-zinc-600">Private — not shown to {clientName}</p>
                        <CoachNotesField
                            intakePacketId={intakePacketId}
                            initialValue={coachNotes ?? ""}
                            onSaveStart={() => setSaveState("saving")}
                            onSaved={() => { setSaveState("saved"); setTimeout(() => setSaveState("idle"), 2500); }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ── Legacy OnboardingResponse mode ────────────────────────────────────────
    if (legacyResponses && legacyResponses.length > 0) {
        return (
            <div className="sf-glass-card divide-y divide-white/[0.04]">
                <div className="px-5 py-3">
                    <p className="text-xs italic text-zinc-600">Collected via legacy intake form</p>
                </div>
                <div className="p-5 space-y-4">
                    {legacyResponses.map((r, i) => (
                        <div key={i}>
                            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{r.questionLabel}</p>
                            <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{r.answer || "—"}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ── Manual notes mode / empty state ──────────────────────────────────────
    const parsedManual = parseManualNotes(manualNotes);
    const hasNotes = hasAnyManualNotes(parsedManual);

    if (hasNotes || showManualForm) {
        return <ManualIntakeForm clientId={clientId} initial={parsedManual} />;
    }

    return (
        <div className="rounded-xl border border-dashed border-zinc-800 px-5 py-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-zinc-400">No intake on file</p>
                    <p className="mt-0.5 text-xs text-zinc-600">
                        Client didn&apos;t go through the intake flow.{" "}
                        <Link href="/coach/leads" className="text-blue-400 hover:underline">Send one via Leads →</Link>
                    </p>
                </div>
                <button
                    onClick={() => setShowManualForm(true)}
                    className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                    style={{ minHeight: "36px" }}
                >
                    + Add notes manually
                </button>
            </div>
        </div>
    );
}
