import { createServiceClient } from "./server";

// Reuse existing bucket, different path prefix
const BUCKET = "meal-plan-uploads";

export function isBucketMissing(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("bucket not found") ||
    lower.includes("the related resource does not exist") ||
    (lower.includes("not found") && lower.includes("bucket"))
  );
}

export async function createWorkoutUploadUrl(
  storagePath: string
): Promise<{ signedUrl: string; token: string }> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    if (isBucketMissing(error?.message)) {
      throw new Error(
        `Storage bucket "${BUCKET}" not found. Create it in Supabase Dashboard → Storage → New bucket → "${BUCKET}" (private).`
      );
    }
    throw new Error(`Failed to create upload URL: ${error?.message}`);
  }

  return { signedUrl: data.signedUrl, token: data.token };
}

export async function downloadWorkoutFile(
  storagePath: string
): Promise<ArrayBuffer> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(storagePath);

  if (error || !data) {
    if (isBucketMissing(error?.message)) {
      throw new Error(
        `Storage bucket "${BUCKET}" not found. Create it in Supabase Dashboard.`
      );
    }
    throw new Error(`Failed to download file: ${error?.message}`);
  }

  return data.arrayBuffer();
}
