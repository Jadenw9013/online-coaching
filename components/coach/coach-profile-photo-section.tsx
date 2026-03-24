"use client";

import { useState } from "react";
import { ProfilePhotoUploader } from "./profile-photo-uploader";

interface CoachProfilePhotoSectionProps {
  /** Initial signed URL or null (comes from server component) */
  initialPhotoUrl: string | null;
  /** User's first and last name initial for fallback avatar */
  initials: string;
}

/**
 * Stateful wrapper that manages the current photo URL in React state.
 * Receives the initial URL from the server component (SSR), then
 * updates locally in response to upload/remove actions.
 */
export function CoachProfilePhotoSection({
  initialPhotoUrl,
  initials,
}: CoachProfilePhotoSectionProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);

  return (
    <ProfilePhotoUploader
      currentPhotoUrl={photoUrl}
      initials={initials}
      onUploadSuccess={(newUrl) => setPhotoUrl(newUrl)}
      onRemoveSuccess={() => setPhotoUrl(null)}
    />
  );
}
