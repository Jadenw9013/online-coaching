"use client";

export function MealPlanActions({
  saving,
  publishing,
  itemCount,
  isUnsaved,
  notifyClient,
  onNotifyChange,
  onSave,
  onPublish,
}: {
  saving: boolean;
  publishing: boolean;
  itemCount: number;
  isUnsaved: boolean;
  notifyClient: boolean;
  onNotifyChange: (v: boolean) => void;
  onSave: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={notifyClient}
          onChange={(e) => onNotifyChange(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
        />
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          Notify client by email
        </span>
      </label>
      <p className="ml-6 text-xs text-zinc-400">
        Sends an email if the client has email notifications enabled.
      </p>
      <div className="flex items-center gap-2 pt-1">
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
    </div>
  );
}
