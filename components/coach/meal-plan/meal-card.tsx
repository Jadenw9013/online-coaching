"use client";

import { memo, useState } from "react";
import { FoodRow } from "./food-row";
import { FoodSearchDropdown } from "./food-search-dropdown";
import type { MealGroup, MealPlanFoodItem, FoodLibraryEntry } from "@/types/meal-plan";

export const MealCard = memo(function MealCard({
  meal,
  showMacros,
  foods,
  isFirst,
  isLast,
  onUpdateMealName,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  onRemoveMeal,
  onDuplicateMeal,
  onMoveMealUp,
  onMoveMealDown,
}: {
  meal: MealGroup;
  showMacros: boolean;
  foods: FoodLibraryEntry[];
  isFirst: boolean;
  isLast: boolean;
  onUpdateMealName: (name: string) => void;
  onUpdateItem: (itemId: string, item: MealPlanFoodItem) => void;
  onRemoveItem: (itemId: string) => void;
  onAddItem: (item: MealPlanFoodItem) => void;
  onRemoveMeal: () => void;
  onDuplicateMeal: () => void;
  onMoveMealUp: () => void;
  onMoveMealDown: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(meal.mealName);
  const [addingFood, setAddingFood] = useState(false);

  const mealTotals = meal.items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fats: acc.fats + item.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return (
    <div className="group overflow-hidden sf-glass-card transition-all hover:shadow-lg hover:shadow-blue-500/[0.03] hover:border-white/[0.08]">
      {/* Meal header */}
      <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3.5">
        {editingName ? (
          <input
            autoFocus
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={() => {
              onUpdateMealName(tempName || "Untitled Meal");
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdateMealName(tempName || "Untitled Meal");
                setEditingName(false);
              }
              if (e.key === "Escape") {
                setTempName(meal.mealName);
                setEditingName(false);
              }
            }}
            className="rounded border border-zinc-300 px-2 py-0.5 text-sm font-semibold focus-visible:border-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTempName(meal.mealName);
              setEditingName(true);
            }}
            className="text-sm font-bold uppercase tracking-wider text-zinc-200 transition-colors hover:text-white"
          >
            {meal.mealName}
          </button>
        )}

        <div className="flex items-center gap-1">
          {showMacros && (
            <span className="mr-1 text-xs text-zinc-400 tabular-nums">
              {mealTotals.calories} cal | {mealTotals.protein}p {mealTotals.carbs}c {mealTotals.fats}f
            </span>
          )}
          <button
            type="button"
            onClick={onMoveMealUp}
            disabled={isFirst}
            className="rounded-lg p-2 text-xs text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Move ${meal.mealName} up`}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveMealDown}
            disabled={isLast}
            className="rounded-lg p-2 text-xs text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Move ${meal.mealName} down`}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onDuplicateMeal}
            className="rounded-lg p-2 text-xs text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-blue-400"
            aria-label={`Duplicate ${meal.mealName}`}
          >
            ⧉
          </button>
          <button
            type="button"
            onClick={onRemoveMeal}
            className="rounded-lg p-2 text-xs text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-red-400"
            aria-label={`Remove ${meal.mealName}`}
          >
            &times;
          </button>
        </div>
      </div>

      {/* Food rows */}
      <div className="divide-y divide-white/[0.02]">
        {meal.items.map((item) => (
          <FoodRow
            key={item.id}
            item={item}
            showMacros={showMacros}
            foods={foods}
            onUpdate={(updated) => onUpdateItem(item.id, updated)}
            onRemove={() => onRemoveItem(item.id)}
          />
        ))}
      </div>

      {/* Add food */}
      <div className="relative border-t border-white/[0.04] px-5 py-3">
        <button
          type="button"
          onClick={() => setAddingFood(true)}
          className="text-xs font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300"
        >
          + Add Food
        </button>
        {addingFood && (
          <FoodSearchDropdown
            foods={foods}
            onSelect={(name, unit) => {
              onAddItem({
                id: crypto.randomUUID(),
                foodName: name,
                quantity: "1",
                unit,
                servingDescription: "",
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0,
              });
              setAddingFood(false);
            }}
            onClose={() => setAddingFood(false)}
          />
        )}
      </div>
    </div>
  );
});
