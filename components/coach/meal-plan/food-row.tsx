"use client";

import { memo, useState } from "react";
import { FoodSearchDropdown } from "./food-search-dropdown";
import type { MealPlanFoodItem, FoodLibraryEntry } from "@/types/meal-plan";

export const FoodRow = memo(function FoodRow({
  item,
  showMacros,
  foods,
  onUpdate,
  onRemove,
}: {
  item: MealPlanFoodItem;
  showMacros: boolean;
  foods: FoodLibraryEntry[];
  onUpdate: (updated: MealPlanFoodItem) => void;
  onRemove: () => void;
}) {
  const [replacing, setReplacing] = useState(false);

  return (
    <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      {/* Portion input (LEFT) */}
      <div className="w-36 shrink-0 sm:w-44">
        <label className="sr-only" htmlFor={`portion-${item.id}`}>
          Portion for {item.foodName}
        </label>
        <input
          id={`portion-${item.id}`}
          type="text"
          value={item.servingDescription || ""}
          onChange={(e) =>
            onUpdate({ ...item, servingDescription: e.target.value })
          }
          placeholder='portion size'
          aria-label={`Portion for ${item.foodName}`}
          className="w-full rounded border border-zinc-300 px-2 py-1 text-sm focus-visible:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>

      {/* Food name (MIDDLE) */}
      <div className="min-w-0 flex-1">
        <div className="relative flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.foodName}</span>

          {replacing && (
            <FoodSearchDropdown
              foods={foods}
              onSelect={(name, unit) => {
                onUpdate({ ...item, foodName: name, unit });
                setReplacing(false);
              }}
              onClose={() => setReplacing(false)}
            />
          )}
        </div>

        {showMacros && (
          <div className="mt-1 flex gap-3 text-xs text-zinc-400">
            <span>{item.calories} cal</span>
            <span>{item.protein}p</span>
            <span>{item.carbs}c</span>
            <span>{item.fats}f</span>
          </div>
        )}
      </div>

      {/* Actions (RIGHT) */}
      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setReplacing(true)}
          className="rounded px-2.5 py-2 text-xs text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded px-2.5 py-2 text-xs text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          Remove
        </button>
      </div>
    </div>
  );
});
