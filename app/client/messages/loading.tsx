export default function MessagesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Messages</h1>
        <span className="sf-section-label mt-1 block">
          <span className="inline-block h-4 w-40 animate-pulse rounded bg-white/[0.06]" />
        </span>
      </div>

      <div className="sf-glass-card overflow-hidden">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="h-8 w-8 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-3 w-16 animate-pulse rounded bg-white/[0.04]" />
          </div>
        </div>

        {/* Chat body skeleton */}
        <div className="flex flex-col gap-3 px-4 py-6" style={{ minHeight: "360px" }}>
          {/* Loading indicator */}
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 animate-spin text-blue-500/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-medium text-zinc-500">Loading messages…</span>
            </div>
          </div>
        </div>

        {/* Input skeleton */}
        <div className="border-t border-white/[0.06] px-4 py-3">
          <div className="flex items-end gap-2">
            <div className="h-10 flex-1 animate-pulse rounded-xl bg-white/[0.04]" />
            <div className="h-10 w-10 animate-pulse rounded-xl bg-white/[0.04]" />
          </div>
        </div>
      </div>
    </div>
  );
}
