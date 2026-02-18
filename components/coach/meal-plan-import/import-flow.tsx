"use client";

import { useState } from "react";
import { UploadStep } from "./upload-step";
import { DraftReview } from "./draft-review";

type Step = "upload" | "processing" | "review";

const steps = [
  { key: "upload" as const, label: "Upload" },
  { key: "processing" as const, label: "Process" },
  { key: "review" as const, label: "Review" },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <nav aria-label="Import progress" className="mb-8">
      <ol className="flex items-center gap-2">
        {steps.map((step, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <li key={step.key} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-6 sm:w-10 ${
                    isComplete
                      ? "bg-zinc-900 dark:bg-zinc-100"
                      : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                  aria-hidden="true"
                />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isComplete
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : isCurrent
                        ? "bg-zinc-900 text-white ring-2 ring-zinc-900/20 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100/20"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? "\u2713" : i + 1}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:inline ${
                    isCurrent
                      ? "text-zinc-900 dark:text-zinc-100"
                      : isComplete
                        ? "text-zinc-600 dark:text-zinc-400"
                        : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function ImportFlow({ clientId }: { clientId: string }) {
  const [step, setStep] = useState<Step>("upload");
  const [uploadId, setUploadId] = useState<string | null>(null);

  // UploadStep handles both "upload" and "processing" internally
  const visualStep: Step =
    step === "upload" ? "upload" : step === "review" ? "review" : "processing";

  return (
    <div>
      <StepIndicator current={visualStep} />

      {(step === "upload" || step === "processing") && (
        <UploadStep
          clientId={clientId}
          onProcessing={() => setStep("processing")}
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
