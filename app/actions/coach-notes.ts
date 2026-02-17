"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { verifyCoachAccessToClient } from "@/lib/queries/check-ins";
import { revalidatePath } from "next/cache";

const saveNotesSchema = z.object({
  clientId: z.string().min(1),
  notes: z.string().max(10000),
});

export async function saveCoachNotes(input: unknown) {
  const parsed = saveNotesSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const coach = await verifyCoachAccessToClient(parsed.data.clientId);

  await db.coachClient.update({
    where: {
      coachId_clientId: {
        coachId: coach.id,
        clientId: parsed.data.clientId,
      },
    },
    data: { coachNotes: parsed.data.notes },
  });

  revalidatePath(`/coach/clients/${parsed.data.clientId}`);
  return { success: true };
}
