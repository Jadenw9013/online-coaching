import { notFound } from "next/navigation";
import Link from "next/link";
import { verifyCoachAccessToClient } from "@/lib/queries/check-ins";
import { WorkoutImportFlow } from "@/components/coach/training-import/import-flow";

export default async function ImportClientTrainingPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const coach = await verifyCoachAccessToClient(clientId).catch(() => null);
  if (!coach) notFound();

  return (
    <div className="space-y-8">
      <section className="animate-fade-in">
        <Link
          href={`/coach/clients/${clientId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:text-zinc-300"
          aria-label="Back to client profile"
        >
          &larr; Client profile
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Import Training Plan</h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Upload a file or paste workout text. The parsed plan will be saved as a
          draft — you can review and publish from the training editor.
        </p>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "80ms" }}>
        <WorkoutImportFlow clientId={clientId} />
      </section>
    </div>
  );
}
