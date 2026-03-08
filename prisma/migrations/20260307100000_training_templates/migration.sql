-- AlterTable
ALTER TABLE "TrainingExercise" ADD COLUMN     "intensityText" TEXT;

-- AlterTable
ALTER TABLE "TrainingProgram" ADD COLUMN     "clientNotes" TEXT,
ADD COLUMN     "equipment" TEXT,
ADD COLUMN     "injuries" TEXT,
ADD COLUMN     "templateSourceId" TEXT,
ADD COLUMN     "weeklyFrequency" INTEGER;

-- CreateTable
CREATE TABLE "TrainingTemplate" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingTemplateDay" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "dayName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrainingTemplateDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingTemplateExercise" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 3,
    "reps" TEXT NOT NULL DEFAULT '10',
    "intensityText" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrainingTemplateExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingTemplateCardio" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "frequency" TEXT,
    "duration" TEXT,
    "modality" TEXT,
    "intensity" TEXT,
    "notes" TEXT,

    CONSTRAINT "TrainingTemplateCardio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgramCardio" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "frequency" TEXT,
    "duration" TEXT,
    "modality" TEXT,
    "intensity" TEXT,
    "notes" TEXT,

    CONSTRAINT "TrainingProgramCardio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingTemplate_coachId_idx" ON "TrainingTemplate"("coachId");

-- CreateIndex
CREATE INDEX "TrainingTemplateDay_templateId_idx" ON "TrainingTemplateDay"("templateId");

-- CreateIndex
CREATE INDEX "TrainingTemplateExercise_dayId_idx" ON "TrainingTemplateExercise"("dayId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingTemplateCardio_templateId_key" ON "TrainingTemplateCardio"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProgramCardio_programId_key" ON "TrainingProgramCardio"("programId");

-- AddForeignKey
ALTER TABLE "TrainingTemplate" ADD CONSTRAINT "TrainingTemplate_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingTemplateDay" ADD CONSTRAINT "TrainingTemplateDay_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TrainingTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingTemplateExercise" ADD CONSTRAINT "TrainingTemplateExercise_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "TrainingTemplateDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingTemplateCardio" ADD CONSTRAINT "TrainingTemplateCardio_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TrainingTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_templateSourceId_fkey" FOREIGN KEY ("templateSourceId") REFERENCES "TrainingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgramCardio" ADD CONSTRAINT "TrainingProgramCardio_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
