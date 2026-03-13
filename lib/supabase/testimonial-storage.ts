import { createServiceClient } from "./server";

const BUCKET = "testimonial-images";

function isBucketMissing(message: string | undefined): boolean {
    if (!message) return false;
    const lower = message.toLowerCase();
    return (
        lower.includes("bucket not found") ||
        lower.includes("does not exist") ||
        (lower.includes("not found") && lower.includes("bucket"))
    );
}

/**
 * Generate a signed upload URL for a testimonial image.
 * Called from a secure API route after validating file type/size.
 */
export async function createTestimonialImageUploadUrl(
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

/**
 * Get a signed read URL for a testimonial image (1hr TTL).
 */
export async function getTestimonialImageUrl(
    storagePath: string
): Promise<string> {
    const supabase = createServiceClient();

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 60 * 60); // 1hr TTL

    if (error || !data) {
        throw new Error(`Failed to get testimonial image URL: ${error?.message}`);
    }

    return data.signedUrl;
}

/**
 * Delete a testimonial image from storage.
 */
export async function deleteTestimonialImage(
    storagePath: string
): Promise<void> {
    const supabase = createServiceClient();

    const { error } = await supabase.storage
        .from(BUCKET)
        .remove([storagePath]);

    if (error) {
        console.error("[testimonial-images] Delete error:", error.message);
    }
}
