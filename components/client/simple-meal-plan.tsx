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
    <div className="space-y-3">
      {Array.from(grouped).map(([mealName, items]) => (
        <div
          key={mealName}
          className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-[#121215]"
        >
          <div className="border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {mealName}
            </h3>
          </div>
          <ul className="divide-y divide-zinc-100/80 dark:divide-zinc-800/60">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">{item.foodName}</span>
                  {item.servingDescription && (
                    <p className="mt-0.5 text-xs text-zinc-400">
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
          Updated{" "}
          {mealPlan.publishedAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
