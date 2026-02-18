type MealPlanItem = {
  id: string;
  mealName: string;
  foodName: string;
  quantity: string;
  unit: string;
  servingDescription: string | null;
};

type MealPlan = {
  publishedAt: Date | null;
  items: MealPlanItem[];
};

export function SimpleMealPlan({ mealPlan }: { mealPlan: MealPlan }) {
  // Group items by meal name
  const grouped = new Map<string, MealPlanItem[]>();
  for (const item of mealPlan.items) {
    const key = item.mealName || "Untitled Meal";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  return (
    <div className="space-y-2">
      {Array.from(grouped).map(([mealName, items]) => (
        <div
          key={mealName}
          className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{mealName}</h3>
          </div>
          <ul className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between px-4 py-2"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium">{item.foodName}</span>
                  {item.servingDescription && (
                    <p className="text-xs text-zinc-400">
                      {item.servingDescription}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {mealPlan.publishedAt && (
        <p className="text-xs text-zinc-400">
          Published{" "}
          {mealPlan.publishedAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
