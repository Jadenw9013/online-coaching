"use client";

import { useState, useRef, useCallback } from "react";
import { InboxClientCard, type InboxClient } from "./inbox-client-card";

type Filter = "all" | "new" | "reviewed" | "missing";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "reviewed", label: "Reviewed" },
  { key: "missing", label: "Missing" },
];

export function CoachInbox({ clients }: { clients: InboxClient[] }) {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const filtered =
    activeFilter === "all"
      ? clients
      : clients.filter((c) => c.weekStatus === activeFilter);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex: number | null = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (index + 1) % filters.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (index - 1 + filters.length) % filters.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = filters.length - 1;
      }
      if (nextIndex !== null) {
        setActiveFilter(filters[nextIndex].key);
        tabsRef.current[nextIndex]?.focus();
      }
    },
    []
  );

  return (
    <div>
      {/* Filter bar */}
      <div className="flex gap-1.5 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50" role="tablist" aria-label="Filter clients">
        {filters.map((f, i) => {
          const count =
            f.key === "all"
              ? clients.length
              : clients.filter((c) => c.weekStatus === f.key).length;
          return (
            <button
              key={f.key}
              ref={(el) => { tabsRef.current[i] = el; }}
              role="tab"
              aria-selected={activeFilter === f.key}
              tabIndex={activeFilter === f.key ? 0 : -1}
              onClick={() => setActiveFilter(f.key)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
                activeFilter === f.key
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs tabular-nums opacity-60">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Client list */}
      <div className="mt-4 space-y-2" role="tabpanel">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            No clients match this filter.
          </p>
        ) : (
          filtered.map((client) => (
            <InboxClientCard key={client.id} client={client} />
          ))
        )}
      </div>
    </div>
  );
}
