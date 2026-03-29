"use client";

interface ProfileData {
    headline?: string | null;
    bio?: string | null;
    experience?: string | null;
    certifications?: string | null;
    pricing?: string | null;
    services?: string[] | null;
    clientGoals?: string[] | null;
    acceptingClients?: boolean | null;
    coachingType?: string | null;
    location?: string | null;
}

interface CompletionProps {
    profile: ProfileData | null;
    hasPhoto: boolean;
    testimonialCount: number;
}

const CHECKLIST_ITEMS: {
    key: string;
    label: string;
    hint: string;
    check: (p: ProfileData | null, hasPhoto: boolean, tCount: number) => boolean;
}[] = [
    {
        key: "photo",
        label: "Profile photo",
        hint: "Coaches with a photo get 3× more profile views",
        check: (_p, hasPhoto) => hasPhoto,
    },
    {
        key: "headline",
        label: "Professional headline",
        hint: "First thing prospects see — make it count",
        check: (p) => !!p?.headline,
    },
    {
        key: "bio",
        label: "Coaching philosophy",
        hint: "Helps clients decide if you're the right fit",
        check: (p) => !!p?.bio,
    },
    {
        key: "experience",
        label: "Experience",
        hint: "Builds credibility and trust with new prospects",
        check: (p) => !!p?.experience,
    },
    {
        key: "services",
        label: "Services offered",
        hint: "Clients filter by service — show up in their search",
        check: (p) => (p?.services?.length ?? 0) > 0,
    },
    {
        key: "goals",
        label: "Client goals",
        hint: "Match with clients looking for your expertise",
        check: (p) => (p?.clientGoals?.length ?? 0) > 0,
    },
    {
        key: "pricing",
        label: "Pricing",
        hint: "Transparency increases inquiry conversion",
        check: (p) => !!p?.pricing,
    },
    {
        key: "testimonials",
        label: "Client testimonials",
        hint: "Verified reviews are the #1 trust signal",
        check: (_p, _h, t) => t > 0,
    },
    {
        key: "accepting",
        label: "Accepting clients",
        hint: "Enables the Request Coaching button on your page",
        check: (p) => !!p?.acceptingClients,
    },
];

export function ProfileCompletion({ profile, hasPhoto, testimonialCount }: CompletionProps) {
    const completed = CHECKLIST_ITEMS.filter((item) =>
        item.check(profile, hasPhoto, testimonialCount)
    ).length;
    const total = CHECKLIST_ITEMS.length;
    const pct = Math.round((completed / total) * 100);

    const strengthLabel =
        pct >= 80 ? "Strong" : pct >= 50 ? "Getting there" : "Needs work";

    return (
        <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-900">
                            Profile Strength
                        </h3>
                        <p className="mt-0.5 text-xs text-zinc-500">
                            Complete your profile to appear stronger in coach search
                        </p>
                    </div>
                    <div className="text-right">
                        <span className={`text-sm font-bold ${
                            pct >= 80 ? "text-emerald-600"
                            : pct >= 50 ? "text-amber-600"
                            : "text-zinc-500"
                        }`}>
                            {pct}%
                        </span>
                        <p className={`text-[10px] font-medium ${
                            pct >= 80 ? "text-emerald-600"
                            : pct >= 50 ? "text-amber-600"
                            : "text-zinc-400"
                        }`}>
                            {strengthLabel}
                        </p>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 80 ? "bg-emerald-500"
                            : pct >= 50 ? "bg-amber-500"
                            : "bg-zinc-400"
                        }`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
            <div className="px-6 py-4">
                <ul className="space-y-2.5">
                    {CHECKLIST_ITEMS.filter((item) => {
                        // When ≥80% complete, only show incomplete items
                        if (pct >= 80) {
                            return !item.check(profile, hasPhoto, testimonialCount);
                        }
                        return true;
                    }).map((item) => {
                        const done = item.check(profile, hasPhoto, testimonialCount);
                        return (
                            <li key={item.key} className="flex items-start gap-2.5">
                                {done ? (
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                    </span>
                                ) : (
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-300" />
                                )}
                                <div className="min-w-0">
                                    <span className={`text-sm ${done ? "font-medium text-zinc-700" : "text-zinc-400"}`}>
                                        {item.label}
                                    </span>
                                    {!done && (
                                        <p className="text-[11px] text-zinc-400">
                                            {item.hint}
                                        </p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
