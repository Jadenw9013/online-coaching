"use client";

import type { TrainingDayGroup, TrainingBlock } from "@/types/training";
import { BlockCard } from "./block-card";

export function TrainingDayCard({
  day,
  index,
  onChange,
  onRemove,
}: {
  day: TrainingDayGroup;
  index: number;
  onChange: (updated: TrainingDayGroup) => void;
  onRemove: () => void;
}) {
  function addBlock() {
    onChange({
      ...day,
      blocks: [...day.blocks, { type: "EXERCISE", title: "", content: "" }],
    });
  }

  function removeBlock(blockIndex: number) {
    onChange({
      ...day,
      blocks: day.blocks.filter((_, i) => i !== blockIndex),
    });
  }

  function updateBlock(blockIndex: number, updated: TrainingBlock) {
    onChange({
      ...day,
      blocks: day.blocks.map((b, i) => (i === blockIndex ? updated : b)),
    });
  }

  return (
    <div className="px-5 py-4 space-y-3">
      {/* Day name row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={day.dayName}
          onChange={(e) => onChange({ ...day, dayName: e.target.value })}
          placeholder={`Day ${index + 1} name — e.g. Monday / Push Day`}
          aria-label={`Day ${index + 1} name`}
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm font-semibold placeholder-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${day.dayName || `Day ${index + 1}`}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800"
        >
          ×
        </button>
      </div>

      {/* Blocks */}
      <div className="space-y-2">
        {day.blocks.map((block, i) => (
          <BlockCard
            key={i}
            block={block}
            index={i}
            onChange={(updated) => updateBlock(i, updated)}
            onRemove={() => removeBlock(i)}
          />
        ))}
        <button
          type="button"
          onClick={addBlock}
          className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
        >
          + Add Block
        </button>
      </div>
    </div>
  );
}
