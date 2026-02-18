import { describe, it, expect } from "vitest";

/**
 * API Smoke Tests
 *
 * These verify that API routes exist and return expected status codes
 * when called without auth (should be 401/403, NOT 404).
 *
 * Requires the dev server running on localhost:3000.
 * Run with: SMOKE=1 npm test
 */

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

const shouldRun = !!process.env.SMOKE;

describe.skipIf(!shouldRun)("API route smoke tests", () => {
  it("POST /api/mealplans/upload-url returns non-404", async () => {
    const res = await fetch(`${BASE_URL}/api/mealplans/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).not.toBe(404);
  });

  it("POST /api/mealplans/import-plan returns non-404", async () => {
    const res = await fetch(`${BASE_URL}/api/mealplans/import-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).not.toBe(404);
  });

  it("POST /api/mealplans/parse returns non-404", async () => {
    const res = await fetch(`${BASE_URL}/api/mealplans/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).not.toBe(404);
  });

  it("POST /api/webhooks/clerk returns non-404", async () => {
    const res = await fetch(`${BASE_URL}/api/webhooks/clerk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    // Webhook will fail verification but should NOT be 404
    expect(res.status).not.toBe(404);
  });
});
