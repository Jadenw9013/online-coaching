import { db } from "@/lib/db";

export async function getMacroTarget(clientId: string, weekOf: Date) {
  return db.macroTarget.findUnique({
    where: { clientId_weekOf: { clientId, weekOf } },
  });
}
