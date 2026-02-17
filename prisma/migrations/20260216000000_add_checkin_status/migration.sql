-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('SUBMITTED', 'REVIEWED');

-- DropIndex
DROP INDEX "CheckIn_clientId_weekOf_idx";

-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "status" "CheckInStatus" NOT NULL DEFAULT 'SUBMITTED';

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_clientId_weekOf_key" ON "CheckIn"("clientId", "weekOf");
