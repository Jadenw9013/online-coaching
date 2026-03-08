-- CreateEnum
CREATE TYPE "WorkoutImportStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'NEEDS_REVIEW', 'IMPORTED', 'FAILED');

-- CreateTable
CREATE TABLE "WorkoutImport" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "clientId" TEXT,
    "storageBucket" TEXT NOT NULL DEFAULT 'meal-plan-uploads',
    "storagePath" TEXT NOT NULL DEFAULT '',
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "status" "WorkoutImportStatus" NOT NULL DEFAULT 'UPLOADED',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutImportDraft" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "extractedText" TEXT,
    "parsedJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutImportDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutImport_coachId_idx" ON "WorkoutImport"("coachId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutImportDraft_importId_key" ON "WorkoutImportDraft"("importId");

-- AddForeignKey
ALTER TABLE "WorkoutImport" ADD CONSTRAINT "WorkoutImport_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutImportDraft" ADD CONSTRAINT "WorkoutImportDraft_importId_fkey" FOREIGN KEY ("importId") REFERENCES "WorkoutImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
