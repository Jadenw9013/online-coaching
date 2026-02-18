-- CreateEnum
CREATE TYPE "MealPlanUploadStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'NEEDS_REVIEW', 'IMPORTED', 'FAILED');

-- CreateTable
CREATE TABLE "MealPlanUpload" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "storageBucket" TEXT NOT NULL DEFAULT 'meal-plan-uploads',
    "storagePath" TEXT NOT NULL,
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "status" "MealPlanUploadStatus" NOT NULL DEFAULT 'UPLOADED',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlanUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlanDraft" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "extractedText" TEXT,
    "parsedJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlanDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MealPlanUpload_coachId_idx" ON "MealPlanUpload"("coachId");
CREATE INDEX "MealPlanUpload_clientId_idx" ON "MealPlanUpload"("clientId");
CREATE UNIQUE INDEX "MealPlanDraft_uploadId_key" ON "MealPlanDraft"("uploadId");

-- AddForeignKey
ALTER TABLE "MealPlanUpload" ADD CONSTRAINT "MealPlanUpload_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MealPlanUpload" ADD CONSTRAINT "MealPlanUpload_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MealPlanDraft" ADD CONSTRAINT "MealPlanDraft_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "MealPlanUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
