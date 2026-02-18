/**
 * Google Cloud Vision OCR via REST API.
 *
 * Env vars:
 *   GOOGLE_CLOUD_VISION_API_KEY — API key for Vision API
 *   (Alternative: GOOGLE_CLOUD_VISION_JSON — service account JSON for OAuth)
 *
 * For MVP, uses API key auth which is simplest to set up.
 */

const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

export async function extractTextFromImage(
  imageBytes: ArrayBuffer
): Promise<string> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_CLOUD_VISION_API_KEY is not set. Add it to your environment variables."
    );
  }

  const base64 = Buffer.from(imageBytes).toString("base64");

  const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
          imageContext: {
            languageHints: ["en"],
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Vision API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const annotation = result.responses?.[0];

  if (annotation?.error) {
    throw new Error(`Vision API error: ${annotation.error.message}`);
  }

  const text = annotation?.fullTextAnnotation?.text ?? "";

  if (!text.trim()) {
    throw new Error(
      "No text detected in image. Ensure the image contains readable text."
    );
  }

  return text;
}

/**
 * Extract text from a PDF with selectable text using pdf-parse.
 * Falls back gracefully if PDF has no selectable text.
 */
export async function extractTextFromPdf(
  pdfBytes: ArrayBuffer
): Promise<string> {
  // pdf-parse v2 internally uses pdfjs-dist/legacy/build/pdf.mjs which is
  // Node.js-compatible. Do NOT import "pdfjs-dist" directly here — its main
  // entry point requires browser APIs (DOMMatrix) that don't exist in Node.js.
  const { PDFParse, VerbosityLevel } = await import("pdf-parse");
  const buffer = Buffer.from(pdfBytes);
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    verbosity: VerbosityLevel.ERRORS,
  } as ConstructorParameters<typeof PDFParse>[0]);
  const result = await parser.getText();
  const text = result.text?.trim() ?? "";

  if (text.length < 20) {
    throw new Error(
      "This PDF has little or no selectable text. Try uploading a screenshot/photo of the meal plan instead."
    );
  }

  return text;
}
