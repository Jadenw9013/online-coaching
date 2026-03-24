"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ProfilePhotoUploaderProps {
  /** Current signed photo URL to display. Null = show initials. */
  currentPhotoUrl: string | null;
  /** User's display name initials for the fallback avatar */
  initials: string;
  /** Called after a successful upload with the new signed URL */
  onUploadSuccess: (newPhotoUrl: string) => void;
  /** Called after successful removal */
  onRemoveSuccess: () => void;
}

const ACCEPTED = "image/jpeg,image/jpg,image/png,image/webp";
const MAX_MB = 5;

export function ProfilePhotoUploader({
  currentPhotoUrl,
  initials,
  onUploadSuccess,
  onRemoveSuccess,
}: ProfilePhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview ?? currentPhotoUrl;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please choose a JPEG, PNG, or WebP file.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB} MB.`);
      return;
    }

    // Optimistic preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/coach/profile-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json() as { success?: boolean; photoUrl?: string; error?: string };

      if (!res.ok || !data.success) {
        setPreview(null);
        setError(data.error ?? "Upload failed. Please try again.");
        return;
      }

      // Replace optimistic blob URL with canonical signed URL from server
      URL.revokeObjectURL(localUrl);
      setPreview(null);
      if (data.photoUrl) {
        onUploadSuccess(data.photoUrl);
      }
    } catch {
      setPreview(null);
      setError("Network error — please try again.");
    } finally {
      setUploading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setError(null);
    setRemoving(true);
    try {
      const res = await fetch("/api/coach/profile-photo", { method: "DELETE" });
      if (!res.ok) {
        setError("Could not remove photo. Please try again.");
        return;
      }
      setPreview(null);
      onRemoveSuccess();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setRemoving(false);
    }
  }

  const busy = uploading || removing;

  return (
    <div className="flex items-center gap-5">
      {/* Avatar preview */}
      <div
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-white/[0.08] ring-offset-2 ring-offset-[#0a1224]"
        aria-label="Profile photo preview"
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Your profile photo"
            fill
            className="object-cover"
            unoptimized // signed URLs vary; skip Next.js image optimization
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-lg font-bold text-zinc-300 select-none">
            {initials}
          </div>
        )}

        {/* Loading overlay */}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          id="profile-photo-input"
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          aria-label="Choose a profile photo"
          onChange={handleFileChange}
          disabled={busy}
        />

        <label
          htmlFor="profile-photo-input"
          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all focus-within:ring-2 focus-within:ring-zinc-500 focus-within:ring-offset-2 focus-within:ring-offset-[#0a1224] ${
            busy
              ? "cursor-not-allowed border-white/[0.04] bg-zinc-900 text-zinc-600"
              : "border-white/[0.08] bg-zinc-800 text-zinc-200 hover:border-white/[0.14] hover:bg-zinc-700 active:scale-[0.97]"
          }`}
          style={{ minHeight: "44px" }}
        >
          {uploading ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-zinc-500 border-t-zinc-200" />
              Uploading…
            </>
          ) : (
            <>
              {/* Camera icon */}
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
                aria-hidden="true"
              >
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              {currentPhotoUrl ? "Change Photo" : "Upload Photo"}
            </>
          )}
        </label>

        {/* Remove button — only show when a photo exists */}
        {(currentPhotoUrl || preview) && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1224] ${
              busy
                ? "cursor-not-allowed text-zinc-600"
                : "text-zinc-500 hover:text-red-400 active:scale-[0.97]"
            }`}
            style={{ minHeight: "44px" }}
          >
            {removing ? "Removing…" : "Remove Photo"}
          </button>
        )}

        {/* Error / hint text */}
        <p
          className={`text-xs leading-snug ${error ? "text-red-400" : "text-zinc-500"}`}
          role={error ? "alert" : undefined}
          aria-live="polite"
        >
          {error ?? "JPEG, PNG or WebP · max 5 MB"}
        </p>
      </div>
    </div>
  );
}
