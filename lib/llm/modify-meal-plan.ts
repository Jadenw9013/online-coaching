/**
 * LLM-powered meal plan modification.
 *
 * Takes an existing structured meal plan + a coach's natural-language instruction
 * and returns the complete updated plan in the same schema used by imports.
 *
 * Reuses: OPENAI_API_KEY, OPENAI_MODEL env vars (same as parse-meal-plan.ts)
 */

import {
  parsedMealPlanSchema,
  type ParsedMealPlan,
} from "@/lib/validations/meal-plan-import";
import { normalizeLlmOutput } from "./parse-meal-plan";

const MODIFY_SYSTEM_PROMPT = `You are a precision meal plan editor. You receive a coach's existing structured meal plan as JSON and a modification instruction. You must return the COMPLETE updated plan.

CRITICAL RULES:
1. Output ONLY valid JSON matching the exact schema below. No markdown, no explanation.
2. Return the ENTIRE plan — not just the changed parts. Every meal, every item, every extra.
3. ONLY modify what the instruction asks for. Preserve everything else EXACTLY as-is.
4. Preserve meal names, food names, portions, and all fields exactly unless the instruction says to change them.
5. If the instruction is ambiguous, make a reasonable interpretation and note it.
6. When adding foods, use reasonable default portions if the instruction doesn't specify.
7. When creating day overrides, use the mealAdjustments model (not the legacy items model).
8. Portion strings should be human-readable (e.g., "6 oz", "200g", "1 cup", "2 scoops").
9. NEVER use null for portion — always use a string (empty string if truly unknown).

CAPABILITIES:
- Add/remove/replace foods in specific meals
- Change portions for specific foods
- Create new meals
- Remove entire meals
- Duplicate meals with modifications
- Create day overrides (e.g., high carb day, free meal day)
- Add/remove/modify text-based supplements, rules, and allowances via supportContent
- Adjust multiple meals at once
- Create complex multi-day variations

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
  "notes": "string (optional)",
  "metadata": {
    "phase": "string (optional)",
    "startDate": "string (optional)",
    "bodyweight": "string (optional)",
    "coachNotes": "string (optional)",
    "highlightedChanges": "string — REQUIRED: brief summary of what was changed"
  },
  "dayOverrides": [
    {
      "label": "string",
      "color": "string (blue|emerald|amber|rose|purple|teal)",
      "weekdays": ["string"],
      "mealAdjustments": [
        {
          "mealName": "string",
          "changes": [
            {
              "type": "update|add|remove|replace",
              "food": "string",
              "newPortion": "string (optional)",
              "replacementFood": "string (optional)",
              "replacementPortion": "string (optional)"
            }
          ],
          "notes": "string (optional)"
        }
      ],
      "notes": "string (optional)"
    }
  ],
  "supportContent": "string (optional) — Multiline markdown string for unstructured guidance like supplements, habits, rules, grocery lists, or general guidance"
}

IMPORTANT:
- Always set metadata.highlightedChanges to describe what you changed.
- If the current plan has supportContent or overrides, preserve them unless the instruction modifies them.
- Return the full plan structure even if only one item changed.`;

type ModifyInput = {
  currentPlan: {
    title: string;
    meals: { name: string; items: { food: string; portion: string }[] }[];
    extras?: Record<string, unknown> | null;
    supportContent?: string | null;
  };
  instruction: string;
};

export async function modifyMealPlan(
  input: ModifyInput
): Promise<ParsedMealPlan> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to your environment variables."
    );
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o";

  // Build the user prompt with the current plan
  const planJson = JSON.stringify(
    {
      title: input.currentPlan.title,
      meals: input.currentPlan.meals,
      ...(input.currentPlan.extras ?? {}),
      supportContent: input.currentPlan.supportContent,
    },
    null,
    2
  );

  const userPrompt = `Here is the current meal plan:

${planJson}

---

Coach's instruction: ${input.instruction}

Apply this instruction to the plan and return the complete updated plan as JSON.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: MODIFY_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.15,
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
    console.error("[modify-meal-plan] LLM returned invalid JSON", {
      model,
      contentLength: content.length,
    });
    throw new Error("AI returned an invalid response. Please try again.");
  }

  const normalized = normalizeLlmOutput(parsed);

  const validated = parsedMealPlanSchema.safeParse(normalized);
  if (!validated.success) {
    console.error("[modify-meal-plan] Schema validation failed", {
      model,
      errors: validated.error.issues.map((i) => ({
        path: i.path.join("."),
        code: i.code,
        message: i.message,
      })),
    });
    throw new Error(
      "AI produced an unexpected format. Please try a simpler instruction."
    );
  }

  return validated.data;
}
