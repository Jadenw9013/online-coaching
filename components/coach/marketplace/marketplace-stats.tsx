interface MarketplaceStatsProps {
    stats: {
        requests: {
            total: number;
            pending: number;
            approved: number;
        };
        reviews: {
            count: number;
            averageRating: number;
        };
    };
}

export function MarketplaceStats({ stats }: MarketplaceStatsProps) {
    const hasActivity = stats.requests.total > 0 || stats.reviews.count > 0;

    if (!hasActivity) {
        return (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-5">
                <p className="text-sm text-zinc-500">
                    No marketplace activity yet. Activity will appear here once prospects discover your profile.
                </p>
            </div>
        );
    }

    const items = [
        {
            label: "Total Requests",
            value: stats.requests.total,
            color: "text-zinc-100",
        },
        {
            label: "Needs Review",
            value: stats.requests.pending,
            color: stats.requests.pending > 0
                ? "text-amber-400"
                : "text-zinc-100",
        },
        {
            label: "Clients Converted",
            value: stats.requests.approved,
            color: "text-emerald-400",
        },
        {
            label: "Reviews",
            value: stats.reviews.count,
            color: "text-zinc-100",
        },
        {
            label: "Avg Rating",
            value: stats.reviews.averageRating > 0
                ? `${stats.reviews.averageRating.toFixed(1)} ★`
                : "—",
            color: "text-zinc-100",
        },
    ];

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Marketplace Performance
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                {items.map((item) => (
                    <div key={item.label}>
                        <dt className="text-[11px] font-medium text-zinc-500">
                            {item.label}
                        </dt>
                        <dd className={`mt-0.5 text-xl font-semibold ${item.color}`}>
                            {item.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
