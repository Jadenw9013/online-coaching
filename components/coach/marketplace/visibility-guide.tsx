"use client";

interface VisibilityGuideProps {
    isPublished: boolean;
    acceptingClients: boolean;
}

export function VisibilityGuide({ isPublished, acceptingClients }: VisibilityGuideProps) {
    // Determine current state
    const state = !isPublished
        ? "private"
        : acceptingClients
            ? "live"
            : "visible";

    return (
        <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-[#0a1224]">
            <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Profile Visibility
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Control how your profile appears to prospective clients
                </p>
            </div>
            <div className="px-6 py-4 space-y-3">
                {/* State 1: Private */}
                <div className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    state === "private"
                        ? "bg-zinc-100 dark:bg-zinc-800/60"
                        : ""
                }`}>
                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        state === "private"
                            ? "bg-zinc-500"
                            : "border border-zinc-300 dark:border-zinc-600"
                    }`}>
                        {state === "private" && (
                            <span className="h-2 w-2 rounded-full bg-white" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className={`text-sm font-medium ${
                            state === "private"
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-400 dark:text-zinc-500"
                        }`}>
                            Hidden (Draft)
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            Your profile is private. Only you can see it. Complete your profile at your own pace before going live.
                        </p>
                    </div>
                </div>

                {/* State 2: Public but not accepting */}
                <div className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    state === "visible"
                        ? "bg-amber-50 dark:bg-amber-500/5"
                        : ""
                }`}>
                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        state === "visible"
                            ? "bg-amber-500"
                            : "border border-zinc-300 dark:border-zinc-600"
                    }`}>
                        {state === "visible" && (
                            <span className="h-2 w-2 rounded-full bg-white" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className={`text-sm font-medium ${
                            state === "visible"
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-400 dark:text-zinc-500"
                        }`}>
                            Visible · Not Accepting
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            Your profile is public and appears in coach search — but prospective clients see a &ldquo;Currently Full&rdquo; badge and can join your waitlist instead.
                        </p>
                    </div>
                </div>

                {/* State 3: Public + accepting */}
                <div className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    state === "live"
                        ? "bg-emerald-50 dark:bg-emerald-500/5"
                        : ""
                }`}>
                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        state === "live"
                            ? "bg-emerald-500"
                            : "border border-zinc-300 dark:border-zinc-600"
                    }`}>
                        {state === "live" && (
                            <span className="h-2 w-2 rounded-full bg-white" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className={`text-sm font-medium ${
                            state === "live"
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-400 dark:text-zinc-500"
                        }`}>
                            Live · Accepting Clients
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            You appear in coach search and prospective clients can request coaching directly. Your &ldquo;Request Coaching&rdquo; button is active.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
