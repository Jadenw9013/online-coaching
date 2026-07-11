export function TrainingProgramActions({
  isPublished,
  saving,
  publishing,
  onSave,
  onPublish,
}: {
  isPublished: boolean;
  saving: boolean;
  publishing: boolean;
  onSave: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving || publishing}
        className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
      >
        {saving ? "Saving…" : "Save Draft"}
      </button>
      <button
        type="button"
        onClick={onPublish}
        disabled={saving || publishing}
        className="flex-1 rounded-xl bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
      >
        {publishing ? "Publishing…" : isPublished ? "Republish" : "Publish"}
      </button>
    </div>
  );
}
