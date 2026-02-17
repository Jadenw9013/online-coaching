"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { addFoodLibraryItem } from "@/app/actions/food-library";

type FoodItem = {
  id: string;
  name: string;
  defaultUnit: string;
};

export function FoodSearchDropdown({
  foods,
  onSelect,
  onClose,
}: {
  foods: FoodItem[];
  onSelect: (name: string, unit: string) => void;
  onClose: () => void;
}) {
  const [query, setQueryRaw] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  function setQuery(value: string) {
    setQueryRaw(value);
    setActiveIndex(-1);
  }
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = "food-search-listbox";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query
    ? foods.filter((f) =>
        f.name.toLowerCase().includes(query.toLowerCase())
      )
    : foods;

  const exactMatch = foods.some(
    (f) => f.name.toLowerCase() === query.toLowerCase()
  );

  // Total selectable items: filtered foods + optional "Add new" button
  const hasAddNew = query.trim() && !exactMatch;
  const totalItems = filtered.length + (hasAddNew ? 1 : 0);

  const handleAddNew = useCallback(async () => {
    if (!query.trim()) return;
    const result = await addFoodLibraryItem({
      name: query.trim(),
      defaultUnit: "serving",
    });
    if ("item" in result && result.item) {
      onSelect(result.item.name, result.item.defaultUnit);
    }
  }, [query, onSelect]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % totalItems);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        onSelect(filtered[activeIndex].name, filtered[activeIndex].defaultUnit);
      } else if (activeIndex === filtered.length && hasAddNew) {
        handleAddNew();
      } else if (filtered.length === 1) {
        onSelect(filtered[0].name, filtered[0].defaultUnit);
      }
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[role='option']");
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const activeDescendant =
    activeIndex >= 0
      ? activeIndex < filtered.length
        ? `food-option-${filtered[activeIndex].id}`
        : "food-option-add-new"
      : undefined;

  return (
    <div className="absolute left-0 top-full z-10 mt-1 w-64 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <div className="p-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search foods..."
          role="combobox"
          aria-expanded={true}
          aria-controls={listId}
          aria-activedescendant={activeDescendant}
          aria-autocomplete="list"
          className="w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm focus-visible:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>
      <ul
        ref={listRef}
        id={listId}
        className="max-h-48 overflow-y-auto px-1 pb-1"
        role="listbox"
      >
        {filtered.map((food, i) => (
          <li
            key={food.id}
            id={`food-option-${food.id}`}
            role="option"
            aria-selected={i === activeIndex}
          >
            <button
              type="button"
              onClick={() => onSelect(food.name, food.defaultUnit)}
              className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                i === activeIndex
                  ? "bg-zinc-100 dark:bg-zinc-800"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {food.name}
              <span className="ml-1 text-xs text-zinc-400">
                ({food.defaultUnit})
              </span>
            </button>
          </li>
        ))}
        {hasAddNew && (
          <li
            id="food-option-add-new"
            role="option"
            aria-selected={activeIndex === filtered.length}
          >
            <button
              type="button"
              onClick={handleAddNew}
              className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm font-medium text-blue-600 transition-colors dark:text-blue-400 ${
                activeIndex === filtered.length
                  ? "bg-blue-50 dark:bg-blue-950"
                  : "hover:bg-blue-50 dark:hover:bg-blue-950"
              }`}
            >
              + Add &quot;{query.trim()}&quot;
            </button>
          </li>
        )}
        {filtered.length === 0 && !query.trim() && (
          <li className="px-2.5 py-3 text-center text-xs text-zinc-400">
            No foods in library yet.
          </li>
        )}
      </ul>
    </div>
  );
}
