"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ParsedMealPlan } from "@/lib/validations/meal-plan-import";

export function DraftReview({
  uploadId,
  clientId,
  onBack,
}: {
  uploadId: string;
  clientId: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [plan, setPlan] = useState<ParsedMealPlan | null>(null);
  const [showExtracted, setShowExtracted] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/mealplans/draft?uploadId=${uploadId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load draft");
        }
        const data = await res.json();
        setDraftId(data.draftId);
        setExtractedText(data.extractedText ?? "");
        setPlan(data.parsedJson as ParsedMealPlan);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load draft");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uploadId]);

  const updateMealName = useCallback((mealIdx: number, name: string) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const meals = [...prev.meals];
      meals[mealIdx] = { ...meals[mealIdx], name };
      return { ...prev, meals };
    });
  }, []);

  const updateItem = useCallback(
    (mealIdx: number, itemIdx: number, field: "food" | "portion" | "notes", value: string) => {
      setPlan((prev) => {
        if (!prev) return prev;
        const meals = [...prev.meals];
        const items = [...meals[mealIdx].items];
        items[itemIdx] = { ...items[itemIdx], [field]: value };
        meals[mealIdx] = { ...meals[mealIdx], items };
        return { ...prev, meals };
      });
    },
    []
  );

  const removeItem = useCallback((mealIdx: number, itemIdx: number) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const meals = [...prev.meals];
      const items = meals[mealIdx].items.filter((_, i) => i !== itemIdx);
      if (items.length === 0) {
        // Remove entire meal if empty
        return { ...prev, meals: meals.filter((_, i) => i !== mealIdx) };
      }
      meals[mealIdx] = { ...meals[mealIdx], items };
      return { ...prev, meals };
    });
  }, []);

  const addItem = useCallback((mealIdx: number) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const meals = [...prev.meals];
      meals[mealIdx] = {
        ...meals[mealIdx],
        items: [...meals[mealIdx].items, { food: "", portion: "" }],
      };
      return { ...prev, meals };
    });
  }, []);

  const addMeal = useCallback(() => {
    setPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        meals: [
          ...prev.meals,
          { name: `Meal ${prev.meals.length + 1}`, items: [{ food: "", portion: "" }] },
        ],
      };
    });
  }, []);

  const removeMeal = useCallback((mealIdx: number) => {
    setPlan((prev) => {
      if (!prev) return prev;
      return { ...prev, meals: prev.meals.filter((_, i) => i !== mealIdx) };
    });
  }, []);

  async function handleImport() {
    if (!draftId || !plan) return;

    // Validate: all items must have a food name (portion can be empty)
    for (const meal of plan.meals) {
      for (const item of meal.items) {
        if (!item.food.trim()) {
          setError("All items must have a food name.");
          return;
        }
      }
    }

    setImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/mealplans/import-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, parsedJson: plan }),
      });

      if (!res.ok) {
        // Handle non-JSON responses (e.g. Vercel HTML 404 pages)
        const text = await res.text();
        let message = `Import failed (${res.status})`;
        try {
          const data = JSON.parse(text);
          if (data.error) message = data.error;
        } catch {
          // Non-JSON response — include status for debugging
          if (res.status === 404) message = "Import endpoint not found (404). Try redeploying.";
        }
        throw new Error(message);
      }

      const data = await res.json();

      // Navigate to the review workspace where the imported plan is now a draft
      router.push(
        `/coach/clients/${clientId}/review/${data.weekStartDate}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setImporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
        <span className="text-sm text-zinc-500">Loading draft...</span>
      </div>
    );
  }

  if (!plan || !draftId) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error || "Draft not found."}</p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold tracking-tight">Review Extracted Meal Plan</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Edit meals and items below, then import into the meal plan system.
        </p>
      </div>

      {/* Extracted text toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowExtracted(!showExtracted)}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:text-zinc-300"
          aria-expanded={showExtracted}
        >
          <span className="inline-block transition-transform" style={{ transform: showExtracted ? "rotate(90deg)" : "rotate(0deg)" }}>
            &#9654;
          </span>
          {showExtracted ? "Hide" : "Show"} extracted text
        </button>
        {showExtracted && (
          <pre className="mt-2 max-h-60 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            {extractedText || "No extracted text"}
          </pre>
        )}
      </div>

      {/* Plan title */}
      <div>
        <label htmlFor="plan-title" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Plan Title
        </label>
        <input
          id="plan-title"
          type="text"
          value={plan.title}
          onChange={(e) => setPlan({ ...plan, title: e.target.value })}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {/* Meals */}
      <div className="space-y-3">
        {plan.meals.map((meal, mealIdx) => (
          <div
            key={mealIdx}
            className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Meal header */}
            <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
              <input
                type="text"
                value={meal.name}
                onChange={(e) => updateMealName(mealIdx, e.target.value)}
                className="flex-1 rounded border-0 bg-transparent px-1 py-0.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-400"
                aria-label={`Meal name for meal ${mealIdx + 1}`}
              />
              <button
                type="button"
                onClick={() => removeMeal(mealIdx)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950"
                aria-label={`Remove ${meal.name}`}
              >
                &times;
              </button>
            </div>

            {/* Items */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {meal.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex items-start gap-2 px-3 py-2">
                  <div className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:gap-2">
                    <input
                      type="text"
                      value={item.food}
                      onChange={(e) => updateItem(mealIdx, itemIdx, "food", e.target.value)}
                      placeholder="Food name"
                      className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
                      aria-label={`Food name, meal ${mealIdx + 1}, item ${itemIdx + 1}`}
                    />
                    <input
                      type="text"
                      value={item.portion}
                      onChange={(e) => updateItem(mealIdx, itemIdx, "portion", e.target.value)}
                      placeholder="Portion not detected"
                      className={`w-full rounded-lg border px-2.5 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 sm:w-40 ${
                        !item.portion.trim()
                          ? "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30"
                          : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                      }`}
                      aria-label={`Portion, meal ${mealIdx + 1}, item ${itemIdx + 1}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(mealIdx, itemIdx)}
                    className="mt-1.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950"
                    aria-label={`Remove ${item.food || "item"}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            {/* Add item */}
            <div className="border-t border-zinc-100 px-3 py-1.5 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => addItem(mealIdx)}
                className="w-full rounded-lg py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                + Add Item
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add meal */}
      <button
        type="button"
        onClick={addMeal}
        className="w-full rounded-xl border border-dashed border-zinc-300 py-2.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
      >
        + Add Meal
      </button>

      {/* Notes */}
      {plan.notes && (
        <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-800/50">
          <span className="font-medium">Notes:</span> {plan.notes}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          disabled={importing}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={importing || plan.meals.length === 0}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {importing ? "Importing..." : "Import Meal Plan"}
        </button>
      </div>
    </div>
  );
}
