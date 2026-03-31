"use client";

import { useCallback, useState, useEffect } from "react";
import type { PlanExtras, DayOverride, MealAdjustment, MealChange } from "@/types/meal-plan-extras";
import { OVERRIDE_COLORS, getOverrideColor } from "@/types/meal-plan-extras";
import { copySection, pasteSection } from "@/lib/plan-clipboard";
import { savePlanSnippet, listPlanSnippets, getPlanSnippet, deletePlanSnippet, type SnippetType } from "@/app/actions/plan-snippets";

// Day order for sheet UI (Sunday-first)
const SHEET_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Local flat change type for sheet editing ──────────────────────────────────

type UIChange = {
  id: string;
  mealName: string;
  change: MealChange;
};

type SheetState = {
  mode: "add" | "edit";
  idx: number;
  label: string;
  color: string;
  weekdays: string[];
  uiChanges: UIChange[];
  notes: string;
};

type AddChangeFormState = {
  mealName: string;
  changeType: MealChange["type"] | null;
  food: string;
  newPortion: string;
  replacementFood: string;
  replacementPortion: string;
};

function flattenAdjustments(mealAdjustments: MealAdjustment[] | undefined): UIChange[] {
  const result: UIChange[] = [];
  for (const adj of mealAdjustments ?? []) {
    for (const change of adj.changes ?? []) {
      result.push({ id: crypto.randomUUID(), mealName: adj.mealName, change });
    }
  }
  return result;
}

function nestChanges(uiChanges: UIChange[]): MealAdjustment[] {
  const map = new Map<string, MealChange[]>();
  for (const uc of uiChanges) {
    if (!map.has(uc.mealName)) map.set(uc.mealName, []);
    map.get(uc.mealName)!.push(uc.change);
  }
  return Array.from(map.entries()).map(([mealName, changes]) => ({ mealName, changes }));
}

