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

  // Latest weight for the performance module
  const latestWeight = checkIns.find((c) => c.weight != null);
  const prevWeight = latestWeight
    ? checkIns.find((c) => c.weight != null && c.id !== latestWeight.id)
    : null;
  const weightDelta =
    latestWeight?.weight && prevWeight?.weight
      ? +(latestWeight.weight - prevWeight.weight).toFixed(1)
      : null;

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <section className="animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">
            {user.firstName ? `${user.firstName}\u2019s Week` : "Your Week"}
          </h1>
          {coachAssignment && (
            <div className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 dark:border-zinc-800 dark:bg-[#121215]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold dark:bg-zinc-800">
                {coachAssignment.coach.firstName?.[0] ?? "C"}
              </div>
              <span className="text-xs font-medium text-zinc-500">
                Coach {coachAssignment.coach.firstName}
              </span>
            </div>
          )}
        </div>
        <p className="mt-1.5 text-sm text-zinc-500">
          Week of {weekLabel}
        </p>
      </section>

      {/* Coach connection (only if no coach) */}
      {!coachAssignment && <ConnectCoachBanner />}

      {/* ── Action Banner ── */}
      <div className="animate-fade-in" style={{ animationDelay: "80ms" }}>
        <CheckInStatus
          status={weekStatus}
          weekLabel={weekLabel}
          checkInDate={
            currentWeekCheckIn
              ? currentWeekCheckIn.createdAt.toLocaleDateString()
              : undefined
          }
        />
      </div>

      {/* ── Performance Module — Weight ── */}
      {latestWeight?.weight && (
        <section
          className="animate-fade-in overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-[#121215]"
          style={{ animationDelay: "160ms" }}
          aria-label="Weight overview"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Current Weight
          </p>
          <div className="mt-2.5 flex items-baseline gap-2">
            <p className="text-4xl font-bold tabular-nums tracking-tight">
              {latestWeight.weight}
            </p>
            <span className="text-sm font-medium text-zinc-400">lbs</span>
            {weightDelta != null && weightDelta !== 0 && (
              <span
                className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  weightDelta < 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400"
                }`}
              >
                {weightDelta < 0 ? "\u2193" : "\u2191"} {Math.abs(weightDelta)} lbs
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-zinc-400">
            as of {latestWeight.weekOf.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </section>
      )}

      {/* ── Coach Feedback ── */}
      {latestCoachMessage && (
        <Link
          href={`/client/messages/${formatDateUTC(latestCoachMessage.weekOf)}`}
          className="group animate-fade-in block overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-950/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:border-zinc-800/80 dark:bg-[#121215] dark:hover:border-zinc-700 dark:hover:shadow-zinc-950/30"
          style={{ animationDelay: "240ms" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Coach Feedback
            </p>
            <span className="text-xs font-medium text-zinc-400 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
              View &rarr;
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed line-clamp-2">
            {latestCoachMessage.body}
          </p>
        </Link>
      )}

      {/* ── Meal Plan ── */}
      {mealPlan && (
        <section
          className="animate-fade-in"
          style={{ animationDelay: "320ms" }}
          id="meal-plan"
          aria-labelledby="meal-plan-heading"
        >
          <h2
            id="meal-plan-heading"
            className="mb-5 text-lg font-semibold tracking-tight"
          >
            Your Meal Plan
          </h2>
          <SimpleMealPlan mealPlan={mealPlan} />
        </section>
      )}

      {/* ── Recent Check-Ins ── */}
      <section
        className="animate-fade-in"
        style={{ animationDelay: "400ms" }}
        aria-labelledby="checkins-heading"
      >
        <h2
          id="checkins-heading"
          className="mb-5 text-lg font-semibold tracking-tight"
        >
          Recent Check-Ins
        </h2>
        {checkIns.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-white px-8 py-16 text-center dark:border-zinc-700 dark:bg-[#121215]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-xl dark:bg-zinc-800">
              &#128203;
            </div>
            <div>
              <p className="text-sm font-semibold">No check-ins yet</p>
              <Link
                href="/client/check-in"
                className="mt-1.5 inline-block text-sm font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
              >
                Submit your first check-in
              </Link>
            </div>
          </div>
        ) : (
          <div className="stagger-children space-y-3">
            {checkIns.map((checkIn, idx) => {
              const prev = checkIns[idx + 1];
              const delta =
                prev?.weight && checkIn.weight
                  ? +(checkIn.weight - prev.weight).toFixed(1)
                  : null;

              return (
                <div
                  key={checkIn.id}
                  className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white px-5 py-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800/80 dark:bg-[#121215] dark:hover:border-zinc-700"
                >
                  {/* Weight */}
                  <div className="w-16 shrink-0">
                    {checkIn.weight ? (
                      <p className="text-xl font-bold tabular-nums leading-tight tracking-tight">
                        {checkIn.weight}
                        <span className="ml-0.5 text-[10px] font-normal text-zinc-400">lbs</span>
                      </p>
                    ) : (
                      <p className="text-xl font-bold text-zinc-200 dark:text-zinc-700">
                        &mdash;
                      </p>
                    )}
                  </div>

                  {/* Week + delta + notes */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {checkIn.weekOf.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {delta != null && delta !== 0 && (
                        <span
                          className={`ml-2 text-xs font-semibold ${
                            delta < 0
                              ? "text-emerald-500"
                              : "text-red-400"
                          }`}
                        >
                          {delta < 0 ? "\u2193" : "\u2191"} {Math.abs(delta)}
                        </span>
                      )}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
                      {checkIn._count.photos > 0 && (
                        <span>{checkIn._count.photos} photo{checkIn._count.photos > 1 ? "s" : ""}</span>
                      )}
                      {checkIn.notes && (
                        <span className="truncate max-w-[180px]">{checkIn.notes}</span>
                      )}
                    </div>
                  </div>

                  {/* Status + delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        checkIn.status === "REVIEWED"
                          ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
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

      {/* Become a Coach */}
      {!user.isCoach && (
        <div className="animate-fade-in" style={{ animationDelay: "480ms" }}>
          <BecomeCoachForm />
        </div>
      )}
    </div>
  );
}
