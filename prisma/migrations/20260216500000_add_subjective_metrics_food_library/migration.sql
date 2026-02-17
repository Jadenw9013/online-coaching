-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "dietCompliance" INTEGER,
ADD COLUMN     "energyLevel" INTEGER;

-- CreateTable
CREATE TABLE "FoodLibraryItem" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultUnit" TEXT NOT NULL DEFAULT 'serving',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodLibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoodLibraryItem_coachId_idx" ON "FoodLibraryItem"("coachId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodLibraryItem_coachId_name_key" ON "FoodLibraryItem"("coachId", "name");

-- AddForeignKey
ALTER TABLE "FoodLibraryItem" ADD CONSTRAINT "FoodLibraryItem_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
