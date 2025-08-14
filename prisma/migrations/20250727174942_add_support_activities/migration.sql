-- AlterTable
ALTER TABLE "events" ADD COLUMN     "supportActivityId" INTEGER;

-- CreateTable
CREATE TABLE "supportActivities" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "activityType" TEXT NOT NULL DEFAULT 'General',
    "duration" INTEGER,
    "curriculumId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "supportActivities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supportActivities_curriculumId_idx" ON "supportActivities"("curriculumId");

-- CreateIndex
CREATE INDEX "supportActivities_activityType_idx" ON "supportActivities"("activityType");

-- CreateIndex
CREATE INDEX "events_supportActivityId_idx" ON "events"("supportActivityId");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_supportActivityId_fkey" FOREIGN KEY ("supportActivityId") REFERENCES "supportActivities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supportActivities" ADD CONSTRAINT "supportActivities_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curriculums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
