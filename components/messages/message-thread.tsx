"use client";

import { useState, useRef, useEffect } from "react";
import { sendMessage } from "@/app/actions/messages";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    activeRole: string;
  };
};

export function MessageThread({
  messages,
  clientId,
  weekStartDate,
  currentUserId,
}: {
  messages: Message[];
  clientId: string;
  weekStartDate: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, expanded]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setSending(true);
    try {
      await sendMessage({ clientId, weekStartDate, body: body.trim() });
      setBody("");
      router.refresh();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }

  // Most recent message for preview in collapsed state
  const latestMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const previewSender = latestMsg
    ? `${latestMsg.sender.firstName ?? "User"}${latestMsg.sender.activeRole === "COACH" ? " (Coach)" : ""}`
    : null;
  const previewBody = latestMsg ? latestMsg.body.slice(0, 60) + (latestMsg.body.length > 60 ? "…" : "") : null;

  return (
    <section
      className="flex flex-col rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      aria-label="Messages"
    >
      {/* Collapsible header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between border-b border-zinc-200 px-4 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
        aria-expanded={expanded}
        aria-controls="message-thread-body"
      >
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="shrink-0 text-xs font-semibold uppercase tracking-wider text-zinc-500">Messages</h3>
          {/* Latest message preview — visible when collapsed */}
          {!expanded && latestMsg && (
            <span className="truncate text-xs text-zinc-400">
              <span className="font-medium text-zinc-500">{previewSender}:</span>{" "}
              {previewBody}
            </span>
          )}
          {!expanded && !latestMsg && (
            <span className="text-xs text-zinc-400">No messages yet</span>
          )}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 ml-2 text-zinc-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Expanded chat body */}
      {expanded && (
        <div id="message-thread-body">
          <div
            className="flex-1 space-y-3 overflow-y-auto p-4"
            style={{ maxHeight: "320px" }}
            role="log"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <p className="text-center text-sm text-zinc-400">No messages yet</p>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender.id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        isOwn
                          ? "bg-zinc-900 text-white dark:bg-blue-600 dark:text-white"
                          : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                      }`}
                    >
                      <p className="mb-0.5 text-xs font-medium opacity-70">
                        {msg.sender.firstName ?? "User"}
                        {msg.sender.activeRole === "COACH" ? " (Coach)" : ""}
                      </p>
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                      <p className="mt-1 text-xs opacity-50">
                        {new Date(msg.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
          >
            <label htmlFor="message-input" className="sr-only">
              Type a message
            </label>
            <input
              id="message-input"
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm transition-colors focus-visible:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <button
              type="submit"
              disabled={sending || !body.trim()}
              aria-label="Send message"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-gradient-to-r dark:from-blue-600 dark:to-blue-500 dark:text-white dark:shadow-lg dark:shadow-blue-500/20 dark:hover:brightness-110"
            >
              {sending ? "..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
