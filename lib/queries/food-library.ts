import { db } from "@/lib/db";

export async function getFoodLibrary(coachId: string) {
  return db.foodLibraryItem.findMany({
    where: { coachId },
    orderBy: { name: "asc" },
  });
}
