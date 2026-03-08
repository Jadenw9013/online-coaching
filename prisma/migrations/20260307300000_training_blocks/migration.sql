-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('EXERCISE', 'ACTIVATION', 'INSTRUCTION', 'SUPERSET', 'CARDIO', 'OPTIONAL');

-- CreateTable
CREATE TABLE "TrainingTemplateBlock" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "type" "BlockType" NOT NULL DEFAULT 'EXERCISE',
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrainingTemplateBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgramBlock" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "type" "BlockType" NOT NULL DEFAULT 'EXERCISE',
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrainingProgramBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingTemplateBlock_dayId_idx" ON "TrainingTemplateBlock"("dayId");

-- CreateIndex
CREATE INDEX "TrainingProgramBlock_dayId_idx" ON "TrainingProgramBlock"("dayId");

-- AddForeignKey
ALTER TABLE "TrainingTemplateBlock" ADD CONSTRAINT "TrainingTemplateBlock_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "TrainingTemplateDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgramBlock" ADD CONSTRAINT "TrainingProgramBlock_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "TrainingDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
