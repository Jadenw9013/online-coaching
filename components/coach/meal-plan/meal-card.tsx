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
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Meal header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
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
            className="rounded border border-zinc-300 px-2 py-0.5 text-sm font-semibold focus-visible:border-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTempName(meal.mealName);
              setEditingName(true);
            }}
            className="text-sm font-semibold transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
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
            className="rounded p-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-zinc-800"
            aria-label={`Move ${meal.mealName} up`}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveMealDown}
            disabled={isLast}
            className="rounded p-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-zinc-800"
            aria-label={`Move ${meal.mealName} down`}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onDuplicateMeal}
            className="rounded p-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            aria-label={`Duplicate ${meal.mealName}`}
          >
            ⧉
          </button>
          <button
            type="button"
            onClick={onRemoveMeal}
            className="rounded p-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
            aria-label={`Remove ${meal.mealName}`}
          >
            &times;
          </button>
        </div>
      </div>

      {/* Food rows */}
      <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
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
      <div className="relative border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setAddingFood(true)}
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
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
