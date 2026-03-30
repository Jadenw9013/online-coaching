export default function CoachMessagesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Messages</h1>
        <p className="mt-1 text-sm text-zinc-500">Your client conversations</p>
      </div>

      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="sf-glass-card flex items-center gap-3 p-4 sm:gap-4 sm:p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-48 animate-pulse rounded bg-white/[0.04]" />
            </div>
            <div className="h-3 w-12 animate-pulse rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
