-- Step 1: Add new columns (no unique constraint yet)
ALTER TABLE "CheckIn" ADD COLUMN "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CheckIn" ADD COLUMN "localDate" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CheckIn" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles';

-- Step 2: Backfill submittedAt from createdAt
UPDATE "CheckIn" SET "submittedAt" = "createdAt";

-- Step 3: Backfill timezone from User.timezone
UPDATE "CheckIn" ci
SET "timezone" = u."timezone"
FROM "User" u
WHERE u."id" = ci."clientId";

-- Step 4: Backfill localDate from submittedAt + timezone
-- Uses PostgreSQL AT TIME ZONE for DST-safe conversion
UPDATE "CheckIn"
SET "localDate" = to_char("submittedAt" AT TIME ZONE "timezone", 'YYYY-MM-DD');

-- Step 5: For any rows that still have empty localDate, use UTC fallback
UPDATE "CheckIn"
SET "localDate" = to_char("submittedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
WHERE "localDate" = '' OR "localDate" IS NULL;

-- Step 6: Handle duplicate (clientId, localDate) before adding unique constraint.
-- Keep the most recent row per (clientId, localDate), soft-delete older duplicates.
UPDATE "CheckIn"
SET "deletedAt" = NOW()
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id",
           ROW_NUMBER() OVER (PARTITION BY "clientId", "localDate" ORDER BY "submittedAt" DESC) AS rn
    FROM "CheckIn"
    WHERE "deletedAt" IS NULL
  ) ranked
  WHERE rn > 1
);

-- Step 7: For soft-deleted duplicates that would still violate the constraint,
-- append a suffix to their localDate so the unique index can be created.
UPDATE "CheckIn"
SET "localDate" = "localDate" || '_deleted_' || "id"
WHERE "id" IN (
  SELECT c1."id"
  FROM "CheckIn" c1
  JOIN "CheckIn" c2 ON c1."clientId" = c2."clientId"
    AND c1."localDate" = c2."localDate"
    AND c1."id" <> c2."id"
  WHERE c1."deletedAt" IS NOT NULL
);

-- Step 8: Create indexes
CREATE INDEX "CheckIn_clientId_submittedAt_idx" ON "CheckIn"("clientId", "submittedAt");
CREATE INDEX "CheckIn_clientId_localDate_idx" ON "CheckIn"("clientId", "localDate");

-- Step 9: Add unique constraint
CREATE UNIQUE INDEX "CheckIn_clientId_localDate_key" ON "CheckIn"("clientId", "localDate");
