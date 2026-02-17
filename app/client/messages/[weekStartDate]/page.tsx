import { getCurrentDbUser } from "@/lib/auth/roles";
import { getMessages } from "@/lib/queries/messages";
import { parseWeekStartDate } from "@/lib/utils/date";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageThread } from "@/components/messages/message-thread";

export default async function ClientMessagesPage({
  params,
}: {
  params: Promise<{ weekStartDate: string }>;
}) {
  const { weekStartDate } = await params;
  const user = await getCurrentDbUser();

  let weekOf: Date;
  try {
    weekOf = parseWeekStartDate(weekStartDate);
  } catch {
    notFound();
  }

  const messages = await getMessages(user.id, weekOf);
  const serializedMessages = messages.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    sender: m.sender,
  }));

  const weekLabel = weekOf.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/client"
          className="inline-flex items-center text-sm text-zinc-500 transition-colors hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-zinc-500">Week of {weekLabel}</p>
      </div>

      <MessageThread
        messages={serializedMessages}
        clientId={user.id}
        weekStartDate={weekStartDate}
        currentUserId={user.id}
      />
    </div>
  );
}
