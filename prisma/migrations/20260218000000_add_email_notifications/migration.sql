-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MEAL_PLAN_UPDATE', 'CHECKIN_REMINDER');

-- CreateEnum
CREATE TYPE "ReminderStage" AS ENUM ('PRE_DUE', 'OVERDUE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultNotifyOnPublish" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailCheckInReminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailMealPlanUpdates" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "clientId" TEXT NOT NULL,
    "mealPlanId" TEXT,
    "windowStartDate" TIMESTAMP(3),
    "stage" "ReminderStage",
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationLog_clientId_type_idx" ON "NotificationLog"("clientId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_clientId_windowStartDate_type_stage_key" ON "NotificationLog"("clientId", "windowStartDate", "type", "stage");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
