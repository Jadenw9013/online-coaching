/**
 * LLM-powered workout plan text → structured block-based JSON.
 * Mirrors lib/llm/parse-meal-plan.ts patterns.
 */

import {
  parsedWorkoutProgramSchema,
  type ParsedWorkoutProgram,
} from "@/lib/validations/workout-import";

const SYSTEM_PROMPT = `You are an expert fitness coach assistant. Given raw text from a workout program document (possibly OCR'd or pasted), extract a structured workout program.

Rules:
- Output ONLY valid JSON matching the schema below. No markdown, no explanation.
- Detect the program name from headers, titles, or document structure. If not found, generate "Imported Workout Plan".
- Detect any global notes, coach instructions, or context BEFORE the first day — put these in "notes".
- Detect day sections from headers like "DAY 1", "Day 1 - Chest", "Monday", "Push Day", "Upper Body A", etc.
- For each day, convert exercises and instructions into blocks.
- Infer the block type from context:
  * EXERCISE: standard weighted exercises (squats, bench press, rows, etc.)
  * ACTIVATION: warm-up, mobility, activation drills
  * SUPERSET: exercises done back-to-back (look for "Superset A/B", "A1/A2", or grouped exercises)
  * CARDIO: running, cycling, HIIT, steady-state cardio
  * INSTRUCTION: coach notes, technique cues, general instructions
  * OPTIONAL: anything marked "optional", "if time allows", "bonus"
- Block title: the exercise name or short label (e.g. "Barbell Squat", "Superset A", "Warm-Up")
- Block content: sets × reps, rest periods, tempo, intensity, form cues, or the full coaching text
- Preserve coaching intent — don't just extract exercise names, capture the coaching context
- Convert freeform coaching text into readable title + content pairs
- Do NOT invent exercises or sets/reps that are not in the text

JSON Schema:
{
  "name": "string (program name)",
  "notes": "string (global notes/context, empty string if none)",
  "days": [
    {
      "dayName": "string (e.g. 'Day 1 – Push', 'Monday – Upper Body')",
      "blocks": [
        {
          "type": "EXERCISE | ACTIVATION | INSTRUCTION | SUPERSET | CARDIO | OPTIONAL",
          "title": "string (block title, e.g. 'Barbell Squat')",
          "content": "string (sets/reps/rest/cues, can be multiline)"
        }
      ]
    }
  ]
}`;

export async function parseWorkoutPlanTextToJson(
  text: string
): Promise<ParsedWorkoutProgram> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to your environment variables.");
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
          content: `Extract the workout program from this text:\n\n${text}`,
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
    console.error("[parse-workout-plan] LLM returned invalid JSON", { model, contentLength: content.length });
    throw new Error("LLM returned invalid JSON");
  }

  const normalized = normalizeWorkoutOutput(parsed);

  const validated = parsedWorkoutProgramSchema.safeParse(normalized);
  if (!validated.success) {
    console.error("[parse-workout-plan] Schema validation failed", {
      model,
      errors: validated.error.issues.map((i) => ({
        path: i.path.join("."),
        code: i.code,
        message: i.message,
      })),
    });
    throw new Error(`LLM output doesn't match expected schema: ${validated.error.message}`);
  }

  return validated.data;
}

function normalizeWorkoutOutput(raw: unknown): unknown {
  if (raw == null || typeof raw !== "object") return raw;
  if (Array.isArray(raw)) return raw.map(normalizeWorkoutOutput);

  const obj = raw as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = value.trim();
    } else if (typeof value === "object" && value !== null) {
      result[key] = normalizeWorkoutOutput(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
