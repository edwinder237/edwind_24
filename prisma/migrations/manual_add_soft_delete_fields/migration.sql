-- Add soft-delete fields to core models for data retention compliance
-- These fields support SOC 2 audit requirements by preserving deleted records

-- Users
ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "deletedBy" TEXT;

-- Organizations
ALTER TABLE "organizations" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "organizations" ADD COLUMN "deletedBy" TEXT;

-- Projects
ALTER TABLE "projects" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN "deletedBy" TEXT;

-- Participants
ALTER TABLE "participants" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "participants" ADD COLUMN "deletedBy" TEXT;

-- Courses
ALTER TABLE "courses" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "courses" ADD COLUMN "deletedBy" TEXT;
CREATE INDEX "courses_deletedAt_idx" ON "courses"("deletedAt");

-- Events
ALTER TABLE "events" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN "deletedBy" TEXT;
CREATE INDEX "events_deletedAt_idx" ON "events"("deletedAt");

-- Training Recipients
ALTER TABLE "training_recipients" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "training_recipients" ADD COLUMN "deletedBy" TEXT;

-- Instructors
ALTER TABLE "instructors" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "instructors" ADD COLUMN "deletedBy" TEXT;
