import { getPublishedCoaches } from "@/lib/queries/marketplace";
import { getProfilePhotoUrl } from "@/lib/supabase/profile-photo-storage";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CoachFilters } from "@/components/public/coach-filters";
import { SaveCoachButton } from "@/components/public/save-coach-button";
import { getSavedCoachIds } from "@/lib/queries/saved-coaches";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Find a Coach | Steadfast",
    description: "Browse our directory of professional Steadfast coaches and find the right fit for your goals.",
};

interface PageProps {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function CoachesDirectoryPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const coaches = await getPublishedCoaches({
        goal: params.goal,
        type: params.type,
        accepting: params.accepting === "1",
        service: params.service,
        clientType: params.clientType,
        minRating: params.minRating ? Number(params.minRating) : undefined,
        sort: params.sort,
        q: params.q,
    });

    // Resolve profile photos
    const coachesWithPhotos = await Promise.all(
        coaches.map(async (profile) => {
            let avatarUrl: string | null = null;
            if (profile.user.profilePhotoPath) {
                try { avatarUrl = await getProfilePhotoUrl(profile.user.profilePhotoPath); } catch { /* */ }
            }
            return { ...profile, avatarUrl };
        })
    );

    // Resolve saved coach IDs (auth-aware — public page)
    let savedIds: Set<string> | null = null;
    try {
        const { getCurrentDbUser } = await import("@/lib/auth/roles");
        const user = await getCurrentDbUser();
        savedIds = await getSavedCoachIds(user.id);
    } catch { /* not logged in — no save buttons */ }

    // Collect active filters for chips display
    const activeFilters: { key: string; label: string; paramKey: string }[] = [];
    if (params.goal) activeFilters.push({ key: "goal", label: params.goal, paramKey: "goal" });
    if (params.type) activeFilters.push({ key: "type", label: params.type === "in-person" ? "In-Person" : params.type.charAt(0).toUpperCase() + params.type.slice(1), paramKey: "type" });
    if (params.service) activeFilters.push({ key: "service", label: params.service, paramKey: "service" });
    if (params.clientType) activeFilters.push({ key: "clientType", label: params.clientType, paramKey: "clientType" });
    if (params.minRating) activeFilters.push({ key: "minRating", label: `${params.minRating}+ stars`, paramKey: "minRating" });
    if (params.accepting === "1") activeFilters.push({ key: "accepting", label: "Accepting clients", paramKey: "accepting" });
    if (params.q) activeFilters.push({ key: "q", label: `"${params.q}"`, paramKey: "q" });

    const hasFilters = activeFilters.length > 0;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#020815]">
            {/* ── Nav ── */}
            <header className="sticky top-0 z-30 bg-zinc-50 dark:bg-[#020815]">
                <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
                    <Link
                        href="/"
                        className="group flex items-center gap-2.5"
                        aria-label="Steadfast home"
                    >
                        <div className="relative h-7 w-7 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8">
                            <Image
                                src="/brand/Steadfast_logo_pictoral.png"
                                alt=""
                                fill
                                priority
                                className="object-contain brightness-0 dark:brightness-100"
                            />
                        </div>
                        <span className="hidden font-display text-xs font-bold uppercase tracking-[0.25em] text-gray-900 dark:text-gray-100 sm:inline">Steadfast</span>
                    </Link>
                    <nav className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link
                            href="/sign-in"
                            className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/sign-up"
                            className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-sm active:scale-[0.97] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                        >
                            Get Started
                        </Link>
                    </nav>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300/60 to-transparent dark:via-gray-700/40" />
            </header>

            <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8" id="main-content">
                <div className="mb-12">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-zinc-900 dark:text-zinc-100">
                            Find your coach
                        </h1>
                        <span className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                            Beta
                        </span>
                    </div>
                    <p className="mt-3 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
                        Browse verified coaches and find the right fit for your goals.
                    </p>

