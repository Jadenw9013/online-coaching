import { verifyCoachAccessToClient } from "@/lib/queries/check-ins";
import { getClientCheckIns } from "@/lib/queries/check-ins";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ClientCheckInsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  await verifyCoachAccessToClient(clientId);

  const client = await db.user.findUnique({ where: { id: clientId } });
  if (!client) notFound();

  const checkIns = await getClientCheckIns(clientId);

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/coach/clients/${clientId}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        >
          &larr; Back to profile
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {client.firstName} {client.lastName}
        </h1>
        <p className="text-sm text-zinc-500">{client.email}</p>
      </div>

      {checkIns.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500">No check-ins from this client yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checkIns.map((checkIn) => (
            <Link
              key={checkIn.id}
              href={`/coach/clients/${clientId}/check-ins/${checkIn.id}`}
              className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    Week of{" "}
                    {checkIn.weekOf.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <div className="mt-1 flex gap-4 text-sm text-zinc-500">
                    {checkIn.weight && <span>{checkIn.weight} lbs</span>}
                    {checkIn.photos.length > 0 && (
                      <span>{checkIn.photos.length} photo(s)</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-zinc-400">
                  {checkIn.createdAt.toLocaleDateString()}
                </p>
              </div>
              {checkIn.notes && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {checkIn.notes}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
