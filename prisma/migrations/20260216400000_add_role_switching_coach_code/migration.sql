-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coachCode" TEXT,
ADD COLUMN     "isClient" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isCoach" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_coachCode_key" ON "User"("coachCode");

-- Populate capability flags from existing role column
UPDATE "User" SET "isCoach" = true, "isClient" = false WHERE "role" = 'COACH';
