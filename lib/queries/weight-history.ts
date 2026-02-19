import { db } from "@/lib/db";

export async function getWeightHistory(
  clientId: string,
  range?: "30d" | "90d" | "all"
): Promise<{ date: string; weight: number }[]> {
  const where: Record<string, unknown> = {
    clientId,
    deletedAt: null,
    isPrimary: true,
    weight: { not: null },
  };

  if (range && range !== "all") {
    const days = range === "30d" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    cutoff.setUTCHours(0, 0, 0, 0);
    where.weekOf = { gte: cutoff };
  }

  const checkIns = await db.checkIn.findMany({
    where,
    orderBy: { weekOf: "asc" },
    select: { weekOf: true, weight: true },
  });

  return checkIns.map((c) => ({
    date: c.weekOf.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    weight: c.weight as number,
  }));
}
