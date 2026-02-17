import { getCurrentDbUser, ensureCoachCode } from "@/lib/auth/roles";
import { getCoachClientsWithWeekStatus } from "@/lib/queries/check-ins";
import { CoachCodeDisplay } from "@/components/coach/coach-code-display";
import { CoachInbox } from "@/components/coach/inbox/coach-inbox";
import type { InboxClient } from "@/components/coach/inbox/inbox-client-card";

export default async function CoachDashboard() {
  const user = await getCurrentDbUser();
  const coachCode = await ensureCoachCode(user.id);
  const rawClients = await getCoachClientsWithWeekStatus(user.id);

  const clients: InboxClient[] = rawClients.map((c) => ({
    ...c,
    weekOf: c.weekOf,
  }));

  const weekLabel = clients[0]?.weekOf.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const newCount = clients.filter((c) => c.weekStatus === "new").length;
  const reviewedCount = clients.filter((c) => c.weekStatus === "reviewed").length;
  const missingCount = clients.filter((c) => c.weekStatus === "missing").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Inbox</h1>
          {weekLabel && (
            <p className="mt-0.5 text-sm text-zinc-500">
              Week of {weekLabel}
            </p>
          )}
        </div>
        {clients.length > 0 && (
          <div className="flex items-center gap-3 text-sm tabular-nums" role="status" aria-label="Client check-in summary">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
              <span className="font-semibold">{newCount}</span>
              <span className="text-zinc-400">new</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
              <span className="font-semibold">{reviewedCount}</span>
              <span className="text-zinc-400">reviewed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-zinc-400" aria-hidden="true" />
              <span className="font-semibold">{missingCount}</span>
              <span className="text-zinc-400">missing</span>
            </span>
          </div>
        )}
      </div>

      <CoachCodeDisplay code={coachCode} />

      {/* Client list with filters */}
      {clients.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="font-medium text-zinc-500">No clients assigned yet.</p>
          <p className="mt-1 text-sm text-zinc-400">
            Share your coach code to get started.
          </p>
        </div>
      ) : (
        <CoachInbox clients={clients} />
      )}
    </div>
  );
}
