/**
 * Google Cloud Vision OCR via REST API.
 *
 * Env vars:
 *   GOOGLE_CLOUD_VISION_API_KEY — API key for Vision API
 *
 * Supports both images (png/jpg/webp) and PDFs via Vision API.
 * No browser-only dependencies (no pdfjs-dist, no DOMMatrix).
 */

const VISION_IMAGES_URL = "https://vision.googleapis.com/v1/images:annotate";
const VISION_FILES_URL = "https://vision.googleapis.com/v1/files:annotate";

type OcrErrorCode = "OCR_MISSING_KEY" | "OCR_BILLING_DISABLED" | "OCR_FAILED" | "OCR_UNSUPPORTED_FILE" | "OCR_NO_TEXT";

class OcrError extends Error {
  code: OcrErrorCode;
  constructor(code: OcrErrorCode, message: string) {
    super(message);
    this.name = "OcrError";
    this.code = code;
  }
}

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    throw new OcrError(
      "OCR_MISSING_KEY",
      "GOOGLE_CLOUD_VISION_API_KEY is not set. Add it to your environment variables."
    );
  }
  return apiKey;
}

function handleVisionError(statusCode: number, body: string): never {
  if (body.includes("billing") || body.includes("BILLING_DISABLED") || body.includes("403")) {
    throw new OcrError("OCR_BILLING_DISABLED", "Google Cloud Vision billing is not enabled for this project.");
  }
  throw new OcrError("OCR_FAILED", `Google Vision API error (${statusCode})`);
}

/**
 * Unified text extraction: routes to image OCR or PDF OCR based on MIME type.
 */
export async function extractText(
  fileBytes: ArrayBuffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractTextFromPdf(fileBytes);
  }
  if (mimeType.startsWith("image/")) {
    return extractTextFromImage(fileBytes);
  }
  throw new OcrError("OCR_UNSUPPORTED_FILE", `Unsupported file type for OCR: ${mimeType}`);
}

/**
 * Extract text from an image using Vision API DOCUMENT_TEXT_DETECTION.
 */
export async function extractTextFromImage(
  imageBytes: ArrayBuffer
): Promise<string> {
  const apiKey = getApiKey();
  const base64 = Buffer.from(imageBytes).toString("base64");

  const response = await fetch(`${VISION_IMAGES_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
          imageContext: { languageHints: ["en"] },
        },
      ],
    }),
  });

  if (!response.ok) {
    handleVisionError(response.status, await response.text());
  }

  const result = await response.json();
  const annotation = result.responses?.[0];

  if (annotation?.error) {
    throw new OcrError("OCR_FAILED", `Vision API error: ${annotation.error.message}`);
  }

  const text = annotation?.fullTextAnnotation?.text ?? "";

  if (!text.trim()) {
    throw new OcrError(
      "OCR_NO_TEXT",
      "No text detected in image. Ensure the image contains readable text."
    );
  }

  return text;
}

/**
 * Extract text from a PDF using Vision API files:annotate endpoint.
 * Supports up to 5 pages per request (sufficient for meal plan documents).
 * Runs entirely server-side — no browser APIs required.
 */
async function extractTextFromPdf(
  pdfBytes: ArrayBuffer
): Promise<string> {
  const apiKey = getApiKey();
  const base64 = Buffer.from(pdfBytes).toString("base64");

  const response = await fetch(`${VISION_FILES_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          inputConfig: {
            content: base64,
            mimeType: "application/pdf",
          },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          // Process up to 5 pages (meal plans are typically 1-2 pages)
          pages: [1, 2, 3, 4, 5],
        },
      ],
    }),
  });

  if (!response.ok) {
    handleVisionError(response.status, await response.text());
  }

  const result = await response.json();
  const fileResponse = result.responses?.[0];

  if (fileResponse?.error) {
    throw new OcrError("OCR_FAILED", `Vision API error: ${fileResponse.error.message}`);
  }

  // files:annotate returns nested responses — one per page
  const pageResponses = fileResponse?.responses ?? [];
  const pageTexts: string[] = [];

  for (const page of pageResponses) {
    const pageText = page?.fullTextAnnotation?.text ?? "";
    if (pageText.trim()) {
      pageTexts.push(pageText.trim());
    }
  }

  const combined = pageTexts.join("\n\n");

  if (!combined.trim()) {
    throw new OcrError(
      "OCR_NO_TEXT",
      "No text detected in PDF. The document may be scanned at low quality or contain only images without text."
    );
  }

  return combined;
}
