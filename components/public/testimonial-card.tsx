import Image from "next/image";

interface TestimonialCardProps {
    rating: number;
    reviewText: string;
    clientFirstName: string | null;
    clientLastName: string | null;
    createdAt: Date;
    imageUrls?: string[];
}

export function TestimonialCard({
    rating,
    reviewText,
    clientFirstName,
    clientLastName,
    createdAt,
    imageUrls,
}: TestimonialCardProps) {
    const clientName =
        `${clientFirstName ?? ""} ${clientLastName ?? ""}`.trim() || "Client";
    const initials =
        `${clientFirstName?.[0] ?? ""}${clientLastName?.[0] ?? ""}`.toUpperCase() || "?";

    const dateStr = new Date(createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
    });

    const hasImages = imageUrls && imageUrls.length > 0;

    return (
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-[#0a1224]">
            {/* Stars */}
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill={rating >= star ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className={rating >= star ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"}
                    >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                ))}
            </div>

            {/* Review text */}
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                &ldquo;{reviewText}&rdquo;
            </p>

            {/* Image grid */}
            {hasImages && (
                <div className={`mt-3 grid gap-2 ${
                    imageUrls.length === 1 ? "grid-cols-1" :
                    imageUrls.length === 2 ? "grid-cols-2" :
                    "grid-cols-2 sm:grid-cols-3"
                }`}>
                    {imageUrls.map((url, i) => (
                        <div
                            key={i}
                            className="relative aspect-square overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800"
                        >
                            <Image
                                src={url}
                                alt={`Review photo ${i + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, 200px"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Author */}
            <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {initials}
                </div>
                <div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {clientName}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            Verified Client
                        </span>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            · {dateStr}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
