import { describe, it, expect } from "vitest";
import { isBucketMissing } from "@/lib/supabase/meal-plan-storage";

describe("isBucketMissing", () => {
  it("returns false for undefined/empty input", () => {
    expect(isBucketMissing(undefined)).toBe(false);
    expect(isBucketMissing("")).toBe(false);
  });

  it('detects "Bucket not found"', () => {
    expect(isBucketMissing("Bucket not found")).toBe(true);
    expect(isBucketMissing("bucket not found")).toBe(true);
    expect(isBucketMissing("BUCKET NOT FOUND")).toBe(true);
  });

  it('detects "The related resource does not exist"', () => {
    expect(isBucketMissing("The related resource does not exist")).toBe(true);
  });

  it('detects compound "not found" + "bucket"', () => {
    expect(isBucketMissing("The bucket was not found")).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isBucketMissing("Permission denied")).toBe(false);
    expect(isBucketMissing("Not found")).toBe(false);
    expect(isBucketMissing("Object not found")).toBe(false);
  });
});
