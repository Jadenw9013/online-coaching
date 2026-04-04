"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { removeClient } from "@/app/actions/coach-client";
import { useRouter } from "next/navigation";

export function RemoveClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isConfirmed = confirmText.toUpperCase() === "REMOVE" && acknowledged;

  function handleClose() {
    setOpen(false);
    setConfirmText("");
    setAcknowledged(false);
    setError(null);
  }

  async function handleRemove() {
    if (!isConfirmed) return;
    setRemoving(true);
    setError(null);
    try {
      await removeClient({ clientId });
      setOpen(false);
      router.push("/coach/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove client");
    } finally {
      setRemoving(false);
    }
  }

  const modal = open ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-client-title"
      aria-describedby="remove-client-desc"
      style={{ position: "fixed" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={handleClose}
      />

      {/* Dialog card */}
      <div
        className="relative w-full max-w-md shadow-2xl"
        style={{
          background: "linear-gradient(145deg, rgba(30,30,35,0.98), rgba(20,20,25,0.98))",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1.25rem",
          padding: "2rem",
        }}
      >
        {/* Warning icon */}
        <div
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
          </svg>
        </div>

        <h2
          id="remove-client-title"
          style={{ fontSize: "1.125rem", fontWeight: 600, color: "#f87171", marginBottom: "0.5rem" }}
        >
          Remove {clientName}?
        </h2>
        <p
          id="remove-client-desc"
          style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#a1a1aa", marginBottom: "1.25rem" }}
        >
          This will remove <strong style={{ color: "#e4e4e7" }}>{clientName}</strong> from
          your coaching roster. They will no longer appear in your inbox or
          receive updates from you.
        </p>

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "0.75rem",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              fontSize: "0.875rem", color: "#f87171",
            }}
          >
            {error}
          </div>
        )}

        {/* Type REMOVE */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="remove-confirm-input"
            style={{
              display: "block", fontSize: "0.7rem", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a",
              marginBottom: "0.5rem",
            }}
          >
            Type <span style={{ fontFamily: "monospace", color: "#d4d4d8" }}>REMOVE</span> to confirm
          </label>
          <input
            id="remove-confirm-input"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="REMOVE"
            autoComplete="off"
            autoFocus
            style={{
              width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem",
              background: "rgba(39,39,42,0.5)", border: "1px solid rgba(113,113,122,0.3)",
              fontFamily: "monospace", fontSize: "max(1rem, 16px)",
              textTransform: "uppercase", letterSpacing: "0.15em",
              color: "#f4f4f5", outline: "none",
            }}
          />
        </div>

        {/* Acknowledgment checkbox */}
        <label
          style={{
            display: "flex", alignItems: "flex-start", gap: "0.75rem",
            cursor: "pointer", marginBottom: "1.5rem",
          }}
        >
          <div
            onClick={(e) => { e.preventDefault(); setAcknowledged(!acknowledged); }}
            style={{
              flexShrink: 0, width: 20, height: 20, marginTop: 2, borderRadius: 6,
              border: `1.5px solid ${acknowledged ? "#f87171" : "rgba(113,113,122,0.5)"}`,
              background: acknowledged ? "rgba(239,68,68,0.15)" : "rgba(39,39,42,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            {acknowledged && (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </div>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
          />
          <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#a1a1aa" }}>
            I understand this does not delete the client&apos;s historical
            check-ins or meal plans.
          </span>
        </label>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: "0.625rem 1.25rem", borderRadius: "0.75rem",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              fontSize: "0.875rem", fontWeight: 600, color: "#d4d4d8",
              cursor: "pointer", minHeight: 40, transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={!isConfirmed || removing}
            style={{
              padding: "0.625rem 1.25rem", borderRadius: "0.75rem",
              background: isConfirmed && !removing ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.05)",
              border: `1px solid ${isConfirmed && !removing ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.1)"}`,
              fontSize: "0.875rem", fontWeight: 600,
              color: isConfirmed && !removing ? "#f87171" : "rgba(248,113,113,0.3)",
              cursor: isConfirmed && !removing ? "pointer" : "not-allowed",
              minHeight: 40, transition: "all 0.15s ease",
            }}
          >
            {removing ? "Removing…" : "Remove Client"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        style={{ minHeight: 40 }}
      >
        Remove Client
      </button>

      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}
