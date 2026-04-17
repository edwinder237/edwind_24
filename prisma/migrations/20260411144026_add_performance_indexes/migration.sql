-- CreateIndex
CREATE INDEX "events_projectId_deletedAt_idx" ON "events"("projectId", "deletedAt");

-- CreateIndex
CREATE INDEX "instructors_deletedAt_idx" ON "instructors"("deletedAt");

-- CreateIndex
CREATE INDEX "organizations_deletedAt_idx" ON "organizations"("deletedAt");

-- CreateIndex
CREATE INDEX "participants_deletedAt_idx" ON "participants"("deletedAt");

-- CreateIndex
CREATE INDEX "participants_sub_organization_deletedAt_idx" ON "participants"("sub_organization", "deletedAt");

-- CreateIndex
CREATE INDEX "projects_deletedAt_idx" ON "projects"("deletedAt");

-- CreateIndex
CREATE INDEX "projects_sub_organizationId_deletedAt_idx" ON "projects"("sub_organizationId", "deletedAt");

-- CreateIndex
CREATE INDEX "training_recipients_deletedAt_idx" ON "training_recipients"("deletedAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");
