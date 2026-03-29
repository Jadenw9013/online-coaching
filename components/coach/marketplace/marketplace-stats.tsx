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
            <div className="rounded-2xl border border-zinc-200/80 bg-white px-5 py-5">
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
            color: "text-zinc-900",
        },
        {
            label: "Needs Review",
            value: stats.requests.pending,
            color: stats.requests.pending > 0
                ? "text-amber-600"
                : "text-zinc-900",
        },
        {
            label: "Clients Converted",
            value: stats.requests.approved,
            color: "text-emerald-600",
        },
        {
            label: "Reviews",
            value: stats.reviews.count,
            color: "text-zinc-900",
        },
        {
            label: "Avg Rating",
            value: stats.reviews.averageRating > 0
                ? `${stats.reviews.averageRating.toFixed(1)} ★`
                : "—",
            color: "text-zinc-900",
        },
    ];

    return (
        <div className="rounded-2xl border border-zinc-200/80 bg-white px-5 py-5">
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
