import { getCurrentDbUser } from "@/lib/auth/roles";
import { getClientCheckInsLight, getLatestCoachMessage } from "@/lib/queries/check-ins";
import { getCurrentPublishedMealPlan } from "@/lib/queries/meal-plans";
import { getCurrentWeekMonday, formatDateUTC } from "@/lib/utils/date";
import { db } from "@/lib/db";
import Link from "next/link";
import { ConnectCoachBanner } from "@/components/client/connect-coach-banner";
import { BecomeCoachForm } from "@/components/client/become-coach-form";
import { SimpleMealPlan } from "@/components/client/simple-meal-plan";
import { DeleteCheckInButton } from "@/components/client/delete-check-in-button";
import { CheckInStatus } from "@/components/client/check-in-status";

export default async function ClientDashboard() {
  const user = await getCurrentDbUser();

  const coachAssignment = await db.coachClient.findFirst({
    where: { clientId: user.id },
    include: {
      coach: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  const [checkIns, mealPlan, latestCoachMessage] = await Promise.all([
    getClientCheckInsLight(user.id),
    getCurrentPublishedMealPlan(user.id),
    getLatestCoachMessage(user.id),
  ]);

  const currentWeekDate = getCurrentWeekMonday();

  // Determine current week check-in status
  const currentWeekCheckIn = checkIns.find(
    (c) => c.weekOf.getTime() === currentWeekDate.getTime()
  );
  const weekStatus: "none" | "submitted" | "reviewed" = !currentWeekCheckIn
    ? "none"
    : currentWeekCheckIn.status === "REVIEWED"
      ? "reviewed"
      : "submitted";

  const weekLabel = currentWeekDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* A) Context Header — greeting + coach + week */}
      <section className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {user.firstName ? `${user.firstName}'s Week` : "Your Week"}
          </h1>
          {coachAssignment && (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold dark:bg-zinc-800">
                {coachAssignment.coach.firstName?.[0] ?? "C"}
              </div>
              <span className="text-sm text-zinc-500">
                {coachAssignment.coach.firstName}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-zinc-500">
          Week of {weekLabel}
        </p>
      </section>

      {/* Coach connection (only if no coach) */}
      {!coachAssignment && <ConnectCoachBanner />}

      {/* B) Dominant Next Action — check-in CTA */}
      <CheckInStatus
        status={weekStatus}
        weekLabel={weekLabel}
        checkInDate={
          currentWeekCheckIn
            ? currentWeekCheckIn.createdAt.toLocaleDateString()
            : undefined
        }
      />

      {/* Coach feedback (if available) */}
      {latestCoachMessage && (
        <Link
          href={`/client/messages/${formatDateUTC(latestCoachMessage.weekOf)}`}
          className="group block rounded-lg border border-zinc-200 bg-white px-4 py-3.5 transition-colors hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Coach Feedback
            </p>
            <span className="text-xs text-zinc-400 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
              View &rarr;
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed line-clamp-2">
            {latestCoachMessage.body}
          </p>
        </Link>
      )}

      {/* C) Today's Plan — current meal plan */}
      {mealPlan && (
        <section id="meal-plan" aria-labelledby="meal-plan-heading">
          <h2 id="meal-plan-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Current Meal Plan
          </h2>
          <SimpleMealPlan mealPlan={mealPlan} />
        </section>
      )}

      {/* D) Progress Snapshot — recent check-ins */}
      <section aria-labelledby="checkins-heading">
        <h2 id="checkins-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Recent Check-Ins
        </h2>
        {checkIns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500">No check-ins yet.</p>
            <Link
              href="/client/check-in"
              className="mt-2 inline-block text-sm font-medium underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
            >
              Submit your first check-in
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {checkIns.map((checkIn) => {
              const idx = checkIns.indexOf(checkIn);
              const prev = checkIns[idx + 1];
              const delta =
                prev?.weight && checkIn.weight
                  ? +(checkIn.weight - prev.weight).toFixed(1)
                  : null;

              return (
                <div
                  key={checkIn.id}
                  className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {/* Weight — big number */}
                  <div className="w-20 shrink-0">
                    {checkIn.weight ? (
                      <>
                        <p className="text-lg font-semibold tabular-nums leading-tight">
                          {checkIn.weight}
                        </p>
                        <p className="text-xs text-zinc-400">lbs</p>
                      </>
                    ) : (
                      <p className="text-lg font-semibold text-zinc-300 dark:text-zinc-600">
                        &mdash;
                      </p>
                    )}
                  </div>

                  {/* Week label + delta + photos */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {checkIn.weekOf.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {delta != null && delta !== 0 && (
                        <span
                          className={`ml-2 text-xs font-medium ${
                            delta < 0 ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {delta < 0 ? "↓" : "↑"}{Math.abs(delta)}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      {checkIn._count.photos > 0 && (
                        <span>{checkIn._count.photos} photo{checkIn._count.photos > 1 ? "s" : ""}</span>
                      )}
                      {checkIn.notes && (
                        <span className="truncate max-w-[200px]">{checkIn.notes}</span>
                      )}
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        checkIn.status === "REVIEWED"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                      }`}
                    >
                      {checkIn.status === "REVIEWED" ? "Reviewed" : "Pending"}
                    </span>
                    <DeleteCheckInButton checkInId={checkIn.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Become a Coach (de-emphasized at bottom) */}
      {!user.isCoach && <BecomeCoachForm />}
    </div>
  );
}
