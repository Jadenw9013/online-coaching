"use client";

import { useState } from "react";
import { UploadStep } from "./upload-step";
import { DraftReview } from "./draft-review";

export function ImportFlow({ clientId }: { clientId: string }) {
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [uploadId, setUploadId] = useState<string | null>(null);

  return (
    <div>
      {step === "upload" && (
        <UploadStep
          clientId={clientId}
          onDraftReady={(id) => {
            setUploadId(id);
            setStep("review");
          }}
        />
      )}
      {step === "review" && uploadId && (
        <DraftReview
          uploadId={uploadId}
          clientId={clientId}
          onBack={() => {
            setStep("upload");
            setUploadId(null);
          }}
        />
      )}
    </div>
  );
}
