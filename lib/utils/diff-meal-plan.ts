/**
 * Diff two meal plans to produce human-readable change descriptions.
 *
 * Compares MealGroup arrays + PlanExtras and returns structured change entries
 * for the preview UI.
 */

import type { MealGroup } from "@/types/meal-plan";
import type { PlanExtras } from "@/types/meal-plan-extras";

export type ChangeEntry = {
  type: "added" | "removed" | "modified" | "info";
  category: "meal" | "item" | "supplement" | "override" | "rule" | "allowance" | "meta" | "support";
  label: string;
  detail?: string;
};

export function diffMealPlans(
  before: MealGroup[],
  after: MealGroup[],
  extrasBefore: PlanExtras | null,
  extrasAfter: PlanExtras | null,
  supportBefore: string | null = null,
  supportAfter: string | null = null
): ChangeEntry[] {
  const changes: ChangeEntry[] = [];

  // --- Meal-level changes ---
  const beforeNames = new Set(before.map((m) => m.mealName));
  const afterNames = new Set(after.map((m) => m.mealName));

  // New meals
  for (const meal of after) {
    if (!beforeNames.has(meal.mealName)) {
      changes.push({
        type: "added",
        category: "meal",
        label: `New meal: ${meal.mealName}`,
        detail: `${meal.items.length} item${meal.items.length !== 1 ? "s" : ""}`,
      });
    }
  }

  // Removed meals
  for (const meal of before) {
    if (!afterNames.has(meal.mealName)) {
      changes.push({
        type: "removed",
        category: "meal",
        label: `Removed: ${meal.mealName}`,
      });
    }
  }

  // Item-level changes within shared meals
  for (const afterMeal of after) {
    const beforeMeal = before.find((m) => m.mealName === afterMeal.mealName);
    if (!beforeMeal) continue; // Already handled as new meal

    const beforeFoods = new Map(
      beforeMeal.items.map((i) => [i.foodName.toLowerCase(), i])
    );
    const afterFoods = new Map(
      afterMeal.items.map((i) => [i.foodName.toLowerCase(), i])
    );

    // Added items
    for (const [key, item] of afterFoods) {
      if (!beforeFoods.has(key)) {
        changes.push({
          type: "added",
          category: "item",
          label: `${afterMeal.mealName}: + ${item.foodName}`,
          detail: item.servingDescription || undefined,
        });
      }
    }

    // Removed items
    for (const [key, item] of beforeFoods) {
      if (!afterFoods.has(key)) {
        changes.push({
          type: "removed",
          category: "item",
          label: `${afterMeal.mealName}: − ${item.foodName}`,
        });
      }
    }

    // Modified items (portion changed)
    for (const [key, afterItem] of afterFoods) {
      const beforeItem = beforeFoods.get(key);
      if (!beforeItem) continue;

      const beforePortion = beforeItem.servingDescription || `${beforeItem.quantity} ${beforeItem.unit}`;
      const afterPortion = afterItem.servingDescription || `${afterItem.quantity} ${afterItem.unit}`;

      if (beforePortion !== afterPortion) {
        changes.push({
          type: "modified",
          category: "item",
          label: `${afterMeal.mealName}: ${afterItem.foodName}`,
          detail: `${beforePortion} → ${afterPortion}`,
        });
      }
    }
  }

  // --- Extras changes ---

  // Day overrides
  const beforeOverrides = extrasBefore?.dayOverrides ?? [];
  const afterOverrides = extrasAfter?.dayOverrides ?? [];
  const beforeOverrideLabels = new Set(beforeOverrides.map((o) => o.label));

  for (const override of afterOverrides) {
    if (!beforeOverrideLabels.has(override.label)) {
      changes.push({
        type: "added",
        category: "override",
        label: `Day override: ${override.label}`,
        detail: override.weekdays?.join(", ") ?? undefined,
      });
    }
  }

  // Support Content
  if (supportBefore !== supportAfter) {
    changes.push({
      type: "modified",
      category: "support",
      label: "Support notes updated",
      detail: "Guidance, rules, or supplements were modified",
    });
  }

  // Highlighted changes from metadata
  if (extrasAfter?.metadata?.highlightedChanges) {
    changes.push({
      type: "info",
      category: "meta",
      label: extrasAfter.metadata.highlightedChanges,
    });
  }

  return changes;
}
