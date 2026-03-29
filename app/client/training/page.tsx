import Link from "next/link";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { getPublishedTrainingProgram } from "@/lib/queries/training-programs";
import { getTodayAdherence } from "@/lib/queries/adherence";
import { getExerciseResultsForWeek, getPreviousExerciseResults } from "@/lib/queries/exercise-results";
import { getLocalDate, normalizeToMonday } from "@/lib/utils/date";
import { TrainingProgram } from "@/components/client/training-program";
import { ExportPdfButton } from "@/components/ui/export-pdf-button";

export default async function ClientTrainingPage() {
  const user = await getCurrentDbUser();
  const tz = user.timezone || "America/New_York";
  const todayDate = getLocalDate(new Date(), tz);
  const weekOf = normalizeToMonday(new Date());

  const [program, todayAdherence, currentResults, previousResults] = await Promise.all([
    getPublishedTrainingProgram(user.id),
    getTodayAdherence(user.id, todayDate),
    getExerciseResultsForWeek(user.id, weekOf),
    getPreviousExerciseResults(user.id, weekOf),
  ]);

  // Serialize Maps to plain Records for the client component
  const currentWeek: Record<string, { exerciseName: string; programDay: string; weight: number; reps: number }> = {};
  for (const [key, val] of currentResults) {
    currentWeek[key] = { exerciseName: val.exerciseName, programDay: val.programDay, weight: val.weight, reps: val.reps };
  }
  const previousWeek: Record<string, { exerciseName: string; programDay: string; weight: number; reps: number }> = {};
  for (const [key, val] of previousResults) {
    previousWeek[key] = { exerciseName: val.exerciseName, programDay: val.programDay, weight: val.weight, reps: val.reps };
  }

  return (
    <div className="space-y-8">
      <section className="animate-fade-in">
        <Link
          href="/client"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          aria-label="Back to dashboard"
        >
          &larr; Dashboard
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white">Training Program</h1>
            {program && program.days.length > 0 && (
              <span className="sf-section-label text-xs">
                {program.days.length} {program.days.length === 1 ? "day" : "days"}
              </span>
            )}
          </div>
          {program && <ExportPdfButton resourceId={program.id} type="training-program" variant="small" />}
        </div>
        <p className="mt-1.5 text-sm text-zinc-500">
          Tap a day to expand your workout
        </p>
      </section>

      <section
        className="animate-fade-in"
        style={{ animationDelay: "80ms" }}
        aria-labelledby="training-program-heading"
      >
        <h2 id="training-program-heading" className="sr-only">
          Training program
        </h2>
        {!program || program.days.length === 0 ? (
          <div className="sf-surface-card flex flex-col items-center gap-3 px-8 py-16 text-center" style={{ "--sf-card-highlight": "rgba(59, 91, 219, 0.08)", "--sf-card-atmosphere": "#0e1420" } as React.CSSProperties}>
            <p className="text-sm font-semibold text-zinc-300">No training program yet</p>
            <p className="text-sm text-zinc-400">
              Your coach hasn&apos;t published a training program yet.
            </p>
          </div>
        ) : (
          <TrainingProgram
            program={program}
            adherence={{
              date: todayDate,
              exercises: todayAdherence?.exercises ?? [],
            }}
            progress={{
              currentWeek,
              previousWeek,
            }}
          />
        )}
      </section>
    </div>
  );
}
