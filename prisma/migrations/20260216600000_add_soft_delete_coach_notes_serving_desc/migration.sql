-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CoachClient" ADD COLUMN     "coachNotes" TEXT;

-- AlterTable
ALTER TABLE "MealPlanItem" ADD COLUMN     "servingDescription" TEXT;
