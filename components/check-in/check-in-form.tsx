"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { PhotoUpload } from "./photo-upload";
import { createSignedUploadUrls } from "@/app/actions/storage";
import { createCheckIn } from "@/app/actions/check-in";

const formSchema = z.object({
  weekOf: z.string().min(1, "Required"),
  weight: z.string().min(1, "Weight is required"),
  dietCompliance: z.string().optional(),
  energyLevel: z.string().optional(),
  notes: z.string().max(5000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

function getDefaultWeekOf() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

export function CheckInForm({
  previousWeight,
}: {
  previousWeight: { weight: number; date: string } | null;
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<
    "idle" | "getting-urls" | "uploading" | "submitting"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [conflictModal, setConflictModal] = useState<{
    submittedAt: string;
    pendingValues: FormValues;
    pendingPhotoPaths: string[];
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weekOf: getDefaultWeekOf(),
    },
  });

  async function withRetry<T>(
    fn: () => Promise<T>,
    retries: number,
    delay: number
  ): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw new Error("Unreachable");
  }

  async function uploadPhotos(): Promise<string[]> {
    const photoPaths: string[] = [];
    if (files.length > 0) {
      setUploadState("getting-urls");
      const fileNames = files.map((f) => f.name);
      const uploadUrls = await withRetry(
        () => createSignedUploadUrls(fileNames),
        2,
        1000
      );

      setUploadState("uploading");
      await Promise.all(
        uploadUrls.map(async ({ signedUrl, path }, i) => {
          await withRetry(async () => {
            const res = await fetch(signedUrl, {
              method: "PUT",
              headers: {
                "Content-Type": files[i].type,
                "x-upsert": "true",
              },
              body: files[i],
            });
            if (!res.ok) throw new Error(`Failed to upload ${files[i].name}`);
          }, 1, 1000);
          photoPaths.push(path);
        })
      );
    }
    return photoPaths;
  }

  async function submitCheckIn(
    values: FormValues,
    photoPaths: string[],
    overwriteToday?: boolean
  ) {
    setUploadState("submitting");

    const result = await createCheckIn({
      weekOf: values.weekOf,
      weight: parseFloat(values.weight),
      dietCompliance: values.dietCompliance ? parseInt(values.dietCompliance) : undefined,
      energyLevel: values.energyLevel ? parseInt(values.energyLevel) : undefined,
      notes: values.notes,
      photoPaths,
      overwriteToday,
    });

    if ("error" in result && result.error) {
      const messages = Object.values(result.error)
        .filter((v): v is string[] => Array.isArray(v))
        .flat()
        .join(", ");
      setError(messages || "Validation failed");
      return;
    }

    if ("conflict" in result && result.conflict) {
      setConflictModal({
        submittedAt: result.conflict.existing.submittedAt,
        pendingValues: values,
        pendingPhotoPaths: photoPaths,
      });
      return;
    }

    if ("overwritten" in result && result.overwritten) {
      setToast("Check-in updated.");
      setTimeout(() => {
        router.push("/client");
        router.refresh();
      }, 1200);
      return;
    }

    router.push("/client");
    router.refresh();
  }

  async function onSubmit(values: FormValues) {
    setError(null);
    setUploadState("getting-urls");

    try {
      const photoPaths = await uploadPhotos();
      // First attempt without overwriteToday — server will return conflict if exists
      await submitCheckIn(values, photoPaths, undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploadState("idle");
    }
  }

  async function handleOverwrite() {
    if (!conflictModal) return;
    const { pendingValues, pendingPhotoPaths } = conflictModal;
    setConflictModal(null);
    setError(null);
    setUploadState("submitting");

    try {
      await submitCheckIn(pendingValues, pendingPhotoPaths, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploadState("idle");
    }
  }

  async function handleAddNew() {
    if (!conflictModal) return;
    const { pendingValues, pendingPhotoPaths } = conflictModal;
    setConflictModal(null);
    setError(null);
    setUploadState("submitting");

    try {
      await submitCheckIn(pendingValues, pendingPhotoPaths, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploadState("idle");
    }
  }

  const previousDateLabel = previousWeight
    ? new Date(previousWeight.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const buttonLabel =
    uploadState === "getting-urls"
      ? "Preparing upload..."
      : uploadState === "uploading"
        ? "Uploading photos..."
        : uploadState === "submitting"
          ? "Saving check-in..."
          : "Submit Check-In";

  const conflictTimeLabel = conflictModal
    ? new Date(conflictModal.submittedAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* 3-button conflict modal */}
      {conflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-lg font-bold">
              You already checked in today
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              You submitted a check-in at {conflictTimeLabel} today. What would you like to do?
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={handleOverwrite}
                className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Overwrite today&apos;s check-in
              </button>
              <button
                onClick={handleAddNew}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Add as new check-in
              </button>
              <button
                onClick={() => setConflictModal(null)}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <fieldset className="space-y-5">
          <legend className="sr-only">Check-in details</legend>

          {/* Week selector — compact */}
          <div>
            <label htmlFor="weekOf" className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
              Week Of
            </label>
            <input
              id="weekOf"
              type="date"
              {...register("weekOf")}
              aria-invalid={errors.weekOf ? "true" : undefined}
              aria-describedby={errors.weekOf ? "weekOf-error" : undefined}
              className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus-visible:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
            {errors.weekOf && (
              <p id="weekOf-error" className="mt-1 text-sm text-red-500">{errors.weekOf.message}</p>
            )}
          </div>

          {/* Weight — most prominent field */}
          <div>
            <label htmlFor="weight" className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
              Weight (lbs) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <input
                id="weight"
                type="number"
                step="0.1"
                placeholder="185.5"
                {...register("weight")}
                aria-invalid={errors.weight ? "true" : undefined}
                aria-describedby={errors.weight ? "weight-error" : "weight-hint"}
                className="block flex-1 rounded-lg border border-zinc-300 px-3 py-2.5 text-lg font-semibold tabular-nums focus-visible:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
              <div
                id="weight-hint"
                className="shrink-0 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800"
              >
                <p className="text-xs text-zinc-400">Previous</p>
                {previousWeight ? (
                  <p className="text-sm font-semibold tabular-nums">
                    {previousWeight.weight}
                    <span className="ml-1 text-xs font-normal text-zinc-400">
                      {previousDateLabel}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-zinc-400">&mdash;</p>
                )}
              </div>
            </div>
            {errors.weight && (
              <p id="weight-error" className="mt-1 text-sm text-red-500">{errors.weight.message}</p>
            )}
          </div>

          {/* Compliance + Energy — secondary */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dietCompliance" className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
                Diet (1-10)
              </label>
              <select
                id="dietCompliance"
                {...register("dietCompliance")}
                aria-invalid={errors.dietCompliance ? "true" : undefined}
                aria-describedby={errors.dietCompliance ? "dietCompliance-error" : undefined}
                className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus-visible:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">Select...</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              {errors.dietCompliance && (
                <p id="dietCompliance-error" className="mt-1 text-sm text-red-500">{errors.dietCompliance.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="energyLevel" className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
                Energy (1-10)
              </label>
              <select
                id="energyLevel"
                {...register("energyLevel")}
                aria-invalid={errors.energyLevel ? "true" : undefined}
                aria-describedby={errors.energyLevel ? "energyLevel-error" : undefined}
                className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus-visible:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">Select...</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              {errors.energyLevel && (
                <p id="energyLevel-error" className="mt-1 text-sm text-red-500">{errors.energyLevel.message}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register("notes")}
              placeholder="How was your week? Any changes in energy, sleep, hunger?"
              aria-invalid={errors.notes ? "true" : undefined}
              aria-describedby={errors.notes ? "notes-error" : undefined}
              className="block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus-visible:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
            {errors.notes && (
              <p id="notes-error" className="mt-1 text-sm text-red-500">{errors.notes.message}</p>
            )}
          </div>
        </fieldset>

        <PhotoUpload files={files} onFilesChange={setFiles} />

        <button
          type="submit"
          disabled={uploadState !== "idle"}
          className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {buttonLabel}
        </button>
      </form>
    </>
  );
}
