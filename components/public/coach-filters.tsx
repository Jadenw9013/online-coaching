"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

const GOAL_OPTIONS = [
    "Fat loss", "Muscle gain", "Bodybuilding prep", "Lifestyle fitness",
    "Strength training", "Powerlifting", "Athletic performance", "Body recomposition",
];

const COACHING_MODE_OPTIONS = [
    { value: "online", label: "Online" },
    { value: "in-person", label: "In-Person" },
    { value: "hybrid", label: "Hybrid" },
];

const SERVICE_TIER_OPTIONS = [
    { value: "training-only", label: "Training only" },
    { value: "nutrition-only", label: "Nutrition only" },
    { value: "full-coaching", label: "Full coaching" },
];

const SERVICE_OPTIONS = [
    "Custom workout plans", "Custom meal plans", "Weekly check-ins",
    "Messaging support", "Form video reviews", "Contest prep",
    "Supplement guidance", "Lifestyle coaching", "Habit coaching",
];

const CLIENT_TYPE_OPTIONS = [
    "Beginner", "Intermediate", "Advanced", "Competitors",
];

const SORT_OPTIONS = [
    { value: "", label: "Best Match" },
    { value: "rating", label: "Top Rated" },
    { value: "newest", label: "Recently Added" },
];

export function CoachFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showMore, setShowMore] = useState(false);

    const currentGoal = searchParams.get("goal") ?? "";
    const currentType = searchParams.get("type") ?? "";
    const currentServiceTier = searchParams.get("serviceTier") ?? "";
    const currentService = searchParams.get("service") ?? "";
    const currentClientType = searchParams.get("clientType") ?? "";
    const currentMinRating = searchParams.get("minRating") ?? "";
    const currentSort = searchParams.get("sort") ?? "";
    const currentZip = searchParams.get("zip") ?? "";
    const acceptingOnly = searchParams.get("accepting") === "1";

    // Local zip input state — only commits to URL on Enter or blur
    const [zipInput, setZipInput] = useState(currentZip);
    useEffect(() => { setZipInput(currentZip); }, [currentZip]);

    const commitZip = useCallback(() => {
        const clean = zipInput.replace(/\D/g, "").slice(0, 5);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("city"); // clear legacy city param
        if (clean.length === 5) {
            params.set("zip", clean);
        } else {
            params.delete("zip");
        }
        router.push(`/coaches?${params.toString()}`);
    }, [zipInput, router, searchParams]);

    const updateFilter = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            router.push(`/coaches?${params.toString()}`);
        },
        [router, searchParams]
    );

    const clearAll = useCallback(() => {
        router.push("/coaches");
    }, [router]);

    // Show location input only when in-person or hybrid mode is selected
    const showLocationInput = currentType === "in-person" || currentType === "hybrid";

    const hasFilters = currentGoal || currentType || currentServiceTier || currentService || currentClientType || currentMinRating || currentSort || acceptingOnly || currentZip;
    const activeFilterCount = [currentGoal, currentType, currentServiceTier, currentService, currentClientType, currentMinRating, acceptingOnly ? "1" : "", currentZip].filter(Boolean).length;

    const hasSecondaryFilter = currentService || currentClientType || currentMinRating;
    const isMoreOpen = showMore || !!hasSecondaryFilter;

    const pillBase = "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200";
    const pillActive = "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30";
    const pillInactive = "border border-white/[0.07] bg-white/[0.04] text-zinc-400 hover:border-white/[0.14] hover:bg-white/[0.08] hover:text-zinc-200";

    const filterContent = (
        <div className="space-y-6">
            {/* Sort */}
            <div>
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sort</p>
                <div className="flex flex-wrap gap-1.5">
                    {SORT_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button"
                            onClick={() => updateFilter("sort", currentSort === opt.value ? "" : opt.value)}
                            className={`${pillBase} ${currentSort === opt.value || (!currentSort && !opt.value) ? pillActive : pillInactive}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Accepting new clients — promoted to top */}
            <label className="flex cursor-pointer items-center gap-2">
                <input
                    type="checkbox"
                    checked={acceptingOnly}
                    onChange={(e) => updateFilter("accepting", e.target.checked ? "1" : "")}
                    className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30"
                />
                <span className="text-xs font-medium text-zinc-300">Accepting new clients only</span>
            </label>

            {/* Goal */}
            <div>
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Goal</p>
                <div className="flex flex-wrap gap-1.5">
                    {GOAL_OPTIONS.map((goal) => (
                        <button key={goal} type="button"
                            onClick={() => updateFilter("goal", currentGoal === goal ? "" : goal)}
                            className={`${pillBase} ${currentGoal === goal ? pillActive : pillInactive}`}>
                            {goal}
                        </button>
                    ))}
                </div>
            </div>

            {/* Coaching Mode */}
            <div>
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Coaching Mode</p>
                <div className="flex flex-wrap gap-1.5">
                    {COACHING_MODE_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button"
                            onClick={() => updateFilter("type", currentType === opt.value ? "" : opt.value)}
                            className={`${pillBase} ${currentType === opt.value ? pillActive : pillInactive}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Zip code input — only shown for in-person / hybrid */}
                {showLocationInput && (
                    <div className="mt-3">
                        <label htmlFor="zip-filter" className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            Near zip code
                        </label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <input
                                id="zip-filter"
                                type="text"
                                inputMode="numeric"
                                maxLength={5}
                                value={zipInput}
                                onChange={(e) => setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5))}
                                onBlur={commitZip}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitZip(); } }}
                                placeholder="e.g. 98004"
                                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-600 transition-colors focus:border-blue-500/40 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                            />
                            {currentZip && (
                                <button
                                    type="button"
                                    onClick={() => { setZipInput(""); updateFilter("zip", ""); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                    aria-label="Clear zip"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                            )}
                        </div>
                        <p className="mt-1 text-[10px] text-zinc-600">
                            {currentZip ? "Showing coaches near this zip code" : "Enter zip to find coaches near you"}
                        </p>
                    </div>
                )}
            </div>

            {/* Service Tier */}
            <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Services</p>
                <p className="mb-2 text-[10px] text-zinc-600">What kind of coaching do you need?</p>
                <div className="flex flex-wrap gap-1.5">
                    {SERVICE_TIER_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button"
                            onClick={() => updateFilter("serviceTier", currentServiceTier === opt.value ? "" : opt.value)}
                            className={`${pillBase} ${currentServiceTier === opt.value ? pillActive : pillInactive}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── More Filters (collapsible) ── */}
            <div>
                <button
                    type="button"
                    onClick={() => setShowMore(!isMoreOpen)}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isMoreOpen ? "rotate-180" : ""}`}>
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                    {isMoreOpen ? "Fewer filters" : "More filters"}
                    {hasSecondaryFilter && !showMore && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-bold text-white">
                            {[currentService, currentClientType, currentMinRating].filter(Boolean).length}
                        </span>
                    )}
                </button>

                {isMoreOpen && (
                    <div className="mt-4 space-y-5 border-t border-white/[0.06] pt-4">
                        {/* Service tags (specific) */}
                        <div>
                            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Service Tag</p>
                            <div className="flex flex-wrap gap-1.5">
                                {SERVICE_OPTIONS.map((svc) => (
                                    <button key={svc} type="button"
                                        onClick={() => updateFilter("service", currentService === svc ? "" : svc)}
                                        className={`${pillBase} ${currentService === svc ? pillActive : pillInactive}`}>
                                        {svc}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Client Level */}
                        <div>
                            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Client Level</p>
                            <div className="flex flex-wrap gap-1.5">
                                {CLIENT_TYPE_OPTIONS.map((ct) => (
                                    <button key={ct} type="button"
                                        onClick={() => updateFilter("clientType", currentClientType === ct ? "" : ct)}
                                        className={`${pillBase} ${currentClientType === ct ? pillActive : pillInactive}`}>
                                        {ct}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Min Rating */}
                        <div>
                            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Min Rating</p>
                            <div className="flex flex-wrap gap-1.5">
                                {[3, 4, 5].map((r) => (
                                    <button key={r} type="button"
                                        onClick={() => updateFilter("minRating", currentMinRating === String(r) ? "" : String(r))}
                                        className={`flex items-center gap-1 ${pillBase} ${currentMinRating === String(r) ? pillActive : pillInactive}`}>
                                        {r}+
                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-amber-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Clear */}
            {hasFilters && (
                <button type="button" onClick={clearAll} className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300">
                    Clear all filters
                </button>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop */}
            <div className="hidden lg:block">{filterContent}</div>

            {/* Mobile toggle */}
            <div className="lg:hidden mb-4">
                <button
                    type="button"
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" /><line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" /><line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" /><line x1="2" x2="6" y1="14" y2="14" /><line x1="10" x2="14" y1="8" y2="8" /><line x1="18" x2="22" y1="16" y2="16" /></svg>
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Mobile drawer */}
            {showMobileFilters && (
                <div className="lg:hidden mb-6 rounded-2xl border border-white/[0.07] bg-[#0d1428] p-5">
                    {filterContent}
                    <button
                        type="button"
                        onClick={() => setShowMobileFilters(false)}
                        className="mt-5 w-full rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500">
                        Done
                    </button>
                </div>
            )}
        </>
    );
}
