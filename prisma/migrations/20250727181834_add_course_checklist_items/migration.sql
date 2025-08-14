-- CreateTable
CREATE TABLE "course_checklist_items" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "moduleId" INTEGER,
    "itemOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "course_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_checklist_items_courseId_idx" ON "course_checklist_items"("courseId");

-- CreateIndex
CREATE INDEX "course_checklist_items_moduleId_idx" ON "course_checklist_items"("moduleId");

-- CreateIndex
CREATE INDEX "course_checklist_items_category_idx" ON "course_checklist_items"("category");

-- CreateIndex
CREATE INDEX "course_checklist_items_priority_idx" ON "course_checklist_items"("priority");

-- AddForeignKey
ALTER TABLE "course_checklist_items" ADD CONSTRAINT "course_checklist_items_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_checklist_items" ADD CONSTRAINT "course_checklist_items_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
