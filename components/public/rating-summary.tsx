interface RatingSummaryProps {
    averageRating: number;
    totalReviews: number;
}

export function RatingSummary({ averageRating, totalReviews }: RatingSummaryProps) {
    if (totalReviews === 0) return null;

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={averageRating >= star ? "currentColor" : averageRating >= star - 0.5 ? "url(#half)" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className={averageRating >= star - 0.5 ? "text-amber-400" : "text-zinc-300"}
                    >
                        <defs>
                            <linearGradient id="half">
                                <stop offset="50%" stopColor="currentColor" />
                                <stop offset="50%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                ))}
            </div>
            <span className="text-sm font-semibold text-zinc-900">
                {averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-zinc-500">
                ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
            </span>
        </div>
    );
}
