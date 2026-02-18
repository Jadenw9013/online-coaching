import { describe, it, expect } from "vitest";
import {
  parsedMealPlanSchema,
  parsedMealItemSchema,
  validateUploadFile,
} from "@/lib/validations/meal-plan-import";

describe("parsedMealItemSchema", () => {
  it("accepts valid item with portion", () => {
    const result = parsedMealItemSchema.safeParse({ food: "Chicken", portion: "6 oz" });
    expect(result.success).toBe(true);
  });

  it("accepts item with empty portion", () => {
    const result = parsedMealItemSchema.safeParse({ food: "Chicken", portion: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.portion).toBe("");
  });

  it("defaults missing portion to empty string", () => {
    const result = parsedMealItemSchema.safeParse({ food: "Chicken" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.portion).toBe("");
  });

  it("coerces null portion to empty string", () => {
    const result = parsedMealItemSchema.safeParse({ food: "Chicken", portion: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.portion).toBe("");
  });

  it("rejects empty food name", () => {
    const result = parsedMealItemSchema.safeParse({ food: "", portion: "6 oz" });
    expect(result.success).toBe(false);
  });
});

describe("parsedMealPlanSchema", () => {
  const validPlan = {
    title: "Test Plan",
    meals: [
      {
        name: "Breakfast",
        items: [{ food: "Oats", portion: "1 cup" }],
      },
    ],
    notes: "",
  };

  it("accepts a well-formed plan", () => {
    const result = parsedMealPlanSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
  });

  it("rejects plan with no meals", () => {
    const result = parsedMealPlanSchema.safeParse({ ...validPlan, meals: [] });
    expect(result.success).toBe(false);
  });

  it("rejects meal with no items", () => {
    const result = parsedMealPlanSchema.safeParse({
      ...validPlan,
      meals: [{ name: "Empty", items: [] }],
    });
    expect(result.success).toBe(false);
  });

  it("defaults notes to empty string when missing", () => {
    const { notes, ...planWithoutNotes } = validPlan;
    void notes;
    const result = parsedMealPlanSchema.safeParse(planWithoutNotes);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBe("");
  });
});

describe("validateUploadFile", () => {
  it("accepts valid image types", () => {
    expect(validateUploadFile("image/png").valid).toBe(true);
    expect(validateUploadFile("image/jpeg").valid).toBe(true);
    expect(validateUploadFile("image/webp").valid).toBe(true);
  });

  it("accepts PDF", () => {
    expect(validateUploadFile("application/pdf").valid).toBe(true);
  });

  it("rejects unsupported types", () => {
    const result = validateUploadFile("text/plain");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsupported file type");
  });

  it("rejects files over 10MB", () => {
    const result = validateUploadFile("image/png", 11 * 1024 * 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too large");
  });

  it("accepts files under 10MB", () => {
    expect(validateUploadFile("image/png", 5 * 1024 * 1024).valid).toBe(true);
  });
});
