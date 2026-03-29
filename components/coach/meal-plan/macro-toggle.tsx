"use client";

export function MacroToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <div className="relative">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`h-5 w-9 rounded-full transition-colors ${
            enabled
              ? "bg-zinc-900"
              : "bg-zinc-300"
          }`}
        />
        <div
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-4" : ""
          }`}
        />
      </div>
      <span className="text-zinc-500">Show Macros (Coach Only)</span>
    </label>
  );
}
