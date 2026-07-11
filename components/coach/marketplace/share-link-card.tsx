"use client";

import { useState } from "react";

export function ShareLinkCard({ slug }: { slug: string }) {
    const [copied, setCopied] = useState(false);
    const fullUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/coaches/${slug}`;

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const input = document.createElement("input");
            input.value = fullUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-zinc-100">Your Public Coaching Page</h3>
                    <p className="text-xs text-zinc-500">Share this link so clients can learn about your coaching.</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 truncate">
                    /coaches/{slug}
                </div>
                <button
                    type="button"
                    onClick={handleCopy}
                    className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${copied
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-zinc-100 text-zinc-900 hover:bg-white"
                        }`}
                >
                    {copied ? "✓ Copied" : "Copy Link"}
                </button>
            </div>
        </div>
    );
}
