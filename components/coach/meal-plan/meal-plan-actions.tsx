"use client";

export function MealPlanActions({
  saving,
  publishing,
  itemCount,
  isUnsaved,
  onSave,
  onPublish,
}: {
  saving: boolean;
  publishing: boolean;
  itemCount: number;
  isUnsaved: boolean;
  onSave: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {saving ? "Saving..." : isUnsaved ? "Save Draft" : "Save"}
      </button>
      <button
        type="button"
        onClick={onPublish}
        disabled={publishing || itemCount === 0}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50"
      >
        {publishing ? "Publishing..." : "Publish"}
      </button>
    </div>
  );
}
