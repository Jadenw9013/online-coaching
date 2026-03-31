import { getCurrentDbUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import Link from "next/link";
import { getMessages } from "@/lib/queries/messages";
import { normalizeToMonday } from "@/lib/utils/date";
import { MessageThread } from "@/components/messages/message-thread";

export default async function ClientMessagesPage() {
  const user = await getCurrentDbUser();

  const coachClient = await db.coachClient.findFirst({
    where: { clientId: user.id },
    select: { id: true, coachId: true },
  });

  if (!coachClient) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Messages</h1>
        </div>
        <div
          className="sf-surface-card flex flex-col items-center gap-5 px-8 py-20 text-center"
          style={{ "--sf-card-highlight": "rgba(59, 91, 219, 0.08)", "--sf-card-atmosphere": "#0e1420" } as React.CSSProperties}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/60">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-zinc-100">Messages requires a coach</p>
            <p className="text-sm text-zinc-400">Once you connect with a coach, this will unlock automatically.</p>
          </div>
          <Link href="/coaches" className="sf-button-primary block" style={{ minHeight: "48px" }}>
            Find a Coach
          </Link>
        </div>
      </div>
    );
  }

  const weekOf = normalizeToMonday(new Date());
  const messages = await getMessages(user.id, weekOf);

  const serializedMessages = messages.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    sender: m.sender,
  }));

  // Format weekStartDate as YYYY-MM-DD
  const weekStartDate = weekOf.toISOString().slice(0, 10);

  const weekLabel = weekOf.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Messages</h1>
        <span className="sf-section-label mt-1 block">Week of {weekLabel}</span>
      </div>

      <MessageThread
        messages={serializedMessages}
        clientId={user.id}
        weekStartDate={weekStartDate}
        currentUserId={user.id}
        alwaysExpanded={true}
      />
    </div>
  );
}
