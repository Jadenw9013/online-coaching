import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const mealPlans = await db.mealPlan.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { items: true }
  });

  const totalItems = await db.mealPlanItem.count();
  const totalPlans = await db.mealPlan.count();

  return NextResponse.json({
    totalPlans,
    totalItems,
    recentPlans: mealPlans.map(mp => ({
      id: mp.id,
      clientId: mp.clientId,
      version: mp.version,
      status: mp.status,
      itemsCount: mp.items.length
    }))
  });
}
