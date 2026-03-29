"use client";

import { useState } from "react";
import { UploadStep } from "./upload-step";
import { PasteTextStep } from "./paste-text-step";
import { DraftReview } from "./draft-review";

type Step = "input" | "processing" | "review";
type InputMode = "upload" | "paste";

const steps = [
  { key: "input" as const, label: "Input" },
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
                      ? "bg-zinc-900"
                      : "bg-zinc-200"
                  }`}
                  aria-hidden="true"
                />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isComplete
                      ? "bg-zinc-900 text-white"
                      : isCurrent
                        ? "bg-zinc-900 text-white ring-2 ring-zinc-900/20"
                        : "bg-zinc-100 text-zinc-400"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? "\u2713" : i + 1}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:inline ${
                    isCurrent
                      ? "text-zinc-900"
                      : isComplete
                        ? "text-zinc-600"
                        : "text-zinc-400"
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

function InputModeToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: InputMode;
  onChange: (mode: InputMode) => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`mb-6 inline-flex rounded-lg bg-zinc-100 p-1 ${
        disabled ? "pointer-events-none opacity-60" : ""
      }`}
      role="radiogroup"
      aria-label="Input method"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === "upload"}
        onClick={() => onChange("upload")}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
          mode === "upload"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        Upload File
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === "paste"}
        onClick={() => onChange("paste")}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
          mode === "paste"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        Paste Text
      </button>
    </div>
  );
}

export function ImportFlow({ clientId }: { clientId: string }) {
  const [step, setStep] = useState<Step>("input");
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [uploadId, setUploadId] = useState<string | null>(null);

  const visualStep: Step =
    step === "input" ? "input" : step === "review" ? "review" : "processing";

  const isProcessing = step === "processing";

  return (
    <div>
      <StepIndicator current={visualStep} />

      {(step === "input" || step === "processing") && (
        <>
          <InputModeToggle
            mode={inputMode}
            onChange={setInputMode}
            disabled={isProcessing}
          />

          {inputMode === "upload" ? (
            <UploadStep
              clientId={clientId}
              onProcessing={() => setStep("processing")}
              onDraftReady={(id) => {
                setUploadId(id);
                setStep("review");
              }}
            />
          ) : (
            <PasteTextStep
              clientId={clientId}
              onProcessing={() => setStep("processing")}
              onDraftReady={(id) => {
                setUploadId(id);
                setStep("review");
              }}
            />
          )}
        </>
      )}

      {step === "review" && uploadId && (
        <DraftReview
          uploadId={uploadId}
          clientId={clientId}
          onBack={() => {
            setStep("input");
            setUploadId(null);
          }}
        />
      )}
    </div>
  );
}
