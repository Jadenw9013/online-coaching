import type { BlockType } from "@/app/generated/prisma/enums";

type TrainingBlock = {
  id: string;
  type: BlockType;
  title: string;
  content: string;
  sortOrder: number;
};

type TrainingDay = {
  id: string;
  dayName: string;
  blocks: TrainingBlock[];
};

type TrainingProgramData = {
  publishedAt: Date | null;
  weeklyFrequency: number | null;
  clientNotes: string | null;
  days: TrainingDay[];
};

const BLOCK_TYPE_LABELS: Partial<Record<BlockType, string>> = {
  ACTIVATION: "Activation",
  INSTRUCTION: "Note",
  SUPERSET: "Superset",
  CARDIO: "Cardio",
  OPTIONAL: "Optional",
};

const BLOCK_TYPE_BADGE: Partial<Record<BlockType, string>> = {
  ACTIVATION: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  INSTRUCTION: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  SUPERSET: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  CARDIO: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  OPTIONAL: "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400",
};

export function TrainingProgram({ program }: { program: TrainingProgramData }) {
  return (
    <div className="space-y-3">
      {/* Frequency / notes banner */}
      {(program.weeklyFrequency || program.clientNotes) && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white px-5 py-4 dark:border-zinc-800/80 dark:bg-[#121215]">
          {program.weeklyFrequency && (
            <p className="text-sm">
              <span className="font-semibold">{program.weeklyFrequency}×</span>{" "}
              <span className="text-zinc-500">per week</span>
            </p>
          )}
          {program.clientNotes && (
            <p className="mt-1 text-sm text-zinc-500">{program.clientNotes}</p>
          )}
        </div>
      )}

      {program.days.map((day) => (
        <div
          key={day.id}
          className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-[#121215]"
        >
          <div className="border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <h3 className="text-sm font-semibold">{day.dayName || "Untitled Day"}</h3>
          </div>

          {day.blocks.length === 0 ? (
            <p className="px-5 py-4 text-sm text-zinc-400">No details added yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100/80 dark:divide-zinc-800/60">
              {day.blocks.map((block) => {
                const badgeClass = BLOCK_TYPE_BADGE[block.type];
                const badgeLabel = BLOCK_TYPE_LABELS[block.type];

                return (
                  <div key={block.id} className="px-5 py-3">
                    {(badgeLabel || block.title) && (
                      <div className="mb-1 flex items-baseline gap-2">
                        {badgeLabel && (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}
                          >
                            {badgeLabel}
                          </span>
                        )}
                        {block.title && (
                          <span className="text-sm font-medium">{block.title}</span>
                        )}
                      </div>
                    )}
                    {block.content && (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {block.content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {program.publishedAt && (
        <p className="text-xs text-zinc-400">
          Updated{" "}
          {program.publishedAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
