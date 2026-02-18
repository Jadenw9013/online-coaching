import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/**
 * Detect Prisma P2021 "table does not exist" errors and return a clear message.
 * Use in route handler catch blocks to surface migration issues.
 */
export function prismaErrorMessage(error: unknown): { message: string; status: number } {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: string }).code === "P2021"
  ) {
    return {
      message: "DB migration missing — the required table does not exist. Run: npx prisma migrate deploy",
      status: 503,
    };
  }
  return {
    message: error instanceof Error ? error.message : "Internal server error",
    status: 500,
  };
}
