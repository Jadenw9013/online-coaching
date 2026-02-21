-- Step 1: Drop old localDate indexes/constraint
DROP INDEX IF EXISTS "CheckIn_clientId_localDate_idx";
DROP INDEX IF EXISTS "CheckIn_clientId_localDate_key";

-- Step 2: Add new columns
ALTER TABLE "CheckIn" ADD COLUMN "periodStartDate" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CheckIn" ADD COLUMN "periodEndDate" TEXT NOT NULL DEFAULT '';

-- Step 3: Backfill periodStartDate from localDate (existing per-day data becomes per-period start)
UPDATE "CheckIn" SET "periodStartDate" = "localDate" WHERE "localDate" <> '';

-- Step 4: Backfill periodEndDate as localDate + 7 days (reasonable default for legacy data)
UPDATE "CheckIn"
SET "periodEndDate" = to_char(
  to_date("periodStartDate", 'YYYY-MM-DD') + INTERVAL '7 days',
  'YYYY-MM-DD'
)
WHERE "periodStartDate" <> '';

-- Step 5: Handle any duplicate (clientId, periodStartDate) before adding unique constraint.
-- Keep the most recent row, soft-delete older duplicates.
UPDATE "CheckIn"
SET "deletedAt" = NOW()
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id",
           ROW_NUMBER() OVER (PARTITION BY "clientId", "periodStartDate" ORDER BY "submittedAt" DESC) AS rn
    FROM "CheckIn"
    WHERE "deletedAt" IS NULL AND "periodStartDate" <> ''
  ) ranked
  WHERE rn > 1
);

-- Step 6: For soft-deleted rows that still collide, append suffix to avoid constraint violation
UPDATE "CheckIn"
SET "periodStartDate" = "periodStartDate" || '_del_' || "id"
WHERE "id" IN (
  SELECT c1."id"
  FROM "CheckIn" c1
  JOIN "CheckIn" c2 ON c1."clientId" = c2."clientId"
    AND c1."periodStartDate" = c2."periodStartDate"
    AND c1."id" <> c2."id"
  WHERE c1."deletedAt" IS NOT NULL
);

-- Step 7: Create indexes and unique constraint
CREATE INDEX "CheckIn_clientId_periodStartDate_idx" ON "CheckIn"("clientId", "periodStartDate");
CREATE UNIQUE INDEX "CheckIn_clientId_periodStartDate_key" ON "CheckIn"("clientId", "periodStartDate");
