"use client";

import { useState, useRef, useCallback } from "react";
import { InboxClientCard, type InboxClient } from "./inbox-client-card";
import { reorderClients } from "@/app/actions/coach-client";

type Filter = "all" | "new" | "reviewed" | "missing";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "reviewed", label: "Reviewed" },
  { key: "missing", label: "Missing" },
];

export function CoachInbox({ clients }: { clients: InboxClient[] }) {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [orderedClients, setOrderedClients] = useState<InboxClient[]>(clients);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const dragIndexRef = useRef<number | null>(null);
  const prevOrderRef = useRef<InboxClient[]>(clients);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDragEnabled = activeFilter === "all" && !query.trim();

  const isMissing = (c: InboxClient) =>
    c.weekStatus === "missing" || c.cadenceStatus === "overdue";

  const tabFiltered =
    activeFilter === "all"
      ? orderedClients
      : activeFilter === "missing"
      ? orderedClients.filter(isMissing)
      : activeFilter === "reviewed"
      ? orderedClients.filter((c) => c.weekStatus === "reviewed" && c.cadenceStatus !== "overdue")
      : orderedClients.filter((c) => c.weekStatus === activeFilter);

  const filtered = query.trim()
    ? tabFiltered.filter((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase())
      )
    : tabFiltered;

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

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, clientId: string, index: number) {
    dragIndexRef.current = index;
    prevOrderRef.current = [...orderedClients];
    setDraggingId(clientId);
    e.dataTransfer.effectAllowed = "move";

    // Custom ghost: transparent 1×1 pixel so default browser ghost disappears
    const ghost = document.createElement("div");
    ghost.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const from = dragIndexRef.current;
    if (from === null || from === index) return;

    setDropTargetIndex(index);
    dragIndexRef.current = index;

    setOrderedClients((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  }

  function handleDragEnd() {
    const newOrder = [...orderedClients];
    setDraggingId(null);
    setDropTargetIndex(null);
    dragIndexRef.current = null;

    // Debounce the save to avoid hammering on rapid drops
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      reorderClients({ orderedClientIds: newOrder.map((c) => c.id) }).catch(() => {
        setOrderedClients(prevOrderRef.current);
      });
    }, 300);
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Search clients…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500"
          aria-label="Search clients by name"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        )}
      </div>

      {/* Filter bar — horizontally scrollable on mobile */}
      <div
        className="flex gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1 scrollbar-none dark:bg-zinc-800/60"
        role="tablist"
        aria-label="Filter clients"
      >
        {filters.map((f, i) => {
          const count =
            f.key === "all"
              ? clients.length
              : f.key === "missing"
              ? clients.filter((c) => c.weekStatus === "missing" || c.cadenceStatus === "overdue").length
              : f.key === "reviewed"
              ? clients.filter((c) => c.weekStatus === "reviewed" && c.cadenceStatus !== "overdue").length
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
              className={`min-h-[44px] shrink-0 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
                activeFilter === f.key
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {f.label}
              <span
                className={`ml-1.5 inline-block min-w-[1.25rem] rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                  f.key === "new"
                    ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                    : f.key === "reviewed"
                    ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : f.key === "missing"
                    ? "bg-zinc-200/60 text-zinc-500 dark:bg-zinc-700/60 dark:text-zinc-400"
                    : "bg-zinc-200/60 dark:bg-zinc-700/60"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Client cards */}
      <div role="tabpanel">
        {filtered.length === 0 ? (
          <div className="animate-fade-in flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-400">
              {query ? `No clients match "${query}"` : "No clients match this filter"}
            </p>
            <p className="text-xs text-zinc-400/70">
              {query ? "Try a different name." : "Try selecting a different category above."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((client, index) => {
              const isDragging = draggingId === client.id;
              const isDropTarget = dropTargetIndex === index && draggingId !== null && !isDragging;

              return (
                <div
                  key={client.id}
                  draggable={isDragEnabled}
                  onDragStart={isDragEnabled ? (e) => handleDragStart(e, client.id, index) : undefined}
                  onDragOver={isDragEnabled ? (e) => handleDragOver(e, index) : undefined}
                  onDragEnd={isDragEnabled ? handleDragEnd : undefined}
                  style={{ transition: "opacity 150ms ease, transform 150ms ease" }}
                  className={[
                    "group flex items-center gap-2",
                    isDragEnabled ? "cursor-default" : "",
                    isDragging ? "opacity-40 scale-[0.98]" : "opacity-100 scale-100",
                    isDropTarget ? "translate-y-0" : "",
                  ].join(" ")}
                >
                  {/* Grip handle */}
                  {isDragEnabled && (
                    <div
                      className="flex h-8 w-5 flex-shrink-0 cursor-grab items-center justify-center rounded active:cursor-grabbing"
                      aria-hidden="true"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="16"
                        viewBox="0 0 12 20"
                        fill="currentColor"
                        className="text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400"
                      >
                        <circle cx="4" cy="3" r="1.5" />
                        <circle cx="8" cy="3" r="1.5" />
                        <circle cx="4" cy="10" r="1.5" />
                        <circle cx="8" cy="10" r="1.5" />
                        <circle cx="4" cy="17" r="1.5" />
                        <circle cx="8" cy="17" r="1.5" />
                      </svg>
                    </div>
                  )}

                  {/* Drop indicator line above this card */}
                  <div className="min-w-0 flex-1">
                    {isDropTarget && (
                      <div className="mb-1.5 h-0.5 w-full rounded-full bg-blue-500/60" />
                    )}
                    <InboxClientCard client={client} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hint */}
      {isDragEnabled && orderedClients.length > 1 && (
        <p className="text-center text-xs text-zinc-400/50">
          Drag to reorder · Saved automatically
        </p>
      )}
    </div>
  );
}
