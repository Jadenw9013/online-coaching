-- DropIndex
DROP INDEX "CheckIn_clientId_weekOf_key";

-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "CoachClient" ADD COLUMN     "checkInDaysOfWeekOverride" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "checkInDaysOfWeek" INTEGER[] DEFAULT ARRAY[1]::INTEGER[],
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/New_York';

-- CreateIndex
CREATE INDEX "CheckIn_clientId_weekOf_idx" ON "CheckIn"("clientId", "weekOf");
