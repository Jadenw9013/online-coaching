import { describe, it, expect } from "vitest";
import { splitPortion } from "@/lib/validations/meal-plan-import";

describe("splitPortion", () => {
  it('returns default for empty string', () => {
    expect(splitPortion("")).toEqual({ quantity: "1", unit: "serving" });
  });

  it('returns default for whitespace-only string', () => {
    expect(splitPortion("   ")).toEqual({ quantity: "1", unit: "serving" });
  });

  it('parses "6 oz"', () => {
    expect(splitPortion("6 oz")).toEqual({ quantity: "6", unit: "oz" });
  });

  it('parses "200g cooked"', () => {
    expect(splitPortion("200g cooked")).toEqual({ quantity: "200", unit: "g cooked" });
  });

  it('parses "1.5 cups"', () => {
    expect(splitPortion("1.5 cups")).toEqual({ quantity: "1.5", unit: "cups" });
  });

  it('parses fractions like "½ cup"', () => {
    expect(splitPortion("½ cup")).toEqual({ quantity: "½", unit: "cup" });
  });

  it("returns quantity-only when no unit matches", () => {
    expect(splitPortion("large")).toEqual({ quantity: "large", unit: "serving" });
  });

  it("handles leading/trailing whitespace", () => {
    expect(splitPortion("  6 oz  ")).toEqual({ quantity: "6", unit: "oz" });
  });
});
