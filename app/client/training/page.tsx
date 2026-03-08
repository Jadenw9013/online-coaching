import Link from "next/link";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { getPublishedTrainingProgram } from "@/lib/queries/training-programs";
import { TrainingProgram } from "@/components/client/training-program";

export default async function ClientTrainingPage() {
  const user = await getCurrentDbUser();
  const program = await getPublishedTrainingProgram(user.id);

  return (
    <div className="space-y-8">
      <section className="animate-fade-in">
        <Link
          href="/client"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:text-zinc-300"
          aria-label="Back to dashboard"
        >
          &larr; Dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Training</h1>
        <p className="mt-1.5 text-sm text-zinc-500">Your current program</p>
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
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white px-8 py-16 text-center dark:border-zinc-700 dark:bg-[#121215]">
            <p className="text-sm font-semibold">No training program yet</p>
            <p className="text-sm text-zinc-400">
              Your coach hasn&apos;t published a training program yet.
            </p>
          </div>
        ) : (
          <TrainingProgram program={program} />
        )}
      </section>
    </div>
  );
}
