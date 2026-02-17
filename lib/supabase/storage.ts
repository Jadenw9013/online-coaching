import { createServiceClient } from "./server";

const BUCKET = "check-in-photos";

export async function createSignedUploadUrls(
  paths: string[]
): Promise<{ path: string; signedUrl: string; token: string }[]> {
  const supabase = createServiceClient();
  const results: { path: string; signedUrl: string; token: string }[] = [];

  for (const path of paths) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      if (error?.message?.includes("Bucket not found")) {
        throw new Error(
          `Storage bucket "${BUCKET}" not found. Please verify your Supabase storage configuration.`
        );
      }
      throw new Error(`Failed to create upload URL for ${path}: ${error?.message}`);
    }

    results.push({
      path,
      signedUrl: data.signedUrl,
      token: data.token,
    });
  }

  return results;
}

export async function getSignedDownloadUrl(
  storagePath: string
): Promise<string> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60); // 1 hour TTL

  if (error || !data) {
    throw new Error(`Failed to get download URL: ${error?.message}`);
  }

  return data.signedUrl;
}
