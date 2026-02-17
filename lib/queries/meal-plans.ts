import { db } from "@/lib/db";

export async function getCurrentPublishedMealPlan(clientId: string) {
  return db.mealPlan.findFirst({
    where: { clientId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getMealPlanHistory(clientId: string) {
  return db.mealPlan.findMany({
    where: { clientId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      weekOf: true,
      version: true,
      publishedAt: true,
    },
  });
}

export async function getDraftMealPlan(clientId: string, weekOf: Date) {
  return db.mealPlan.findFirst({
    where: { clientId, weekOf, status: "DRAFT" },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getMealPlanById(id: string) {
  return db.mealPlan.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export type EffectiveMealPlan = {
  source: "draft" | "published" | "empty";
  draftId: string | null;
  items: {
    mealName: string;
    foodName: string;
    quantity: string;
    unit: string;
    servingDescription: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }[];
};

function mapItems(items: {
  mealName: string;
  foodName: string;
  quantity: string;
  unit: string;
  servingDescription: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}[]) {
  return items.map((item) => ({
    mealName: item.mealName,
    foodName: item.foodName,
    quantity: item.quantity,
    unit: item.unit,
    servingDescription: item.servingDescription,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fats: item.fats,
  }));
}

export async function getEffectiveMealPlanForReview(
  clientId: string,
  weekOf: Date
): Promise<EffectiveMealPlan> {
  // 1. Check for existing draft for this week
  const draft = await db.mealPlan.findFirst({
    where: { clientId, weekOf, status: "DRAFT" },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (draft) {
    return { source: "draft", draftId: draft.id, items: mapItems(draft.items) };
  }

  // 2. Fall back to most recent published plan (any week)
  const published = await db.mealPlan.findFirst({
    where: { clientId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (published) {
    return { source: "published", draftId: null, items: mapItems(published.items) };
  }

  // 3. No plan at all
  return { source: "empty", draftId: null, items: [] };
}
