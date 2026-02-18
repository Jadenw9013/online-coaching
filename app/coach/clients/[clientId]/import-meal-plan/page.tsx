import { verifyCoachAccessToClient } from "@/lib/queries/check-ins";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ImportFlow } from "@/components/coach/meal-plan-import/import-flow";

export default async function ImportMealPlanPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await verifyCoachAccessToClient(clientId);

  const client = await db.user.findUnique({
    where: { id: clientId },
    select: { firstName: true, lastName: true },
  });
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/coach/clients/${clientId}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Back to client profile"
        >
          &larr;
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Import Meal Plan
          </h1>
          <p className="text-xs text-zinc-500">
            for {client.firstName} {client.lastName}
          </p>
        </div>
      </div>

      {/* Import flow */}
      <ImportFlow clientId={clientId} />
    </div>
  );
}
