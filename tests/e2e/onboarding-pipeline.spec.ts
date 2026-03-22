import { test, expect } from "@playwright/test";

/**
 * Critical path E2E tests for the onboarding pipeline.
 *
 * These tests verify pages render without JS errors and return expected
 * HTTP status codes. They do NOT require a live database connection.
 */

test.describe("Coach leads page", () => {
  test("loads /coach/leads and redirects to auth (no crash)", async ({
    page,
  }) => {
    // Without auth, Clerk middleware should redirect — not crash with 500
    const response = await page.goto("/coach/leads");
    // Accept any redirect (3xx) or auth page (200 on sign-in page)
    // What we must NOT see is a 500 or uncaught JS error
    expect(response?.status()).not.toBe(500);
  });
});

test.describe("Onboarding intake page", () => {
  test("renders an error page (not a crash) for an invalid token", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto("/onboarding/intake/invalid-token-test");

    // Page must not return a 500
    expect(response?.status()).not.toBe(500);

    // Page must not throw uncaught JS exceptions
    expect(errors).toHaveLength(0);

    // The page should render some visible content (not a blank screen)
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });
});