                    {/* ── Search Input ── */}
                    <form action="/coaches" method="GET" className="mt-6 max-w-md">
                        {/* Preserve existing filters when searching */}
                        {Object.entries(params).filter(([k, v]) => k !== "q" && v).map(([k, v]) => (
                            <input key={k} type="hidden" name={k} value={v} />
                        ))}
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            <input
                                type="text"
                                name="q"
                                defaultValue={params.q || ""}
                                placeholder="Search by name, specialty, or keyword..."
                                className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-700 dark:bg-[#0a1224] dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500"
                            />
                        </div>
                    </form>
                </div>

                {/* ── Mobile Filters ── */}
                <div className="lg:hidden">
                    <Suspense>
                        <CoachFilters />
                    </Suspense>
                </div>

                <div className="flex gap-8">
                    {/* ── Desktop Filter Sidebar ── */}
                    <div className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-24 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-[#0a1224]">
                            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Filters</h3>
                            <Suspense>
                                <CoachFilters />
                            </Suspense>
                        </div>
                    </div>

                    {/* ── Coach Grid ── */}
                    <div className="flex-1">
                        {/* Result count + active chips */}
                        <div className="mb-5">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {coachesWithPhotos.length} {coachesWithPhotos.length === 1 ? "coach" : "coaches"}{hasFilters ? " matching filters" : " available"}
                            </p>
                            {activeFilters.length > 0 && (
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    {activeFilters.map((f) => (
                                        <Link
                                            key={f.key}
                                            href={`/coaches?${new URLSearchParams(
                                                Object.entries(params).filter(([k, v]) => k !== f.paramKey && v !== undefined) as [string, string][]
                                            ).toString()}`}
                                            className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
                                        >
                                            {f.label}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                        </Link>
                                    ))}
                                    <Link
                                        href="/coaches"
                                        className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                                    >
                                        Clear all
                                    </Link>
                                </div>
                            )}
                        </div>

                        {coaches.length === 0 ? (
                            <div className="rounded-2xl border border-zinc-200 border-dashed bg-white p-12 text-center dark:border-zinc-800 dark:bg-[#0a1224]">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                </div>
                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {hasFilters ? "No coaches match your filters" : "No coaches are listed yet"}
                                </p>
                                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                                    {hasFilters
                                        ? "Try adjusting your filters to see more results."
                                        : "Our first coaches are setting up their profiles. Check back soon or create an account to be ready when they launch."}
                                </p>
                                {hasFilters ? (
                                    <Link
                                        href="/coaches"
                                        className="mt-6 inline-block rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                                    >
                                        Clear Filters
                                    </Link>
                                ) : (
                                    <Link
                                        href="/sign-up"
                                        className="mt-6 inline-block rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                                    >
                                        Create Free Account
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="stagger-children grid gap-5 sm:grid-cols-2">
                                {coachesWithPhotos.map((profile) => (
                                    <Link
                                        key={profile.id}
                                        href={`/coaches/${profile.slug}`}
                                        className="group relative flex flex-col rounded-2xl border border-zinc-200/60 bg-white p-5 transition-all duration-200 hover:border-zinc-300/80 hover:shadow-md hover:-translate-y-0.5 dark:border-zinc-800/60 dark:bg-[#0a1224] dark:hover:border-zinc-700 dark:hover:shadow-zinc-900/30"
                                    >
                                        {/* Save button */}
                                        {savedIds !== null && (
                                            <div className="absolute top-4 right-4 z-10">
                                                <SaveCoachButton coachProfileId={profile.id} initialSaved={savedIds.has(profile.id)} />
                                            </div>
                                        )}

                                        {/* Avatar + Name + Headline */}
                                        <div className="flex items-start gap-4">
                                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-2 ring-zinc-200/80 dark:bg-zinc-800 dark:ring-zinc-700/80">
                                                {profile.avatarUrl ? (
                                                    <Image
                                                        src={profile.avatarUrl}
                                                        alt={`${profile.user.firstName} ${profile.user.lastName}`}
                                                        width={64}
                                                        height={64}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-zinc-500 dark:text-zinc-400">
                                                        {profile.user.firstName?.[0]}{profile.user.lastName?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 pt-1">
                                                <h2 className="text-base font-bold text-zinc-900 transition-colors group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300 truncate">
                                                    {profile.user.firstName} {profile.user.lastName}
                                                </h2>
                                                {profile.headline && (
                                                    <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400 truncate">
                                                        {profile.headline}
                                                    </p>
                                                )}
                                                {/* Inline meta */}
                                                <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                                                    {profile.ratingSummary.totalReviews > 0 && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{profile.ratingSummary.averageRating.toFixed(1)}</span>
                                                            <span>({profile.ratingSummary.totalReviews})</span>
                                                        </span>
                                                    )}
                                                    {profile.acceptingClients ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                            Available
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                            Full
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bio excerpt */}
                                        {profile.bio && (
                                            <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                                {profile.bio}
                                            </p>
                                        )}

                                        {/* Tags */}
                                        {profile.clientGoals.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {profile.clientGoals.slice(0, 3).map((goal, i) => (
                                                    <span key={i} className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                        {goal}
                                                    </span>
                                                ))}
                                                {profile.clientGoals.length > 3 && (
                                                    <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                                                        +{profile.clientGoals.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Footer — Pricing + View */}
                                        <div className="mt-auto pt-4 flex items-center justify-between">
                                            {profile.pricing ? (
                                                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                    {profile.pricing}
                                                </span>
                                            ) : (
                                                <span />
                                            )}
                                            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors">
                                                View Profile &rarr;
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
