-- Fix the unique constraint on event_attendees table
-- Remove the unique constraint on enrolleeId (allows participants in multiple events)
-- Add a composite unique constraint on (eventsId, enrolleeId) to prevent duplicate entries for the same participant in the same event

BEGIN;

-- Drop the existing unique constraint on enrolleeId
ALTER TABLE "event_attendees" DROP CONSTRAINT IF EXISTS "event_attendees_enrolleeId_key";

-- Add a composite unique constraint on (eventsId, enrolleeId)
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_eventsId_enrolleeId_key" UNIQUE ("eventsId", "enrolleeId");

-- Create an index on enrolleeId for performance (since we removed the unique constraint which provided an index)
CREATE INDEX IF NOT EXISTS "event_attendees_enrolleeId_idx" ON "event_attendees"("enrolleeId");

COMMIT;