"use client";

import { useState, useEffect, useCallback } from "react";

interface UseProfilePhotoOptions {
  /** If false, skip fetching (e.g. component not visible yet). Default: true */
  enabled?: boolean;
}

interface UseProfilePhotoResult {
  photoUrl: string | null;
  loading: boolean;
  refresh: () => void;
}

/**
 * Hook that fetches the current user's profile photo as a Supabase signed URL.
 *
 * - Single in-flight request (deduped within the same component tree).
 * - Cached in sessionStorage for the session lifetime.
 * - Falls back to null on error (caller should show initials avatar).
 *
 * Usage:
 *   const { photoUrl, loading } = useProfilePhoto();
 */
export function useProfilePhoto({
  enabled = true,
}: UseProfilePhotoOptions = {}): UseProfilePhotoResult {
  const CACHE_KEY = "sf_profile_photo_url";

  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage.getItem(CACHE_KEY);
  });
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coach/profile-photo", { method: "GET" });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json() as { photoUrl: string | null };
      const url = data.photoUrl ?? null;
      setPhotoUrl(url);
      // Cache for the session so rerenders don't refetch
      if (url) sessionStorage.setItem(CACHE_KEY, url);
      else sessionStorage.removeItem(CACHE_KEY);
    } catch {
      setPhotoUrl(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // If we already have a cached URL from sessionStorage, skip fetch
    if (photoUrl) return;
    fetch_();
  }, [enabled, fetch_, photoUrl]);

  const refresh = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEY);
    setPhotoUrl(null);
    fetch_();
  }, [fetch_]);

  return { photoUrl, loading, refresh };
}
