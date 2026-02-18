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
          "portion": "string",
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
    throw new Error("LLM returned invalid JSON");
  }

  const validated = parsedMealPlanSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `LLM output doesn't match expected schema: ${validated.error.message}`
    );
  }

  return validated.data;
}
