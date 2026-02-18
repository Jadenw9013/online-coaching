import { describe, it, expect } from "vitest";
import { prismaErrorMessage } from "@/lib/db";

// Mock the PrismaClient import so db.ts doesn't try to connect
import { vi } from "vitest";
vi.mock("@/app/generated/prisma/client", () => ({
  PrismaClient: class MockPrismaClient {},
}));
vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class MockPrismaPg {},
}));

describe("prismaErrorMessage", () => {
  it("detects P2021 table-missing error", () => {
    const error = { code: "P2021", message: "Table does not exist" };
    const result = prismaErrorMessage(error);
    expect(result.status).toBe(503);
    expect(result.message).toContain("migration missing");
  });

  it("returns 500 for generic Error", () => {
    const result = prismaErrorMessage(new Error("Something broke"));
    expect(result.status).toBe(500);
    expect(result.message).toBe("Something broke");
  });

  it("returns generic message for non-Error", () => {
    const result = prismaErrorMessage("random string");
    expect(result.status).toBe(500);
    expect(result.message).toBe("Internal server error");
  });

  it("returns 500 for other Prisma error codes", () => {
    const error = { code: "P2002", message: "Unique constraint" };
    const result = prismaErrorMessage(error);
    expect(result.status).toBe(500);
  });
});
