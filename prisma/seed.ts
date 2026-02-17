import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const coach = await prisma.user.findFirst({ where: { isCoach: true } });
  const client = await prisma.user.findFirst({ where: { isClient: true } });

  if (!coach || !client) {
    console.log("Need at least one COACH and one CLIENT user in the database.");
    console.log("Sign up via Clerk first, then set roles in the Clerk Dashboard.");
    return;
  }

  const assignment = await prisma.coachClient.upsert({
    where: {
      coachId_clientId: { coachId: coach.id, clientId: client.id },
    },
    update: {},
    create: { coachId: coach.id, clientId: client.id },
  });

  console.log(
    `Assigned coach "${coach.firstName} ${coach.lastName}" to client "${client.firstName} ${client.lastName}" (${assignment.id})`
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
