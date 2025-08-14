-- CreateTable
CREATE TABLE "toolAccesses" (
    "id" SERIAL NOT NULL,
    "tool" TEXT NOT NULL,
    "toolType" TEXT,
    "toolUrl" TEXT,
    "toolDescription" TEXT,
    "username" TEXT,
    "accessCode" TEXT,
    "participantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "toolAccesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_instructors" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'main',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_instructors" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'main',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_instructors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "toolAccesses_participantId_idx" ON "toolAccesses"("participantId");

-- CreateIndex
CREATE INDEX "toolAccesses_tool_idx" ON "toolAccesses"("tool");

-- CreateIndex
CREATE INDEX "event_instructors_eventId_idx" ON "event_instructors"("eventId");

-- CreateIndex
CREATE INDEX "event_instructors_instructorId_idx" ON "event_instructors"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "event_instructors_eventId_instructorId_key" ON "event_instructors"("eventId", "instructorId");

-- CreateIndex
CREATE INDEX "course_instructors_courseId_idx" ON "course_instructors"("courseId");

-- CreateIndex
CREATE INDEX "course_instructors_instructorId_idx" ON "course_instructors"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "course_instructors_courseId_instructorId_key" ON "course_instructors"("courseId", "instructorId");

-- AddForeignKey
ALTER TABLE "toolAccesses" ADD CONSTRAINT "toolAccesses_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_instructors" ADD CONSTRAINT "event_instructors_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_instructors" ADD CONSTRAINT "event_instructors_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
