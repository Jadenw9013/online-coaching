import Link from "next/link";
import { CheckInForm } from "@/components/check-in/check-in-form";
import { getCurrentDbUser } from "@/lib/auth/roles";
import { getPreviousBodyweight } from "@/lib/queries/check-ins";
import { getCurrentWeekMonday } from "@/lib/utils/date";

export default async function ClientCheckInPage() {
  const user = await getCurrentDbUser();
  const previousWeight = await getPreviousBodyweight(
    user.id,
    getCurrentWeekMonday()
  );

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/client"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Back to dashboard"
        >
          &larr;
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Weekly Check-In
          </h1>
          <p className="text-xs text-zinc-500">
            Log your progress for the week
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <CheckInForm
          previousWeight={
            previousWeight
              ? {
                  weight: previousWeight.weight!,
                  weekOf: previousWeight.weekOf.toISOString(),
                }
              : null
          }
        />
      </div>
    </div>
  );
}
