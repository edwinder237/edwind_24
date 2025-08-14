-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "midName" TEXT,
    "lastName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "info" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "sub_organizationId" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedby" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "info" JSONB,
    "logo_url" TEXT,
    "status" TEXT,
    "type" TEXT,
    "notes" TEXT,
    "published" BOOLEAN NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_organizations" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedby" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "sub_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "sub_organizationId" INTEGER NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_roles" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "course_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_recipients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "taxId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "sub_organizationId" INTEGER NOT NULL,

    CONSTRAINT "training_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "sub_organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedby" TEXT,
    "CreatedBy" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "summary" VARCHAR(1000),
    "duration" INTEGER,
    "tags" JSONB,
    "projectType" TEXT,
    "projectCategory" TEXT,
    "projectStatus" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "backgroundImg" TEXT,
    "color" TEXT,
    "language" TEXT NOT NULL DEFAULT 'english',
    "location" JSONB,
    "trainingRecipientId" INTEGER,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "participantStatus" TEXT,
    "participantType" TEXT,
    "sub_organization" INTEGER NOT NULL,
    "derpartement" TEXT,
    "roleId" TEXT NOT NULL,
    "notes" TEXT,
    "profilePrefs" JSONB NOT NULL,
    "profileImg" TEXT,
    "credentials" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedby" TEXT,
    "createdBy" TEXT,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_curriculums" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER NOT NULL,
    "curriculumId" INTEGER NOT NULL,

    CONSTRAINT "project_curriculums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_participants" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "project_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learners_progress" (
    "id" SERIAL NOT NULL,
    "participantId" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "learners_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" SERIAL NOT NULL,
    "groupName" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "chipColor" TEXT NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_participants" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "participantId" INTEGER NOT NULL,

    CONSTRAINT "group_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_tags" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "sub_organizationId" INTEGER NOT NULL,

    CONSTRAINT "course_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_tags" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "module_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "sub_organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3),
    "published" BOOLEAN,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "language" TEXT,
    "deliveryMethod" TEXT,
    "goLiveDate" TIMESTAMP(3),
    "maxParticipants" INTEGER,
    "deadline" TIMESTAMP(3),
    "duration" INTEGER,
    "cost" DOUBLE PRECISION,
    "level" TEXT,
    "accessRestrictions" TEXT,
    "certification" TEXT,
    "tags" TEXT,
    "CourseType" TEXT,
    "courseCategory" TEXT,
    "courseStatus" TEXT,
    "targetAudience" TEXT,
    "isMandatoryToAllRole" BOOLEAN NOT NULL DEFAULT false,
    "backgroundImg" TEXT,
    "resources" TEXT,
    "syllabusId" INTEGER,
    "JSONSyllabus" JSONB,
    "rating" DOUBLE PRECISION,
    "code" TEXT,
    "version" TEXT,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses_enrollee_progress" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "enrolleeId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedby" TEXT,
    "createdBy" TEXT,

    CONSTRAINT "courses_enrollee_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "JSONContent" JSONB,
    "duration" INTEGER,
    "moduleStatus" TEXT,
    "backgroundImg" TEXT,
    "courseId" INTEGER NOT NULL,
    "moduleOrder" INTEGER,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules_progress" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "learnerId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedby" TEXT,
    "createdBy" TEXT,

    CONSTRAINT "modules_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculums_enrollees_progress" (
    "id" SERIAL NOT NULL,
    "enrolleeId" INTEGER NOT NULL,
    "curriculumId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "curriculums_enrollees_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculums" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_courses" (
    "id" SERIAL NOT NULL,
    "curriculumId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "curriculum_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published" BOOLEAN NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "duration" INTEGER,
    "activityType" TEXT,
    "activityCategory" TEXT,
    "activityStatus" TEXT,
    "backgroundImg" TEXT,
    "moduleId" INTEGER NOT NULL,
    "ActivityOrder" INTEGER,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities_progress" (
    "id" SERIAL NOT NULL,
    "activitieId" INTEGER NOT NULL,
    "learnerId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedby" TEXT,
    "createdBy" TEXT,

    CONSTRAINT "activities_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT,
    "projectId" INTEGER NOT NULL,
    "courseId" INTEGER,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL,
    "color" TEXT,
    "textColor" TEXT,
    "backgroundColor" TEXT DEFAULT '#4287f5',
    "borderColor" TEXT,
    "editable" BOOLEAN,
    "eventStatus" TEXT,
    "extendedProps" JSONB,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendees" (
    "id" SERIAL NOT NULL,
    "eventsId" INTEGER NOT NULL,
    "attendance_status" TEXT NOT NULL DEFAULT 'scheduled',
    "enrolleeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedby" TEXT,
    "createdBy" TEXT,

    CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_groups" (
    "id" SERIAL NOT NULL,
    "eventsId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "event_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_focus" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "focus" VARCHAR(500) NOT NULL,
    "projectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "daily_focus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_sub_organizationId_idx" ON "users"("sub_organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_token_key" ON "verificationtokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "verificationtokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "sub_organizations_organizationId_key" ON "sub_organizations"("organizationId");

-- CreateIndex
CREATE INDEX "course_roles_roleId_idx" ON "course_roles"("roleId");

-- CreateIndex
CREATE INDEX "course_roles_courseId_idx" ON "course_roles"("courseId");

-- CreateIndex
CREATE INDEX "training_recipients_sub_organizationId_idx" ON "training_recipients"("sub_organizationId");

-- CreateIndex
CREATE INDEX "projects_CreatedBy_idx" ON "projects"("CreatedBy");

-- CreateIndex
CREATE INDEX "projects_sub_organizationId_idx" ON "projects"("sub_organizationId");

-- CreateIndex
CREATE INDEX "projects_trainingRecipientId_idx" ON "projects"("trainingRecipientId");

-- CreateIndex
CREATE UNIQUE INDEX "participants_email_key" ON "participants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "project_curriculums_curriculumId_key" ON "project_curriculums"("curriculumId");

-- CreateIndex
CREATE INDEX "project_curriculums_curriculumId_idx" ON "project_curriculums"("curriculumId");

-- CreateIndex
CREATE INDEX "project_curriculums_projectId_idx" ON "project_curriculums"("projectId");

-- CreateIndex
CREATE INDEX "project_participants_projectId_idx" ON "project_participants"("projectId");

-- CreateIndex
CREATE INDEX "project_participants_participantId_idx" ON "project_participants"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "project_participants_projectId_participantId_key" ON "project_participants"("projectId", "participantId");

-- CreateIndex
CREATE INDEX "groups_projectId_idx" ON "groups"("projectId");

-- CreateIndex
CREATE INDEX "group_participants_groupId_idx" ON "group_participants"("groupId");

-- CreateIndex
CREATE INDEX "group_participants_participantId_idx" ON "group_participants"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "group_participants_groupId_participantId_key" ON "group_participants"("groupId", "participantId");

-- CreateIndex
CREATE INDEX "course_tags_sub_organizationId_idx" ON "course_tags"("sub_organizationId");

-- CreateIndex
CREATE INDEX "course_tags_tagId_idx" ON "course_tags"("tagId");

-- CreateIndex
CREATE INDEX "course_tags_courseId_idx" ON "course_tags"("courseId");

-- CreateIndex
CREATE INDEX "module_tags_tagId_idx" ON "module_tags"("tagId");

-- CreateIndex
CREATE INDEX "module_tags_moduleId_idx" ON "module_tags"("moduleId");

-- CreateIndex
CREATE INDEX "courses_sub_organizationId_idx" ON "courses"("sub_organizationId");

-- CreateIndex
CREATE INDEX "courses_enrollee_progress_courseId_idx" ON "courses_enrollee_progress"("courseId");

-- CreateIndex
CREATE INDEX "courses_enrollee_progress_enrolleeId_idx" ON "courses_enrollee_progress"("enrolleeId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_enrollee_progress_courseId_completed_enrolleeId_key" ON "courses_enrollee_progress"("courseId", "completed", "enrolleeId");

-- CreateIndex
CREATE INDEX "modules_courseId_idx" ON "modules"("courseId");

-- CreateIndex
CREATE INDEX "modules_progress_moduleId_idx" ON "modules_progress"("moduleId");

-- CreateIndex
CREATE INDEX "modules_progress_learnerId_idx" ON "modules_progress"("learnerId");

-- CreateIndex
CREATE UNIQUE INDEX "modules_progress_moduleId_completed_learnerId_key" ON "modules_progress"("moduleId", "completed", "learnerId");

-- CreateIndex
CREATE INDEX "curriculums_enrollees_progress_curriculumId_idx" ON "curriculums_enrollees_progress"("curriculumId");

-- CreateIndex
CREATE UNIQUE INDEX "curriculums_enrollees_progress_enrolleeId_curriculumId_key" ON "curriculums_enrollees_progress"("enrolleeId", "curriculumId");

-- CreateIndex
CREATE INDEX "curriculum_courses_curriculumId_idx" ON "curriculum_courses"("curriculumId");

-- CreateIndex
CREATE INDEX "curriculum_courses_courseId_idx" ON "curriculum_courses"("courseId");

-- CreateIndex
CREATE INDEX "activities_moduleId_idx" ON "activities"("moduleId");

-- CreateIndex
CREATE INDEX "activities_progress_activitieId_idx" ON "activities_progress"("activitieId");

-- CreateIndex
CREATE INDEX "activities_progress_learnerId_idx" ON "activities_progress"("learnerId");

-- CreateIndex
CREATE UNIQUE INDEX "activities_progress_activitieId_completed_learnerId_key" ON "activities_progress"("activitieId", "completed", "learnerId");

-- CreateIndex
CREATE INDEX "events_projectId_idx" ON "events"("projectId");

-- CreateIndex
CREATE INDEX "events_courseId_idx" ON "events"("courseId");

-- CreateIndex
CREATE INDEX "event_attendees_eventsId_idx" ON "event_attendees"("eventsId");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_enrolleeId_key" ON "event_attendees"("enrolleeId");

-- CreateIndex
CREATE INDEX "event_groups_eventsId_idx" ON "event_groups"("eventsId");

-- CreateIndex
CREATE UNIQUE INDEX "event_groups_groupId_key" ON "event_groups"("groupId");

-- CreateIndex
CREATE INDEX "daily_focus_projectId_idx" ON "daily_focus"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_focus_date_projectId_key" ON "daily_focus"("date", "projectId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_organizations" ADD CONSTRAINT "sub_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_roles" ADD CONSTRAINT "course_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_roles" ADD CONSTRAINT "course_roles_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_recipients" ADD CONSTRAINT "training_recipients_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_trainingRecipientId_fkey" FOREIGN KEY ("trainingRecipientId") REFERENCES "training_recipients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_curriculums" ADD CONSTRAINT "project_curriculums_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_curriculums" ADD CONSTRAINT "project_curriculums_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curriculums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_participants" ADD CONSTRAINT "project_participants_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_participants" ADD CONSTRAINT "project_participants_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "project_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tags" ADD CONSTRAINT "course_tags_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tags" ADD CONSTRAINT "course_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tags" ADD CONSTRAINT "course_tags_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_tags" ADD CONSTRAINT "module_tags_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_tags" ADD CONSTRAINT "module_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses_enrollee_progress" ADD CONSTRAINT "courses_enrollee_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses_enrollee_progress" ADD CONSTRAINT "courses_enrollee_progress_enrolleeId_fkey" FOREIGN KEY ("enrolleeId") REFERENCES "project_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules_progress" ADD CONSTRAINT "modules_progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules_progress" ADD CONSTRAINT "modules_progress_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculums_enrollees_progress" ADD CONSTRAINT "curriculums_enrollees_progress_enrolleeId_fkey" FOREIGN KEY ("enrolleeId") REFERENCES "project_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculums_enrollees_progress" ADD CONSTRAINT "curriculums_enrollees_progress_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "project_curriculums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_courses" ADD CONSTRAINT "curriculum_courses_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curriculums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_courses" ADD CONSTRAINT "curriculum_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities_progress" ADD CONSTRAINT "activities_progress_activitieId_fkey" FOREIGN KEY ("activitieId") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities_progress" ADD CONSTRAINT "activities_progress_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_eventsId_fkey" FOREIGN KEY ("eventsId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_enrolleeId_fkey" FOREIGN KEY ("enrolleeId") REFERENCES "project_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_groups" ADD CONSTRAINT "event_groups_eventsId_fkey" FOREIGN KEY ("eventsId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_groups" ADD CONSTRAINT "event_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_focus" ADD CONSTRAINT "daily_focus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
