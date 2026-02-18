/**
 * LLM-powered meal plan text → structured JSON.
 *
 * Env vars:
 *   OPENAI_API_KEY — OpenAI API key
 *   OPENAI_MODEL   — Model to use (default: gpt-4o)
 *
 * TODO: If you want to use a different LLM provider (Gemini, Claude, etc.),
 * replace the fetch call below. The interface stays the same.
 */

import {
  parsedMealPlanSchema,
  type ParsedMealPlan,
} from "@/lib/validations/meal-plan-import";

const SYSTEM_PROMPT = `You are a nutrition data extraction assistant. Given raw text from a meal plan document (possibly OCR'd), extract the structured meal plan.

Rules:
- Output ONLY valid JSON matching the schema below. No markdown, no explanation.
- Extract every food item mentioned with its portion as written in the text.
- Group items into meals. Use meal names from the text (e.g., "Breakfast", "Meal 1").
- If meals are not labeled, number them: "Meal 1", "Meal 2", etc.
- Preserve portion strings exactly as written (e.g., "6 oz", "200g cooked", "1 tbsp").
- If the portion is missing, unclear, or cannot be determined, set portion to an empty string "".
- NEVER use null for portion — always use a string (empty string is acceptable).
- Do NOT invent foods that aren't in the text.
- If something is ambiguous, include it but add a "notes" field with "unclear".
- If a title is present, use it. Otherwise, generate a brief one like "Imported Meal Plan".
- Put any general notes or instructions in the top-level "notes" field.

JSON Schema:
{
  "title": "string",
  "meals": [
    {
      "name": "string",
      "items": [
        {
          "food": "string",
          "portion": "string (empty string if unknown)",
          "notes": "string (optional)"
        }
      ]
    }
  ],
  "notes": "string"
}`;

export async function parseMealPlanTextToJson(
  text: string
): Promise<ParsedMealPlan> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to your environment variables."
    );
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract the meal plan from this text:\n\n${text}`,
        },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("LLM returned empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("[parse-meal-plan] LLM returned invalid JSON", { model, contentLength: content.length });
    throw new Error("LLM returned invalid JSON");
  }

  // Normalize before validation: trim strings, coerce nullish portions to ""
  const normalized = normalizeLlmOutput(parsed);

  const validated = parsedMealPlanSchema.safeParse(normalized);
  if (!validated.success) {
    console.error("[parse-meal-plan] Schema validation failed", {
      model,
      errors: validated.error.issues.map((i) => ({
        path: i.path.join("."),
        code: i.code,
        message: i.message,
      })),
    });
    throw new Error(
      `LLM output doesn't match expected schema: ${validated.error.message}`
    );
  }

  return validated.data;
}

/** Normalize raw LLM output before schema validation */
export function normalizeLlmOutput(raw: unknown): unknown {
  if (raw == null || typeof raw !== "object") return raw;

  if (Array.isArray(raw)) return raw.map(normalizeLlmOutput);

  const obj = raw as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === "portion") {
      // Coerce null/undefined/non-string to empty string, trim whitespace
      result[key] = typeof value === "string" ? value.trim() : "";
    } else if (typeof value === "string") {
      result[key] = value.trim();
    } else if (typeof value === "object" && value !== null) {
      result[key] = normalizeLlmOutput(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