function formatChangeSentence(uc: UIChange): string {
  const { mealName, change } = uc;
  switch (change.type) {
    case "update":
      return `${mealName} — Change portion of ${change.food}${change.newPortion ? ` to ${change.newPortion}` : ""}`;
    case "add":
      return `${mealName} — Add ${change.food}${change.newPortion ? ` (${change.newPortion})` : ""}`;
    case "remove":
      return `${mealName} — Skip ${change.food}`;
    case "replace": {
      const suffix = change.replacementFood
        ? ` for ${change.replacementFood}${change.replacementPortion ? ` (${change.replacementPortion})` : ""}`
        : "";
      return `${mealName} — Swap ${change.food}${suffix}`;
    }
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlanExtrasEditor({
  extras,
  onChange,
  mealNames,
}: {
  extras: PlanExtras;
  onChange: (updated: PlanExtras) => void;
  mealNames?: string[];
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [planDetailsOpen, setPlanDetailsOpen] = useState(false);
  const [sheetState, setSheetState] = useState<SheetState | null>(null);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  // ── Metadata helpers ──────────────────────────────────────────────────────

  const updateMetadata = useCallback(
    (field: string, value: string) => {
      onChange({ ...extras, metadata: { ...extras.metadata, [field]: value } });
    },
    [extras, onChange]
  );

  // ── Override helpers ──────────────────────────────────────────────────────

  const saveOverride = useCallback(
    (sheet: SheetState) => {
      const override: DayOverride = {
        label: sheet.label || "Special Day",
        color: sheet.color,
        weekdays: sheet.weekdays,
        mealAdjustments: nestChanges(sheet.uiChanges),
        notes: sheet.notes || undefined,
      };
      const overrides = [...(extras.dayOverrides ?? [])];
      if (sheet.mode === "edit") {
        overrides[sheet.idx] = override;
      } else {
        overrides.push(override);
      }
      onChange({ ...extras, dayOverrides: overrides });
    },
    [extras, onChange]
  );

  const removeOverride = useCallback(
    (idx: number) => {
      onChange({ ...extras, dayOverrides: extras.dayOverrides?.filter((_, i) => i !== idx) });
    },
    [extras, onChange]
  );

  const duplicateOverride = useCallback(
    (idx: number) => {
      const overrides = [...(extras.dayOverrides ?? [])];
      const copy = JSON.parse(JSON.stringify(overrides[idx])) as DayOverride;
      copy.label = `${copy.label} (Copy)`;
      overrides.splice(idx + 1, 0, copy);
      onChange({ ...extras, dayOverrides: overrides });
      showToast("Special day duplicated");
    },
    [extras, onChange, showToast]
  );

  const handleCopyOverride = useCallback((idx: number) => {
    const data = extras.dayOverrides?.[idx];
    if (data) { copySection("override", data); showToast("Copied"); }
  }, [extras.dayOverrides, showToast]);

  const handlePasteOverride = useCallback(async () => {
    const data = await pasteSection("override");
    if (data) {
      onChange({ ...extras, dayOverrides: [...(extras.dayOverrides ?? []), data as DayOverride] });
      showToast("Pasted");
    }
  }, [extras, onChange, showToast]);

  const openAddSheet = useCallback(() => {
    setSheetState({ mode: "add", idx: -1, label: "", color: "blue", weekdays: [], uiChanges: [], notes: "" });
  }, []);

  const openEditSheet = useCallback((idx: number) => {
    const override = extras.dayOverrides?.[idx];
    if (!override) return;
    setSheetState({
      mode: "edit",
      idx,
      label: override.label,
      color: override.color ?? "blue",
      weekdays: override.weekdays ?? [],
      uiChanges: flattenAdjustments(override.mealAdjustments),
      notes: override.notes ?? "",
    });
  }, [extras.dayOverrides]);

  // ── Template handlers ─────────────────────────────────────────────────────

  const [templateModal, setTemplateModal] = useState<{
    type: SnippetType;
    mode: "save" | "apply";
    applyCallback?: (payload: unknown) => void;
  } | null>(null);

  const handleApplyTemplate = useCallback((type: SnippetType, cb: (payload: unknown) => void) => {
    setTemplateModal({ type, mode: "apply", applyCallback: cb });
  }, []);

  const overrides = extras.dayOverrides ?? [];

  return (
    <div className="space-y-3">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Template modal */}
      {templateModal && (
        <TemplateModal
          type={templateModal.type}
          mode={templateModal.mode}
          saveData={templateModal.mode === "save" ? null : undefined}
          onApply={(payload) => { templateModal.applyCallback?.(payload); setTemplateModal(null); }}
          onClose={() => setTemplateModal(null)}
        />
      )}

      {/* Override sheet */}
      {sheetState && (
        <OverrideSheetModal
          state={sheetState}
          mealNames={mealNames ?? []}
          onChange={setSheetState}
          onSave={() => { saveOverride(sheetState); setSheetState(null); }}
          onClose={() => setSheetState(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteIdx !== null && (
        <DeleteConfirmDialog
          label={overrides[deleteIdx]?.label ?? "this special day"}
          onConfirm={() => { removeOverride(deleteIdx); setDeleteIdx(null); }}
          onCancel={() => setDeleteIdx(null)}
        />
      )}

      {/* Plan Details collapsible header */}
      <button
        type="button"
        onClick={() => setPlanDetailsOpen((v) => !v)}
        className="group flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition-all hover:border-zinc-300 hover:bg-zinc-100"
        aria-expanded={planDetailsOpen}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
          </span>
          <div>
            <span className="text-sm font-semibold text-zinc-700">Plan Details</span>
            <span className="ml-2 text-xs text-zinc-400">
              {planDetailsOpen ? "Click to collapse" : "Special day rules & plan metadata"}
            </span>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-zinc-400 transition-transform duration-200 group-hover:text-zinc-600 ${planDetailsOpen ? "rotate-180" : ""}`} aria-hidden><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {/* Metadata section (unchanged) */}
      {planDetailsOpen && extras.metadata && (
        <ExtrasCard>
          <ExtrasCardHeader label="Overview" />
          <div className="grid gap-2 sm:grid-cols-3">
            <EditableField label="Phase" value={extras.metadata.phase ?? ""} onChange={(v) => updateMetadata("phase", v)} placeholder="e.g. bulking, cutting" />
            <EditableField label="Weight" value={extras.metadata.bodyweight ?? ""} onChange={(v) => updateMetadata("bodyweight", v)} placeholder="e.g. 173 lbs" />
            <EditableField label="Start Date" value={extras.metadata.startDate ?? ""} onChange={(v) => updateMetadata("startDate", v)} placeholder="e.g. 3/11/2026" />
          </div>
          <div className="mt-2">
            <EditableField label="Coach Notes" value={extras.metadata.coachNotes ?? ""} onChange={(v) => updateMetadata("coachNotes", v)} placeholder="Notes for the client" multiline />
          </div>
          {extras.metadata.highlightedChanges && (
            <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Changes</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...extras.metadata };
                    delete (updated as Record<string, unknown>).highlightedChanges;
                    onChange({ ...extras, metadata: updated });
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded text-amber-400 transition-colors hover:bg-amber-500/10 hover:text-red-500"
                  aria-label="Remove highlighted changes"
                >
                  &times;
                </button>
              </div>
              <EditableField value={extras.metadata.highlightedChanges} onChange={(v) => updateMetadata("highlightedChanges", v)} placeholder="Highlighted changes" />
            </div>
          )}
        </ExtrasCard>
      )}

      {/* Special Day Rules section */}
      {planDetailsOpen && (
        <ExtrasCard>
          {/* Section header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">Special Day Rules</span>
                {overrides.length > 0 && (
                  <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-zinc-500">{overrides.length}</span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-zinc-400">
                Add rules for days when your client eats differently — like high carb days, free meals, or refeed days.
              </p>
            </div>
            <div className="shrink-0">
              <SectionMenu
                actions={[
                  { label: "Paste Special Day", onClick: handlePasteOverride },
                  {
                    label: "Apply Template…", onClick: () => handleApplyTemplate("override", (payload) => {
                      const data = payload as DayOverride;
                      onChange({ ...extras, dayOverrides: [...(extras.dayOverrides ?? []), { ...data }] });
                      showToast("Template applied");
                    })
                  },
                ]}
              />
            </div>
          </div>

          {/* Empty state */}
          {overrides.length === 0 ? (
            <div className="mt-3 flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-600">No special days yet</p>
                <p className="mx-auto mt-1 max-w-[240px] text-[12px] leading-relaxed text-zinc-400">
                  Add a rule for days when your client&apos;s plan looks different.<br />
                  For example: &ldquo;High Carb Day&rdquo; on Mondays and Fridays, or &ldquo;Free Meal&rdquo; on Saturdays.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddSheet}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-700"
              >
                + Add a Special Day
              </button>
            </div>
          ) : (
            <>
              <div className="mt-3 space-y-2">
                {overrides.map((override, oi) => {
                  const color = getOverrideColor(override.color);
                  const totalChanges = (override.mealAdjustments ?? []).reduce(
                    (sum, adj) => sum + adj.changes.length, 0
                  );
                  const days = override.weekdays ?? [];
                  return (
                    <div
                      key={oi}
                      className="relative flex items-start gap-3 overflow-hidden rounded-xl border border-zinc-200 bg-white py-3 pl-0 pr-3"
                    >
                      {/* Colored left accent bar */}
                      <span className={`absolute bottom-0 left-0 top-0 w-1 rounded-l-xl ${color.dot}`} />

                      <div className="min-w-0 flex-1 pl-4">
                        <p className="truncate text-sm font-bold text-zinc-800">{override.label}</p>
                        {days.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {days.map((day) => (
                              <span key={day} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${color.bg} ${color.text}`}>
                                {day.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {totalChanges > 0
                            ? `${totalChanges} meal ${totalChanges === 1 ? "change" : "changes"}`
                            : "No meal changes — note only"}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => openEditSheet(oi)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                          aria-label={`Edit ${override.label}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteIdx(oi)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label={`Delete ${override.label}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                        <SectionMenu
                          actions={[
                            { label: "Duplicate", onClick: () => duplicateOverride(oi) },
                            { label: "Copy", onClick: () => handleCopyOverride(oi) },
                            {
                              label: "Save as Template…", onClick: () => {
                                setTemplateModal({ type: "override", mode: "save", applyCallback: () => {} });
                                setSaveOverrideData(override);
                              }
                            },
                          ]}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={openAddSheet}
                className="mt-3 w-full rounded-lg border border-dashed border-zinc-300 py-2 text-[11px] font-medium text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-600"
              >
                + Add a Special Day
              </button>
            </>
          )}
        </ExtrasCard>
      )}
    </div>
  );
}

// ── Override Sheet Modal ──────────────────────────────────────────────────────

function OverrideSheetModal({
  state,
  mealNames,
  onChange,
  onSave,
  onClose,
}: {
  state: SheetState;
  mealNames: string[];
  onChange: (s: SheetState) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const [addChangeForm, setAddChangeForm] = useState<AddChangeFormState | null>(null);
  const color = getOverrideColor(state.color);
  const effectiveMealNames = mealNames.length > 0 ? mealNames : ["Meal 1"];

  function toggleDay(day: string) {
    const has = state.weekdays.includes(day);
    onChange({ ...state, weekdays: has ? state.weekdays.filter((d) => d !== day) : [...state.weekdays, day] });
  }

  function removeChange(id: string) {
    onChange({ ...state, uiChanges: state.uiChanges.filter((uc) => uc.id !== id) });
  }

  function commitChange() {
    if (!addChangeForm || !addChangeForm.changeType || !addChangeForm.food.trim()) return;
    const { mealName, changeType, food, newPortion, replacementFood, replacementPortion } = addChangeForm;
    const change: MealChange =
      changeType === "update" ? { type: "update", food, newPortion: newPortion || undefined } :
      changeType === "add"    ? { type: "add", food, newPortion: newPortion || undefined } :
      changeType === "remove" ? { type: "remove", food } :
      { type: "replace", food, replacementFood: replacementFood || undefined, replacementPortion: replacementPortion || undefined };
    onChange({ ...state, uiChanges: [...state.uiChanges, { id: crypto.randomUUID(), mealName, change }] });
    setAddChangeForm(null);
  }

  const isValid = state.label.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-bold text-zinc-800">
            {state.mode === "add" ? "Add a Special Day" : "Edit Special Day"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-6">

            {/* Step 1 — Name & Color */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
                  What do you call this day?
                </label>
                <input
                  type="text"
                  value={state.label}
                  onChange={(e) => onChange({ ...state, label: e.target.value })}
                  placeholder="e.g. High Carb Day, Free Meal, Refeed Day"
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  style={{ fontSize: "max(1rem, 16px)" }}
                  autoFocus
                />
                <p className="mt-1 text-[11px] text-zinc-400">This label will appear on your client&apos;s plan.</p>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-700">Pick a color</p>
                <div className="flex gap-3">
                  {OVERRIDE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onChange({ ...state, color: c.id })}
                      className={`h-7 w-7 rounded-full transition-all ${c.dot} ${
                        state.color === c.id
                          ? "scale-110 ring-2 ring-zinc-600 ring-offset-2"
                          : "opacity-50 hover:opacity-80"
                      }`}
                      aria-label={c.label}
                      aria-pressed={state.color === c.id}
                    />
                  ))}
                </div>
              </div>
            </div>

            <hr className="border-zinc-100" />

            {/* Step 2 — Which days? */}
            <div>
              <p className="mb-2 text-sm font-semibold text-zinc-700">Which days of the week?</p>
              <div className="flex flex-wrap gap-1.5">
                {SHEET_DAYS.map((day) => {
                  const selected = state.weekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`min-h-[36px] rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                        selected
                          ? `${color.bg} ${color.text} ring-1 ring-inset ${color.border}`
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-400">Tap to select multiple days.</p>
            </div>

            <hr className="border-zinc-100" />

            {/* Step 3 — Meal changes */}
            <div>
              <p className="mb-0.5 text-sm font-semibold text-zinc-700">What&apos;s different on these days?</p>
              <p className="mb-3 text-[11px] text-zinc-400">Optional — describe what changes. Or just add a note below.</p>

              {/* Existing changes */}
              {state.uiChanges.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  {state.uiChanges.map((uc) => (
                    <div key={uc.id} className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                      <p className="flex-1 text-xs text-zinc-600">{formatChangeSentence(uc)}</p>
                      <button
                        type="button"
                        onClick={() => removeChange(uc.id)}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-300 transition-colors hover:text-red-500"
                        aria-label="Remove this change"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline add-change form */}
              {addChangeForm ? (
                <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5">
                  {/* Meal selector */}
                  <div>
                    <p className="mb-1 text-xs font-semibold text-zinc-600">Which meal?</p>
                    {effectiveMealNames.length > 1 ? (
                      <select
                        value={addChangeForm.mealName}
                        onChange={(e) => setAddChangeForm({ ...addChangeForm, mealName: e.target.value })}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      >
                        {effectiveMealNames.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={addChangeForm.mealName}
                        onChange={(e) => setAddChangeForm({ ...addChangeForm, mealName: e.target.value })}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        placeholder="e.g. Meal 1"
                        style={{ fontSize: "max(1rem, 16px)" }}
                      />
                    )}
                  </div>

                  {/* Change type selector */}
                  {!addChangeForm.changeType ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-zinc-600">What kind of change?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          {
                            type: "update" as const,
                            label: "Change a portion",
                            sub: "Eat more or less of something",
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
                                <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
                                <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
                                <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
                              </svg>
                            ),
                          },
                          {
                            type: "add" as const,
                            label: "Add a food",
                            sub: "Add something extra to this meal",
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                              </svg>
                            ),
                          },
                          {
                            type: "remove" as const,
                            label: "Skip a food",
                            sub: "Leave something out",
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
                              </svg>
                            ),
                          },
                          {
                            type: "replace" as const,
                            label: "Swap a food",
                            sub: "Eat this instead of that",
                            icon: (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M7 16V4m0 0L3 8m4-4 4 4"/><path d="M17 8v12m0 0 4-4m-4 4-4-4"/>
                              </svg>
                            ),
                          },
                        ] as const).map(({ type, label, sub, icon }) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setAddChangeForm({ ...addChangeForm, changeType: type })}
                            className="flex min-h-[56px] items-start gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-left transition-all hover:border-zinc-400 hover:bg-zinc-50 active:scale-[0.98]"
                          >
                            <span className="mt-0.5 shrink-0 text-zinc-500">{icon}</span>
                            <div>
                              <p className="text-xs font-semibold text-zinc-700">{label}</p>
                              <p className="text-[10px] leading-snug text-zinc-400">{sub}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Back to type selection */}
                      <button
                        type="button"
                        onClick={() => setAddChangeForm({ ...addChangeForm, changeType: null, food: "", newPortion: "", replacementFood: "", replacementPortion: "" })}
                        className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                        Change type
                      </button>

                      {/* update fields */}
                      {addChangeForm.changeType === "update" && (
                        <>
                          <div>
                            <p className="mb-1 text-xs font-semibold text-zinc-600">Which food?</p>
                            <input type="text" value={addChangeForm.food} onChange={(e) => setAddChangeForm({ ...addChangeForm, food: e.target.value })} placeholder="e.g. Oats" className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400" style={{ fontSize: "max(1rem, 16px)" }} />
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold text-zinc-600">New amount?</p>
                            <input type="text" value={addChangeForm.newPortion} onChange={(e) => setAddChangeForm({ ...addChangeForm, newPortion: e.target.value })} placeholder="e.g. 150g, 2 cups, 1 scoop" className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400" style={{ fontSize: "max(1rem, 16px)" }} />
                          </div>
                        </>
                      )}

                      {/* add fields */}
                      {addChangeForm.changeType === "add" && (
                        <>
                          <div>
                            <p className="mb-1 text-xs font-semibold text-zinc-600">What food?</p>
                            <input type="text" value={addChangeForm.food} onChange={(e) => setAddChangeForm({ ...addChangeForm, food: e.target.value })} placeholder="e.g. Rice Cakes" className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400" style={{ fontSize: "max(1rem, 16px)" }} />
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold text-zinc-600">How much?</p>
                            <input type="text" value={addChangeForm.newPortion} onChange={(e) => setAddChangeForm({ ...addChangeForm, newPortion: e.target.value })} placeholder="e.g. 2 cakes, 1 serving" className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400" style={{ fontSize: "max(1rem, 16px)" }} />
                          </div>
                        </>
                      )}

                      {/* remove fields */}
                      {addChangeForm.changeType === "remove" && (
                        <div>
                          <p className="mb-1 text-xs font-semibold text-zinc-600">Which food to skip?</p>
                          <input type="text" value={addChangeForm.food} onChange={(e) => setAddChangeForm({ ...addChangeForm, food: e.target.value })} placeholder="e.g. Peanut Butter" className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400" style={{ fontSize: "max(1rem, 16px)" }} />
                        </div>
                      )}

                      {/* replace fields */}
                      {addChangeForm.changeType === "replace" && (
                        <>
                          <div>
                            <p className="mb-1 text-xs font-semibold text-zinc-600">Which food to swap out?</p>
                            <input type="text" value={addChangeForm.food} onChange={(e) => setAddChangeForm({ ...addChangeForm, food: e.target.value })} placeholder="e.g. Sweet Potato" className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400" style={{ fontSize: "max(1rem, 16px)" }} />
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold text-zinc-600">Replace it with?</p>
                            <input type="text" value={addChangeForm.replacementFood} onChange={(e) => setAddChangeForm({ ...addChangeForm, replacementFood: e.target.value })} placeholder="e.g. White Rice" className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400" style={{ fontSize: "max(1rem, 16px)" }} />
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold text-zinc-600">New amount?</p>
                            <input type="text" value={addChangeForm.replacementPortion} onChange={(e) => setAddChangeForm({ ...addChangeForm, replacementPortion: e.target.value })} placeholder="e.g. 250g" className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400" style={{ fontSize: "max(1rem, 16px)" }} />
                          </div>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={commitChange}
                        disabled={!addChangeForm.food.trim()}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        + Save this change
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddChangeForm({
                    mealName: effectiveMealNames[0] ?? "Meal 1",
                    changeType: null,
                    food: "",
                    newPortion: "",
                    replacementFood: "",
                    replacementPortion: "",
                  })}
                  className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800"
                >
                  + Add a change
                </button>
              )}
            </div>

            <hr className="border-zinc-100" />

            {/* Step 4 — Notes */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
                Any extra notes for your client?
              </label>
              <textarea
                value={state.notes}
                onChange={(e) => onChange({ ...state, notes: e.target.value })}
                placeholder="e.g. These are your training days — prioritize carbs before your workout."
                rows={3}
                className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                style={{ fontSize: "max(1rem, 16px)" }}
              />
              <p className="mt-1 text-[11px] text-zinc-400">This note will appear on your client&apos;s plan on these days.</p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col gap-2 border-t border-zinc-100 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onSave}
            disabled={!isValid}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────

function DeleteConfirmDialog({
  label,
  onConfirm,
  onCancel,
}: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-sm font-bold text-zinc-800">Remove &ldquo;{label}&rdquo;?</h3>
        <p className="mt-1.5 text-sm text-zinc-500">
          This will remove the special day rule from your plan. Your client won&apos;t see it anymore.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-red-600"
          >
            Remove
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            Keep it
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section Menu ──────────────────────────────────────────────────────────────

function SectionMenu({ actions }: { actions: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        aria-label="More actions"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-50 min-w-[160px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setOpen(false); action.onClick(); }}
                className={`w-full px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                  action.danger ? "text-red-500 hover:bg-red-50" : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Template Modal ────────────────────────────────────────────────────────────

function TemplateModal({
  type,
  mode,
  saveData,
  onApply,
  onClose,
}: {
  type: SnippetType;
  mode: "save" | "apply";
  saveData?: unknown;
  onApply: (payload: unknown) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [snippets, setSnippets] = useState<{ id: string; name: string; createdAt: Date }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "apply" || mode === "save") {
      setLoading(true);
      listPlanSnippets(type).then(setSnippets).finally(() => setLoading(false));
    }
  }, [type, mode]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = type === "override" ? _pendingSaveOverrideData : saveData;
      await savePlanSnippet(type, name.trim(), data);
      _pendingSaveOverrideData = null;
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async (snippetId: string) => {
    try {
      const snippet = await getPlanSnippet(snippetId);
      onApply(snippet.payload);
    } catch { /* noop */ }
  };

  const handleDelete = async (snippetId: string) => {
    await deletePlanSnippet(snippetId);
    setSnippets((prev) => prev.filter((s) => s.id !== snippetId));
  };

  const typeLabel = type === "override" ? "Special Day" : type === "supplements" ? "Supplement Stack" : type === "rules" ? "Rules" : "Allowances";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-sm font-bold text-zinc-800">
          {mode === "save" ? `Save ${typeLabel} Template` : `Apply ${typeLabel} Template`}
        </h3>

        {mode === "save" && (
          <div className="mt-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. Default ${typeLabel}`}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              autoFocus
            />
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleSave} disabled={saving || !name.trim()} className="flex-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50">
                {saving ? "Saving…" : "Save Template"}
              </button>
              <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-50">Cancel</button>
            </div>
          </div>
        )}

        {mode === "apply" && (
          <div className="mt-3">
            {loading && <p className="text-xs text-zinc-400">Loading templates…</p>}
            {!loading && snippets.length === 0 && (
              <p className="text-xs text-zinc-400">No saved templates yet. Save one first.</p>
            )}
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {snippets.map((s) => (
                <div key={s.id} className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50">
                  <button type="button" onClick={() => handleApply(s.id)} className="flex-1 text-left text-sm font-medium text-zinc-700">{s.name}</button>
                  <button type="button" onClick={() => handleDelete(s.id)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100">&times;</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={onClose} className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-50">Close</button>
          </div>
        )}

        {mode === "save" && snippets.length > 0 && (
          <div className="mt-3 border-t border-zinc-100 pt-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Existing Templates</p>
            <div className="max-h-32 space-y-0.5 overflow-y-auto">
              {snippets.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded px-2 py-1">
                  <span className="flex-1 text-[11px] text-zinc-500">{s.name}</span>
                  <button type="button" onClick={() => handleDelete(s.id)} className="text-[10px] text-zinc-300 hover:text-red-500">&times;</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function ExtrasCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-zinc-200 bg-white p-3.5">{children}</div>;
}

function ExtrasCardHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">{label}</span>
      {count != null && count > 0 && (
        <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-zinc-500">{count}</span>
      )}
    </div>
  );
}

function EditableField({ label, value, onChange, placeholder, multiline }: { label?: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean }) {
  const cls = "w-full rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400";
  return (
    <div>
      {label && <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</span>}
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} className={cls} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

// ── Module-level override save ref (for template modal) ───────────────────────
let _pendingSaveOverrideData: DayOverride | null = null;
function setSaveOverrideData(d: DayOverride) { _pendingSaveOverrideData = d; }
