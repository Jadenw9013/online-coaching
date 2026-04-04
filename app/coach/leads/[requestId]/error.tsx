"use client";

export default function LeadDetailError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="mx-auto max-w-2xl py-12 px-4 space-y-4">
            <div className="sf-glass-card p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
                        <p className="text-sm text-zinc-400">
                            There was a problem loading this lead&apos;s details. This is typically a temporary issue.
                        </p>
                        {error.digest && (
                            <p className="text-xs text-zinc-500 font-mono">Digest: {error.digest}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => reset()}
                        className="sf-button-primary"
                        style={{ minHeight: "44px" }}
                    >
                        Try Again
                    </button>
                    <a
                        href="/coach/leads"
                        className="sf-button-secondary flex items-center justify-center"
                        style={{ minHeight: "44px" }}
                    >
                        ← Back to Leads
                    </a>
                </div>
            </div>
        </div>
    );
}
