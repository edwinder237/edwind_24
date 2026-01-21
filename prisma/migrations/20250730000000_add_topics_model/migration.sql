-- CreateTable
CREATE TABLE "topics" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "sub_organizationId" INTEGER NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_topics" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "topicId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "course_topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "topics_sub_organizationId_idx" ON "topics"("sub_organizationId");

-- CreateIndex
CREATE INDEX "topics_title_idx" ON "topics"("title");

-- CreateIndex
CREATE INDEX "topics_isActive_idx" ON "topics"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "course_topics_courseId_topicId_key" ON "course_topics"("courseId", "topicId");

-- CreateIndex
CREATE INDEX "course_topics_courseId_idx" ON "course_topics"("courseId");

-- CreateIndex
CREATE INDEX "course_topics_topicId_idx" ON "course_topics"("topicId");

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_topics" ADD CONSTRAINT "course_topics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_topics" ADD CONSTRAINT "course_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;