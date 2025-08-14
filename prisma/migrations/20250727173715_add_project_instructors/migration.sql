-- CreateTable
CREATE TABLE "instructors" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "bio" TEXT,
    "expertise" TEXT[],
    "instructorType" TEXT NOT NULL DEFAULT 'main',
    "status" TEXT NOT NULL DEFAULT 'active',
    "profileImage" TEXT,
    "qualifications" JSONB,
    "hourlyRate" DOUBLE PRECISION,
    "availability" JSONB,
    "sub_organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_instructors" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_instructors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instructors_email_key" ON "instructors"("email");

-- CreateIndex
CREATE INDEX "instructors_sub_organizationId_idx" ON "instructors"("sub_organizationId");

-- CreateIndex
CREATE INDEX "instructors_instructorType_idx" ON "instructors"("instructorType");

-- CreateIndex
CREATE INDEX "instructors_status_idx" ON "instructors"("status");

-- CreateIndex
CREATE INDEX "project_instructors_projectId_idx" ON "project_instructors"("projectId");

-- CreateIndex
CREATE INDEX "project_instructors_instructorId_idx" ON "project_instructors"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "project_instructors_projectId_instructorId_key" ON "project_instructors"("projectId", "instructorId");

-- AddForeignKey
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_instructors" ADD CONSTRAINT "project_instructors_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_instructors" ADD CONSTRAINT "project_instructors_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
