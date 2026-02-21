-- Drop the unique constraint on (clientId, periodStartDate) to allow multiple check-ins
DROP INDEX IF EXISTS "CheckIn_clientId_periodStartDate_key";

-- Add index on (clientId, localDate) for today-based lookups
CREATE INDEX IF NOT EXISTS "CheckIn_clientId_localDate_idx" ON "CheckIn"("clientId", "localDate");
