import { verifyCoachAccessToClient } from "@/lib/queries/check-ins";
import { getClientProfile } from "@/lib/queries/client-profile";
import { getCurrentPublishedMealPlan } from "@/lib/queries/meal-plans";
import { getCurrentWeekMonday, formatDateUTC } from "@/lib/utils/date";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SimpleMealPlan } from "@/components/client/simple-meal-plan";
import { CoachNotesEditor } from "@/components/coach/coach-notes-editor";
import { WeightSparkline } from "@/components/ui/weight-sparkline";

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const coach = await verifyCoachAccessToClient(clientId);
  const profile = await getClientProfile(coach.id, clientId);
  if (!profile) notFound();

  const mealPlan = await getCurrentPublishedMealPlan(clientId);
  const weekOf = getCurrentWeekMonday();
  const weekDateStr = formatDateUTC(weekOf);

  const { client, latestCheckIn, previousCheckIn, weightDelta, recentCheckIns, lastMessageAt } = profile;

  const sparklineData = recentCheckIns
    .filter((c): c is typeof c & { weight: number } => c.weight != null)
    .map((c) => ({
      weekOf: c.weekOf.toISOString(),
      weight: c.weight,
    }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/coach/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Back to inbox"
          >
            &larr;
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold dark:bg-zinc-800">
            {client.firstName?.[0] ?? "?"}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-xs text-zinc-500">{client.email}</p>
          </div>
        </div>
        {lastMessageAt && (
          <p className="text-xs text-zinc-400">
            Last msg: {timeAgo(lastMessageAt)}
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/coach/clients/${clientId}/review/${weekDateStr}`}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Review This Week
        </Link>
        <Link
          href={`/coach/clients/${clientId}/review/${weekDateStr}#messages`}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Message
        </Link>
        <Link
          href={`/coach/clients/${clientId}/check-ins`}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          History
        </Link>
      </div>

      {/* Weight overview — big numbers */}
      <section aria-labelledby="weight-heading">
        <h2 id="weight-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Weight Overview
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Current</p>
            {latestCheckIn?.weight ? (
              <div className="mt-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tabular-nums">{latestCheckIn.weight}</span>
                  <span className="text-xs text-zinc-400">lbs</span>
                </div>
                <p className="text-xs text-zinc-400">
                  {latestCheckIn.weekOf.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-2xl font-bold text-zinc-300 dark:text-zinc-600">&mdash;</p>
            )}
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Previous</p>
            {previousCheckIn?.weight ? (
              <div className="mt-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tabular-nums">{previousCheckIn.weight}</span>
                  <span className="text-xs text-zinc-400">lbs</span>
                </div>
                <p className="text-xs text-zinc-400">
                  {previousCheckIn.weekOf.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-2xl font-bold text-zinc-300 dark:text-zinc-600">&mdash;</p>
            )}
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Change</p>
            {weightDelta != null ? (
              <div className="mt-1 flex items-baseline gap-1">
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    weightDelta > 0 ? "text-red-500" : weightDelta < 0 ? "text-green-600" : ""
                  }`}
                >
                  {weightDelta > 0 ? "+" : ""}{weightDelta}
                </span>
                <span className="text-xs text-zinc-400">lbs</span>
              </div>
            ) : (
              <p className="mt-1 text-2xl font-bold text-zinc-300 dark:text-zinc-600">&mdash;</p>
            )}
          </div>
        </div>
        {sparklineData.length >= 2 && (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-400">Trend</p>
            <WeightSparkline data={sparklineData} width={200} height={40} />
          </div>
        )}
      </section>

      {/* Latest metrics */}
      {latestCheckIn && (latestCheckIn.dietCompliance || latestCheckIn.energyLevel) && (
        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Latest Metrics
          </h2>
          <div className="flex gap-3">
            {latestCheckIn.dietCompliance != null && (
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Diet</p>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span className="text-2xl font-bold tabular-nums">{latestCheckIn.dietCompliance}</span>
                  <span className="text-xs text-zinc-400">/10</span>
                </div>
              </div>
            )}
            {latestCheckIn.energyLevel != null && (
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Energy</p>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span className="text-2xl font-bold tabular-nums">{latestCheckIn.energyLevel}</span>
                  <span className="text-xs text-zinc-400">/10</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Two-column: meal plan + notes */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="meal-plan-heading">
          <h2 id="meal-plan-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Current Meal Plan
          </h2>
          {mealPlan ? (
            <SimpleMealPlan mealPlan={mealPlan} />
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-sm text-zinc-400">No published meal plan yet.</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Notes
          </h2>
          <CoachNotesEditor
            clientId={clientId}
            initial={profile.coachNotes ?? ""}
          />
        </section>
      </div>
    </div>
  );
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
