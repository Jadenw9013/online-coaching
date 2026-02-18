import { describe, it, expect } from "vitest";
import { normalizeLlmOutput } from "@/lib/llm/parse-meal-plan";

describe("normalizeLlmOutput", () => {
  it("returns primitives unchanged", () => {
    expect(normalizeLlmOutput(null)).toBe(null);
    expect(normalizeLlmOutput(undefined)).toBe(undefined);
    expect(normalizeLlmOutput(42)).toBe(42);
    expect(normalizeLlmOutput(true)).toBe(true);
  });

  it("trims string values in objects", () => {
    const result = normalizeLlmOutput({ food: "  Chicken Breast  " });
    expect(result).toEqual({ food: "Chicken Breast" });
  });

  it('coerces null portion to ""', () => {
    const result = normalizeLlmOutput({ food: "Rice", portion: null });
    expect(result).toEqual({ food: "Rice", portion: "" });
  });

  it('coerces undefined portion to ""', () => {
    const result = normalizeLlmOutput({ food: "Rice", portion: undefined });
    expect(result).toEqual({ food: "Rice", portion: "" });
  });

  it("trims portion strings", () => {
    const result = normalizeLlmOutput({ portion: "  6 oz  " });
    expect(result).toEqual({ portion: "6 oz" });
  });

  it("normalizes nested arrays recursively", () => {
    const input = {
      meals: [
        {
          name: " Breakfast ",
          items: [{ food: " Oats ", portion: null }],
        },
      ],
    };
    const result = normalizeLlmOutput(input) as Record<string, unknown>;
    const meals = result.meals as Array<Record<string, unknown>>;
    const items = meals[0].items as Array<Record<string, unknown>>;
    expect(meals[0].name).toBe("Breakfast");
    expect(items[0].food).toBe("Oats");
    expect(items[0].portion).toBe("");
  });

  it("preserves non-string, non-object values", () => {
    const result = normalizeLlmOutput({ count: 3, active: true });
    expect(result).toEqual({ count: 3, active: true });
  });
});
