-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "workos_user_id" TEXT,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "midName" TEXT,
    "lastName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "info" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "sub_organizationId" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "workos_org_id" TEXT,
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
CREATE TABLE "sub_organization_participant_role" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sub_organizationId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "sub_organization_participant_role_pkey" PRIMARY KEY ("id")
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
    "location" JSONB,
    "img" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
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
    "language" TEXT NOT NULL DEFAULT 'English',
    "location" JSONB,
    "trainingRecipientId" INTEGER,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_lot_items" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'issue',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "reportedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solvedDate" TIMESTAMP(3),
    "reportedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "parking_lot_items_pkey" PRIMARY KEY ("id")
);

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
    "instructorType" TEXT NOT NULL DEFAULT 'main',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_settings" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "startOfDayTime" TEXT NOT NULL DEFAULT '09:00',
    "endOfDayTime" TEXT NOT NULL DEFAULT '17:00',
    "lunchTime" TEXT DEFAULT '12:00-13:00',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "workingDays" TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "project_settings_pkey" PRIMARY KEY ("id")
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
    "trainingRecipientId" INTEGER,
    "externalId" TEXT,
    "derpartement" TEXT,
    "tag" TEXT DEFAULT '',
    "roleId" INTEGER,
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
    "trainingRecipientId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "note" VARCHAR(2000),

    CONSTRAINT "project_participants_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "sub_organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "authorName" TEXT,
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "targetAudience" TEXT,
    "isMandatoryToAllRole" BOOLEAN NOT NULL DEFAULT false,
    "backgroundImg" TEXT,
    "resources" TEXT,
    "syllabusId" INTEGER,
    "JSONSyllabus" JSONB,
    "rating" DOUBLE PRECISION,
    "code" TEXT,
    "version" TEXT,
    "currentVersionId" INTEGER,
    "draftVersionId" INTEGER,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses_enrollee_progress" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "courseVersionId" INTEGER,
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
    "customDuration" INTEGER,
    "level" TEXT,
    "moduleStatus" TEXT,
    "backgroundImg" TEXT,
    "courseId" INTEGER NOT NULL,
    "moduleOrder" INTEGER,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculums" (
    "id" SERIAL NOT NULL,
    "cuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sub_organizationId" INTEGER NOT NULL,
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
    "contentUrl" TEXT DEFAULT '',
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
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT,
    "projectId" INTEGER NOT NULL,
    "courseId" INTEGER,
    "courseVersionId" INTEGER,
    "supportActivityId" INTEGER,
    "roomId" INTEGER,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL,
    "color" TEXT,
    "textColor" TEXT,
    "backgroundColor" TEXT DEFAULT '#4287f5',
    "borderColor" TEXT,
    "editable" BOOLEAN,
    "eventStatus" TEXT,
    "timezone" TEXT,
    "deliveryMode" TEXT DEFAULT 'in_person',
    "meetingLink" TEXT,
    "extendedProps" JSONB,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendees" (
    "id" SERIAL NOT NULL,
    "eventsId" INTEGER NOT NULL,
    "attendance_status" TEXT NOT NULL DEFAULT 'scheduled',
    "enrolleeId" INTEGER NOT NULL,
    "attendanceType" TEXT NOT NULL DEFAULT 'group',
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

-- CreateTable
CREATE TABLE "daily_training_notes" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "keyHighlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "challenges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sessionNotes" TEXT,
    "author" TEXT,
    "authorRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "daily_training_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supportActivities" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "activityType" TEXT NOT NULL DEFAULT 'General',
    "duration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "curriculumId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "supportActivities_pkey" PRIMARY KEY ("id")
);

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
    "organizationToolId" INTEGER,

    CONSTRAINT "toolAccesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_tools" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "toolType" TEXT,
    "toolUrl" TEXT,
    "toolDescription" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "sub_organizationId" INTEGER NOT NULL,

    CONSTRAINT "organization_tools_pkey" PRIMARY KEY ("id")
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
    "participantOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "course_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_curriculums" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "curriculumId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "group_curriculums_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "course_participant_roles" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "course_participant_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_participant_roles" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "module_participant_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_course_checklist_progress" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "checklistItemId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "project_course_checklist_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_participants_course_checklist_progress" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "participantId" INTEGER NOT NULL,
    "checklistItemId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "project_participants_course_checklist_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_objectives" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "objective" TEXT NOT NULL,
    "objectiveOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "course_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_objectives" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "objective" TEXT NOT NULL,
    "objectiveOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "module_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" SERIAL NOT NULL,
    "curriculumId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalDays" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plan_days" (
    "id" SERIAL NOT NULL,
    "trainingPlanId" INTEGER NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "dayTitle" TEXT,
    "dayDescription" TEXT,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_plan_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plan_modules" (
    "id" SERIAL NOT NULL,
    "trainingPlanDayId" INTEGER NOT NULL,
    "moduleId" INTEGER,
    "courseId" INTEGER,
    "supportActivityId" INTEGER,
    "customTitle" TEXT,
    "customDuration" INTEGER,
    "moduleOrder" INTEGER NOT NULL,
    "activities" JSONB,
    "learningObjectives" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_plan_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_topics" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" INTEGER NOT NULL,
    "topicId" INTEGER NOT NULL,

    CONSTRAINT "project_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_activity_progress" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_activity_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_module_progress" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_module_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_assessments" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assessmentOrder" INTEGER,
    "allowRetakes" BOOLEAN NOT NULL DEFAULT true,
    "maxAttempts" INTEGER,
    "scoreStrategy" TEXT NOT NULL DEFAULT 'latest',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "course_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_assessment_config" (
    "id" SERIAL NOT NULL,
    "curriculumId" INTEGER NOT NULL,
    "courseAssessmentId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "curriculum_assessment_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_assessment_config" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "courseAssessmentId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "project_assessment_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_assessment_scores" (
    "id" SERIAL NOT NULL,
    "courseAssessmentId" INTEGER NOT NULL,
    "participantId" INTEGER NOT NULL,
    "instructorId" INTEGER,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "scoreEarned" DOUBLE PRECISION NOT NULL,
    "scoreMaximum" DOUBLE PRECISION NOT NULL,
    "scorePercentage" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "feedback" TEXT,
    "assessmentDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "participant_assessment_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_checklist_items" (
    "id" SERIAL NOT NULL,
    "curriculumId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'trainer_prep',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "itemOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "curriculum_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_curriculum_checklist_progress" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "checklistItemId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "project_curriculum_checklist_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workos_membership_id" TEXT NOT NULL,
    "workos_role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "cached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" SERIAL NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "features" JSONB NOT NULL,
    "resourceLimits" JSONB NOT NULL,
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "stripeAnnualPriceId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "highlightText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "customFeatures" JSONB,
    "customLimits" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_history" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromPlanId" TEXT,
    "toPlanId" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT,
    "changedBy" TEXT,
    "changedByRole" TEXT,
    "metadata" JSONB,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_surveys" (
    "id" SERIAL NOT NULL,
    "curriculumId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "surveyType" TEXT NOT NULL DEFAULT 'post_training',
    "provider" TEXT NOT NULL,
    "providerConfig" JSONB NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "triggerCourseId" INTEGER,
    "customTriggerDays" INTEGER,
    "displayOrder" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "curriculum_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "capacity" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'Physical',
    "roomType" TEXT NOT NULL DEFAULT 'Conference',
    "status" TEXT NOT NULL DEFAULT 'Available',
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" VARCHAR(500),
    "trainingRecipientId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_roles" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hierarchyLevel" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scope" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_role_overrides" (
    "id" SERIAL NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "organization_role_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permission_overrides" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "user_permission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_versions" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "duration" INTEGER,
    "JSONSyllabus" JSONB,
    "snapshotData" JSONB,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "course_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_versions" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "courseVersionId" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "JSONContent" JSONB,
    "duration" INTEGER,
    "customDuration" INTEGER,
    "moduleOrder" INTEGER,
    "snapshotData" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_versions" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "moduleVersionId" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "contentUrl" TEXT,
    "activityType" TEXT,
    "duration" INTEGER,
    "ActivityOrder" INTEGER,
    "snapshotData" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_changelogs" (
    "id" SERIAL NOT NULL,
    "courseVersionId" INTEGER NOT NULL,
    "changeType" TEXT NOT NULL,
    "changeCategory" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "version_changelogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_audit_logs" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "fieldChanges" JSONB,
    "previousVersion" TEXT,
    "newVersion" TEXT,
    "versionBumpType" TEXT,
    "metadata" JSONB,
    "changedBy" TEXT,
    "changedByName" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_logs" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "projectId" INTEGER,
    "inputSize" INTEGER,
    "outputSize" INTEGER,
    "durationMs" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCostUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_integrations" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "providerEmail" TEXT,
    "calendarId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_event_mappings" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "integrationId" INTEGER NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_event_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" SERIAL NOT NULL,
    "sub_organizationId" INTEGER NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "recipientType" TEXT NOT NULL DEFAULT 'participant',
    "subject" TEXT NOT NULL,
    "emailType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "errorMessage" TEXT,
    "resendEmailId" TEXT,
    "projectId" INTEGER,
    "projectTitle" TEXT,
    "eventId" INTEGER,
    "participantId" TEXT,
    "sentByUserId" TEXT,
    "sentByUserName" TEXT,
    "deliveryStatus" TEXT,
    "deliveryUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_workos_user_id_key" ON "users"("workos_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_sub_organizationId_idx" ON "users"("sub_organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_workos_org_id_key" ON "organizations"("workos_org_id");

-- CreateIndex
CREATE INDEX "sub_organizations_organizationId_idx" ON "sub_organizations"("organizationId");

-- CreateIndex
CREATE INDEX "sub_organization_participant_role_sub_organizationId_idx" ON "sub_organization_participant_role"("sub_organizationId");

-- CreateIndex
CREATE INDEX "sub_organization_participant_role_title_idx" ON "sub_organization_participant_role"("title");

-- CreateIndex
CREATE UNIQUE INDEX "sub_organization_participant_role_title_sub_organizationId_key" ON "sub_organization_participant_role"("title", "sub_organizationId");

-- CreateIndex
CREATE INDEX "training_recipients_sub_organizationId_idx" ON "training_recipients"("sub_organizationId");

-- CreateIndex
CREATE INDEX "training_recipients_status_idx" ON "training_recipients"("status");

-- CreateIndex
CREATE INDEX "projects_CreatedBy_idx" ON "projects"("CreatedBy");

-- CreateIndex
CREATE INDEX "projects_sub_organizationId_createdAt_idx" ON "projects"("sub_organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "projects_trainingRecipientId_idx" ON "projects"("trainingRecipientId");

-- CreateIndex
CREATE INDEX "parking_lot_items_projectId_idx" ON "parking_lot_items"("projectId");

-- CreateIndex
CREATE INDEX "parking_lot_items_status_idx" ON "parking_lot_items"("status");

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

-- CreateIndex
CREATE UNIQUE INDEX "project_settings_projectId_key" ON "project_settings"("projectId");

-- CreateIndex
CREATE INDEX "participants_trainingRecipientId_idx" ON "participants"("trainingRecipientId");

-- CreateIndex
CREATE INDEX "participants_roleId_idx" ON "participants"("roleId");

-- CreateIndex
CREATE INDEX "participants_sub_organization_idx" ON "participants"("sub_organization");

-- CreateIndex
CREATE UNIQUE INDEX "participants_email_sub_organization_key" ON "participants"("email", "sub_organization");

-- CreateIndex
CREATE UNIQUE INDEX "participants_externalId_trainingRecipientId_key" ON "participants"("externalId", "trainingRecipientId");

-- CreateIndex
CREATE INDEX "project_curriculums_curriculumId_idx" ON "project_curriculums"("curriculumId");

-- CreateIndex
CREATE INDEX "project_curriculums_projectId_idx" ON "project_curriculums"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_curriculums_projectId_curriculumId_key" ON "project_curriculums"("projectId", "curriculumId");

-- CreateIndex
CREATE INDEX "project_participants_projectId_status_idx" ON "project_participants"("projectId", "status");

-- CreateIndex
CREATE INDEX "project_participants_participantId_idx" ON "project_participants"("participantId");

-- CreateIndex
CREATE INDEX "project_participants_trainingRecipientId_idx" ON "project_participants"("trainingRecipientId");

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
CREATE INDEX "courses_sub_organizationId_isActive_idx" ON "courses"("sub_organizationId", "isActive");

-- CreateIndex
CREATE INDEX "courses_currentVersionId_idx" ON "courses"("currentVersionId");

-- CreateIndex
CREATE INDEX "courses_enrollee_progress_courseId_idx" ON "courses_enrollee_progress"("courseId");

-- CreateIndex
CREATE INDEX "courses_enrollee_progress_courseVersionId_idx" ON "courses_enrollee_progress"("courseVersionId");

-- CreateIndex
CREATE INDEX "courses_enrollee_progress_enrolleeId_idx" ON "courses_enrollee_progress"("enrolleeId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_enrollee_progress_courseId_completed_enrolleeId_key" ON "courses_enrollee_progress"("courseId", "completed", "enrolleeId");

-- CreateIndex
CREATE INDEX "modules_courseId_idx" ON "modules"("courseId");

-- CreateIndex
CREATE INDEX "curriculums_sub_organizationId_idx" ON "curriculums"("sub_organizationId");

-- CreateIndex
CREATE INDEX "curriculum_courses_curriculumId_idx" ON "curriculum_courses"("curriculumId");

-- CreateIndex
CREATE INDEX "curriculum_courses_courseId_idx" ON "curriculum_courses"("courseId");

-- CreateIndex
CREATE INDEX "activities_moduleId_idx" ON "activities"("moduleId");

-- CreateIndex
CREATE INDEX "events_projectId_start_idx" ON "events"("projectId", "start");

-- CreateIndex
CREATE INDEX "events_eventType_idx" ON "events"("eventType");

-- CreateIndex
CREATE INDEX "events_courseId_idx" ON "events"("courseId");

-- CreateIndex
CREATE INDEX "events_courseVersionId_idx" ON "events"("courseVersionId");

-- CreateIndex
CREATE INDEX "events_supportActivityId_idx" ON "events"("supportActivityId");

-- CreateIndex
CREATE INDEX "events_roomId_idx" ON "events"("roomId");

-- CreateIndex
CREATE INDEX "event_attendees_eventsId_idx" ON "event_attendees"("eventsId");

-- CreateIndex
CREATE INDEX "event_attendees_enrolleeId_idx" ON "event_attendees"("enrolleeId");

-- CreateIndex
CREATE INDEX "event_attendees_attendanceType_idx" ON "event_attendees"("attendanceType");

-- CreateIndex
CREATE INDEX "event_attendees_attendance_status_idx" ON "event_attendees"("attendance_status");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_eventsId_enrolleeId_key" ON "event_attendees"("eventsId", "enrolleeId");

-- CreateIndex
CREATE INDEX "event_groups_eventsId_idx" ON "event_groups"("eventsId");

-- CreateIndex
CREATE INDEX "event_groups_groupId_idx" ON "event_groups"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "event_groups_eventsId_groupId_key" ON "event_groups"("eventsId", "groupId");

-- CreateIndex
CREATE INDEX "daily_focus_projectId_idx" ON "daily_focus"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_focus_date_projectId_key" ON "daily_focus"("date", "projectId");

-- CreateIndex
CREATE INDEX "daily_training_notes_projectId_idx" ON "daily_training_notes"("projectId");

-- CreateIndex
CREATE INDEX "daily_training_notes_date_idx" ON "daily_training_notes"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_training_notes_projectId_date_key" ON "daily_training_notes"("projectId", "date");

-- CreateIndex
CREATE INDEX "supportActivities_curriculumId_idx" ON "supportActivities"("curriculumId");

-- CreateIndex
CREATE INDEX "supportActivities_activityType_idx" ON "supportActivities"("activityType");

-- CreateIndex
CREATE INDEX "toolAccesses_participantId_idx" ON "toolAccesses"("participantId");

-- CreateIndex
CREATE INDEX "toolAccesses_tool_idx" ON "toolAccesses"("tool");

-- CreateIndex
CREATE INDEX "toolAccesses_organizationToolId_idx" ON "toolAccesses"("organizationToolId");

-- CreateIndex
CREATE INDEX "organization_tools_sub_organizationId_idx" ON "organization_tools"("sub_organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_tools_name_sub_organizationId_key" ON "organization_tools"("name", "sub_organizationId");

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

-- CreateIndex
CREATE INDEX "course_checklist_items_courseId_idx" ON "course_checklist_items"("courseId");

-- CreateIndex
CREATE INDEX "course_checklist_items_moduleId_idx" ON "course_checklist_items"("moduleId");

-- CreateIndex
CREATE INDEX "course_checklist_items_category_idx" ON "course_checklist_items"("category");

-- CreateIndex
CREATE INDEX "course_checklist_items_priority_idx" ON "course_checklist_items"("priority");

-- CreateIndex
CREATE INDEX "group_curriculums_groupId_idx" ON "group_curriculums"("groupId");

-- CreateIndex
CREATE INDEX "group_curriculums_curriculumId_idx" ON "group_curriculums"("curriculumId");

-- CreateIndex
CREATE UNIQUE INDEX "group_curriculums_groupId_curriculumId_key" ON "group_curriculums"("groupId", "curriculumId");

-- CreateIndex
CREATE INDEX "topics_sub_organizationId_idx" ON "topics"("sub_organizationId");

-- CreateIndex
CREATE INDEX "topics_title_idx" ON "topics"("title");

-- CreateIndex
CREATE UNIQUE INDEX "topics_title_sub_organizationId_key" ON "topics"("title", "sub_organizationId");

-- CreateIndex
CREATE INDEX "course_topics_courseId_idx" ON "course_topics"("courseId");

-- CreateIndex
CREATE INDEX "course_topics_topicId_idx" ON "course_topics"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "course_topics_courseId_topicId_key" ON "course_topics"("courseId", "topicId");

-- CreateIndex
CREATE INDEX "course_participant_roles_courseId_idx" ON "course_participant_roles"("courseId");

-- CreateIndex
CREATE INDEX "course_participant_roles_roleId_idx" ON "course_participant_roles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "course_participant_roles_courseId_roleId_key" ON "course_participant_roles"("courseId", "roleId");

-- CreateIndex
CREATE INDEX "module_participant_roles_moduleId_idx" ON "module_participant_roles"("moduleId");

-- CreateIndex
CREATE INDEX "module_participant_roles_roleId_idx" ON "module_participant_roles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "module_participant_roles_moduleId_roleId_key" ON "module_participant_roles"("moduleId", "roleId");

-- CreateIndex
CREATE INDEX "project_course_checklist_progress_projectId_idx" ON "project_course_checklist_progress"("projectId");

-- CreateIndex
CREATE INDEX "project_course_checklist_progress_checklistItemId_idx" ON "project_course_checklist_progress"("checklistItemId");

-- CreateIndex
CREATE UNIQUE INDEX "project_course_checklist_progress_projectId_checklistItemId_key" ON "project_course_checklist_progress"("projectId", "checklistItemId");

-- CreateIndex
CREATE INDEX "project_participants_course_checklist_progress_projectId_idx" ON "project_participants_course_checklist_progress"("projectId");

-- CreateIndex
CREATE INDEX "project_participants_course_checklist_progress_participantI_idx" ON "project_participants_course_checklist_progress"("participantId");

-- CreateIndex
CREATE INDEX "project_participants_course_checklist_progress_checklistIte_idx" ON "project_participants_course_checklist_progress"("checklistItemId");

-- CreateIndex
CREATE UNIQUE INDEX "project_participants_course_checklist_progress_projectId_pa_key" ON "project_participants_course_checklist_progress"("projectId", "participantId", "checklistItemId");

-- CreateIndex
CREATE INDEX "course_objectives_courseId_idx" ON "course_objectives"("courseId");

-- CreateIndex
CREATE INDEX "course_objectives_objectiveOrder_idx" ON "course_objectives"("objectiveOrder");

-- CreateIndex
CREATE INDEX "module_objectives_moduleId_idx" ON "module_objectives"("moduleId");

-- CreateIndex
CREATE INDEX "module_objectives_objectiveOrder_idx" ON "module_objectives"("objectiveOrder");

-- CreateIndex
CREATE INDEX "training_plans_curriculumId_idx" ON "training_plans"("curriculumId");

-- CreateIndex
CREATE INDEX "training_plans_projectId_idx" ON "training_plans"("projectId");

-- CreateIndex
CREATE INDEX "training_plans_status_idx" ON "training_plans"("status");

-- CreateIndex
CREATE UNIQUE INDEX "training_plans_curriculumId_projectId_key" ON "training_plans"("curriculumId", "projectId");

-- CreateIndex
CREATE INDEX "training_plan_days_trainingPlanId_idx" ON "training_plan_days"("trainingPlanId");

-- CreateIndex
CREATE INDEX "training_plan_days_dayNumber_idx" ON "training_plan_days"("dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "training_plan_days_trainingPlanId_dayNumber_key" ON "training_plan_days"("trainingPlanId", "dayNumber");

-- CreateIndex
CREATE INDEX "training_plan_modules_trainingPlanDayId_idx" ON "training_plan_modules"("trainingPlanDayId");

-- CreateIndex
CREATE INDEX "training_plan_modules_moduleId_idx" ON "training_plan_modules"("moduleId");

-- CreateIndex
CREATE INDEX "training_plan_modules_courseId_idx" ON "training_plan_modules"("courseId");

-- CreateIndex
CREATE INDEX "training_plan_modules_supportActivityId_idx" ON "training_plan_modules"("supportActivityId");

-- CreateIndex
CREATE INDEX "training_plan_modules_moduleOrder_idx" ON "training_plan_modules"("moduleOrder");

-- CreateIndex
CREATE INDEX "project_topics_projectId_idx" ON "project_topics"("projectId");

-- CreateIndex
CREATE INDEX "project_topics_topicId_idx" ON "project_topics"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "project_topics_projectId_topicId_key" ON "project_topics"("projectId", "topicId");

-- CreateIndex
CREATE INDEX "event_activity_progress_eventId_idx" ON "event_activity_progress"("eventId");

-- CreateIndex
CREATE INDEX "event_activity_progress_activityId_idx" ON "event_activity_progress"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "event_activity_progress_eventId_activityId_key" ON "event_activity_progress"("eventId", "activityId");

-- CreateIndex
CREATE INDEX "event_module_progress_eventId_idx" ON "event_module_progress"("eventId");

-- CreateIndex
CREATE INDEX "event_module_progress_moduleId_idx" ON "event_module_progress"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "event_module_progress_eventId_moduleId_key" ON "event_module_progress"("eventId", "moduleId");

-- CreateIndex
CREATE INDEX "course_assessments_courseId_idx" ON "course_assessments"("courseId");

-- CreateIndex
CREATE INDEX "curriculum_assessment_config_curriculumId_idx" ON "curriculum_assessment_config"("curriculumId");

-- CreateIndex
CREATE INDEX "curriculum_assessment_config_courseAssessmentId_idx" ON "curriculum_assessment_config"("courseAssessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_assessment_config_curriculumId_courseAssessmentI_key" ON "curriculum_assessment_config"("curriculumId", "courseAssessmentId");

-- CreateIndex
CREATE INDEX "project_assessment_config_projectId_idx" ON "project_assessment_config"("projectId");

-- CreateIndex
CREATE INDEX "project_assessment_config_courseAssessmentId_idx" ON "project_assessment_config"("courseAssessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "project_assessment_config_projectId_courseAssessmentId_key" ON "project_assessment_config"("projectId", "courseAssessmentId");

-- CreateIndex
CREATE INDEX "participant_assessment_scores_participantId_courseAssessmen_idx" ON "participant_assessment_scores"("participantId", "courseAssessmentId", "isCurrent");

-- CreateIndex
CREATE INDEX "participant_assessment_scores_instructorId_idx" ON "participant_assessment_scores"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "participant_assessment_scores_courseAssessmentId_participan_key" ON "participant_assessment_scores"("courseAssessmentId", "participantId", "attemptNumber");

-- CreateIndex
CREATE INDEX "curriculum_checklist_items_curriculumId_idx" ON "curriculum_checklist_items"("curriculumId");

-- CreateIndex
CREATE INDEX "curriculum_checklist_items_category_idx" ON "curriculum_checklist_items"("category");

-- CreateIndex
CREATE INDEX "curriculum_checklist_items_priority_idx" ON "curriculum_checklist_items"("priority");

-- CreateIndex
CREATE INDEX "curriculum_checklist_items_itemOrder_idx" ON "curriculum_checklist_items"("itemOrder");

-- CreateIndex
CREATE INDEX "project_curriculum_checklist_progress_projectId_idx" ON "project_curriculum_checklist_progress"("projectId");

-- CreateIndex
CREATE INDEX "project_curriculum_checklist_progress_checklistItemId_idx" ON "project_curriculum_checklist_progress"("checklistItemId");

-- CreateIndex
CREATE UNIQUE INDEX "project_curriculum_checklist_progress_projectId_checklistIt_key" ON "project_curriculum_checklist_progress"("projectId", "checklistItemId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_workos_membership_id_key" ON "organization_memberships"("workos_membership_id");

-- CreateIndex
CREATE INDEX "organization_memberships_userId_idx" ON "organization_memberships"("userId");

-- CreateIndex
CREATE INDEX "organization_memberships_organizationId_idx" ON "organization_memberships"("organizationId");

-- CreateIndex
CREATE INDEX "organization_memberships_status_idx" ON "organization_memberships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_userId_organizationId_key" ON "organization_memberships"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_planId_key" ON "subscription_plans"("planId");

-- CreateIndex
CREATE INDEX "subscription_plans_displayOrder_idx" ON "subscription_plans"("displayOrder");

-- CreateIndex
CREATE INDEX "subscription_plans_stripeProductId_idx" ON "subscription_plans"("stripeProductId");

-- CreateIndex
CREATE INDEX "subscription_plans_stripePriceId_idx" ON "subscription_plans"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_organizationId_key" ON "subscriptions"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeCustomerId_key" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_currentPeriodEnd_idx" ON "subscriptions"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "subscription_history_subscriptionId_idx" ON "subscription_history"("subscriptionId");

-- CreateIndex
CREATE INDEX "subscription_history_eventType_idx" ON "subscription_history"("eventType");

-- CreateIndex
CREATE INDEX "subscription_history_changedAt_idx" ON "subscription_history"("changedAt");

-- CreateIndex
CREATE INDEX "subscription_history_toPlanId_idx" ON "subscription_history"("toPlanId");

-- CreateIndex
CREATE INDEX "curriculum_surveys_curriculumId_idx" ON "curriculum_surveys"("curriculumId");

-- CreateIndex
CREATE INDEX "curriculum_surveys_status_idx" ON "curriculum_surveys"("status");

-- CreateIndex
CREATE INDEX "curriculum_surveys_provider_idx" ON "curriculum_surveys"("provider");

-- CreateIndex
CREATE INDEX "curriculum_surveys_triggerCourseId_idx" ON "curriculum_surveys"("triggerCourseId");

-- CreateIndex
CREATE INDEX "rooms_trainingRecipientId_idx" ON "rooms"("trainingRecipientId");

-- CreateIndex
CREATE INDEX "rooms_status_idx" ON "rooms"("status");

-- CreateIndex
CREATE INDEX "rooms_type_idx" ON "rooms"("type");

-- CreateIndex
CREATE INDEX "rooms_roomType_idx" ON "rooms"("roomType");

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_slug_key" ON "system_roles"("slug");

-- CreateIndex
CREATE INDEX "system_roles_hierarchyLevel_idx" ON "system_roles"("hierarchyLevel");

-- CreateIndex
CREATE INDEX "user_role_assignments_userId_idx" ON "user_role_assignments"("userId");

-- CreateIndex
CREATE INDEX "user_role_assignments_roleId_idx" ON "user_role_assignments"("roleId");

-- CreateIndex
CREATE INDEX "user_role_assignments_organizationId_idx" ON "user_role_assignments"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignments_userId_organizationId_key" ON "user_role_assignments"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "permissions_category_idx" ON "permissions"("category");

-- CreateIndex
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "organization_role_overrides_organizationId_idx" ON "organization_role_overrides"("organizationId");

-- CreateIndex
CREATE INDEX "organization_role_overrides_roleId_idx" ON "organization_role_overrides"("roleId");

-- CreateIndex
CREATE INDEX "organization_role_overrides_permissionId_idx" ON "organization_role_overrides"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_role_overrides_organizationId_roleId_permissio_key" ON "organization_role_overrides"("organizationId", "roleId", "permissionId");

-- CreateIndex
CREATE INDEX "user_permission_overrides_userId_idx" ON "user_permission_overrides"("userId");

-- CreateIndex
CREATE INDEX "user_permission_overrides_organizationId_idx" ON "user_permission_overrides"("organizationId");

-- CreateIndex
CREATE INDEX "user_permission_overrides_permissionId_idx" ON "user_permission_overrides"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permission_overrides_userId_organizationId_permissionI_key" ON "user_permission_overrides"("userId", "organizationId", "permissionId");

-- CreateIndex
CREATE INDEX "course_versions_courseId_idx" ON "course_versions"("courseId");

-- CreateIndex
CREATE INDEX "course_versions_status_idx" ON "course_versions"("status");

-- CreateIndex
CREATE INDEX "course_versions_publishedAt_idx" ON "course_versions"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "course_versions_courseId_version_key" ON "course_versions"("courseId", "version");

-- CreateIndex
CREATE INDEX "module_versions_courseVersionId_idx" ON "module_versions"("courseVersionId");

-- CreateIndex
CREATE INDEX "module_versions_moduleId_idx" ON "module_versions"("moduleId");

-- CreateIndex
CREATE INDEX "module_versions_status_idx" ON "module_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "module_versions_moduleId_courseVersionId_key" ON "module_versions"("moduleId", "courseVersionId");

-- CreateIndex
CREATE INDEX "activity_versions_moduleVersionId_idx" ON "activity_versions"("moduleVersionId");

-- CreateIndex
CREATE INDEX "activity_versions_activityId_idx" ON "activity_versions"("activityId");

-- CreateIndex
CREATE INDEX "activity_versions_status_idx" ON "activity_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "activity_versions_activityId_moduleVersionId_key" ON "activity_versions"("activityId", "moduleVersionId");

-- CreateIndex
CREATE INDEX "version_changelogs_courseVersionId_idx" ON "version_changelogs"("courseVersionId");

-- CreateIndex
CREATE INDEX "version_changelogs_changeType_idx" ON "version_changelogs"("changeType");

-- CreateIndex
CREATE INDEX "version_changelogs_createdAt_idx" ON "version_changelogs"("createdAt");

-- CreateIndex
CREATE INDEX "course_audit_logs_courseId_idx" ON "course_audit_logs"("courseId");

-- CreateIndex
CREATE INDEX "course_audit_logs_entityType_idx" ON "course_audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "course_audit_logs_actionType_idx" ON "course_audit_logs"("actionType");

-- CreateIndex
CREATE INDEX "course_audit_logs_changedAt_idx" ON "course_audit_logs"("changedAt");

-- CreateIndex
CREATE INDEX "usage_logs_organizationId_createdAt_idx" ON "usage_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "usage_logs_provider_createdAt_idx" ON "usage_logs"("provider", "createdAt");

-- CreateIndex
CREATE INDEX "usage_logs_userId_createdAt_idx" ON "usage_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "usage_logs_createdAt_idx" ON "usage_logs"("createdAt");

-- CreateIndex
CREATE INDEX "usage_logs_provider_organizationId_idx" ON "usage_logs"("provider", "organizationId");

-- CreateIndex
CREATE INDEX "calendar_integrations_userId_idx" ON "calendar_integrations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_integrations_userId_provider_key" ON "calendar_integrations"("userId", "provider");

-- CreateIndex
CREATE INDEX "calendar_event_mappings_eventId_idx" ON "calendar_event_mappings"("eventId");

-- CreateIndex
CREATE INDEX "calendar_event_mappings_integrationId_idx" ON "calendar_event_mappings"("integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_event_mappings_eventId_integrationId_key" ON "calendar_event_mappings"("eventId", "integrationId");

-- CreateIndex
CREATE INDEX "email_logs_sub_organizationId_createdAt_idx" ON "email_logs"("sub_organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "email_logs_sub_organizationId_emailType_idx" ON "email_logs"("sub_organizationId", "emailType");

-- CreateIndex
CREATE INDEX "email_logs_recipientEmail_idx" ON "email_logs"("recipientEmail");

-- CreateIndex
CREATE INDEX "email_logs_projectId_idx" ON "email_logs"("projectId");

-- CreateIndex
CREATE INDEX "email_logs_resendEmailId_idx" ON "email_logs"("resendEmailId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_organizations" ADD CONSTRAINT "sub_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_organization_participant_role" ADD CONSTRAINT "sub_organization_participant_role_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_recipients" ADD CONSTRAINT "training_recipients_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_trainingRecipientId_fkey" FOREIGN KEY ("trainingRecipientId") REFERENCES "training_recipients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_lot_items" ADD CONSTRAINT "parking_lot_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_instructors" ADD CONSTRAINT "project_instructors_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_instructors" ADD CONSTRAINT "project_instructors_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_settings" ADD CONSTRAINT "project_settings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "sub_organization_participant_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_trainingRecipientId_fkey" FOREIGN KEY ("trainingRecipientId") REFERENCES "training_recipients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_curriculums" ADD CONSTRAINT "project_curriculums_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curriculums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_curriculums" ADD CONSTRAINT "project_curriculums_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_participants" ADD CONSTRAINT "project_participants_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_participants" ADD CONSTRAINT "project_participants_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_participants" ADD CONSTRAINT "project_participants_trainingRecipientId_fkey" FOREIGN KEY ("trainingRecipientId") REFERENCES "training_recipients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "project_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tags" ADD CONSTRAINT "course_tags_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tags" ADD CONSTRAINT "course_tags_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tags" ADD CONSTRAINT "course_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses_enrollee_progress" ADD CONSTRAINT "courses_enrollee_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses_enrollee_progress" ADD CONSTRAINT "courses_enrollee_progress_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses_enrollee_progress" ADD CONSTRAINT "courses_enrollee_progress_enrolleeId_fkey" FOREIGN KEY ("enrolleeId") REFERENCES "project_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculums" ADD CONSTRAINT "curriculums_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_courses" ADD CONSTRAINT "curriculum_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_courses" ADD CONSTRAINT "curriculum_courses_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curriculums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_supportActivityId_fkey" FOREIGN KEY ("supportActivityId") REFERENCES "supportActivities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_enrolleeId_fkey" FOREIGN KEY ("enrolleeId") REFERENCES "project_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_eventsId_fkey" FOREIGN KEY ("eventsId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_groups" ADD CONSTRAINT "event_groups_eventsId_fkey" FOREIGN KEY ("eventsId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_groups" ADD CONSTRAINT "event_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_focus" ADD CONSTRAINT "daily_focus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_training_notes" ADD CONSTRAINT "daily_training_notes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supportActivities" ADD CONSTRAINT "supportActivities_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curriculums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toolAccesses" ADD CONSTRAINT "toolAccesses_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toolAccesses" ADD CONSTRAINT "toolAccesses_organizationToolId_fkey" FOREIGN KEY ("organizationToolId") REFERENCES "organization_tools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_tools" ADD CONSTRAINT "organization_tools_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_instructors" ADD CONSTRAINT "event_instructors_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_instructors" ADD CONSTRAINT "event_instructors_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_checklist_items" ADD CONSTRAINT "course_checklist_items_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_checklist_items" ADD CONSTRAINT "course_checklist_items_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_curriculums" ADD CONSTRAINT "group_curriculums_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curriculums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_curriculums" ADD CONSTRAINT "group_curriculums_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_sub_organizationId_fkey" FOREIGN KEY ("sub_organizationId") REFERENCES "sub_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_topics" ADD CONSTRAINT "course_topics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_topics" ADD CONSTRAINT "course_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_participant_roles" ADD CONSTRAINT "course_participant_roles_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_participant_roles" ADD CONSTRAINT "course_participant_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "sub_organization_participant_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_participant_roles" ADD CONSTRAINT "module_participant_roles_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_participant_roles" ADD CONSTRAINT "module_participant_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "sub_organization_participant_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_course_checklist_progress" ADD CONSTRAINT "project_course_checklist_progress_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "course_checklist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_course_checklist_progress" ADD CONSTRAINT "project_course_checklist_progress_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_participants_course_checklist_progress" ADD CONSTRAINT "project_participants_course_checklist_progress_checklistIt_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "course_checklist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_participants_course_checklist_progress" ADD CONSTRAINT "project_participants_course_checklist_progress_participant_fkey" FOREIGN KEY ("participantId") REFERENCES "project_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_participants_course_checklist_progress" ADD CONSTRAINT "project_participants_course_checklist_progress_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_objectives" ADD CONSTRAINT "course_objectives_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_objectives" ADD CONSTRAINT "module_objectives_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curriculums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_days" ADD CONSTRAINT "training_plan_days_trainingPlanId_fkey" FOREIGN KEY ("trainingPlanId") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_modules" ADD CONSTRAINT "training_plan_modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_modules" ADD CONSTRAINT "training_plan_modules_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_modules" ADD CONSTRAINT "training_plan_modules_supportActivityId_fkey" FOREIGN KEY ("supportActivityId") REFERENCES "supportActivities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_modules" ADD CONSTRAINT "training_plan_modules_trainingPlanDayId_fkey" FOREIGN KEY ("trainingPlanDayId") REFERENCES "training_plan_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_topics" ADD CONSTRAINT "project_topics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_topics" ADD CONSTRAINT "project_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_activity_progress" ADD CONSTRAINT "event_activity_progress_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_activity_progress" ADD CONSTRAINT "event_activity_progress_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_module_progress" ADD CONSTRAINT "event_module_progress_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_module_progress" ADD CONSTRAINT "event_module_progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assessments" ADD CONSTRAINT "course_assessments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_assessment_config" ADD CONSTRAINT "curriculum_assessment_config_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curriculums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_assessment_config" ADD CONSTRAINT "curriculum_assessment_config_courseAssessmentId_fkey" FOREIGN KEY ("courseAssessmentId") REFERENCES "course_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assessment_config" ADD CONSTRAINT "project_assessment_config_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assessment_config" ADD CONSTRAINT "project_assessment_config_courseAssessmentId_fkey" FOREIGN KEY ("courseAssessmentId") REFERENCES "course_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_assessment_scores" ADD CONSTRAINT "participant_assessment_scores_courseAssessmentId_fkey" FOREIGN KEY ("courseAssessmentId") REFERENCES "course_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_assessment_scores" ADD CONSTRAINT "participant_assessment_scores_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "project_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_assessment_scores" ADD CONSTRAINT "participant_assessment_scores_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_checklist_items" ADD CONSTRAINT "curriculum_checklist_items_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curriculums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_curriculum_checklist_progress" ADD CONSTRAINT "project_curriculum_checklist_progress_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "curriculum_checklist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_curriculum_checklist_progress" ADD CONSTRAINT "project_curriculum_checklist_progress_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("planId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_surveys" ADD CONSTRAINT "curriculum_surveys_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curriculums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_surveys" ADD CONSTRAINT "curriculum_surveys_triggerCourseId_fkey" FOREIGN KEY ("triggerCourseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_trainingRecipientId_fkey" FOREIGN KEY ("trainingRecipientId") REFERENCES "training_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "system_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "system_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_role_overrides" ADD CONSTRAINT "organization_role_overrides_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_role_overrides" ADD CONSTRAINT "organization_role_overrides_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "system_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_role_overrides" ADD CONSTRAINT "organization_role_overrides_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_versions" ADD CONSTRAINT "module_versions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_versions" ADD CONSTRAINT "module_versions_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_versions" ADD CONSTRAINT "activity_versions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_versions" ADD CONSTRAINT "activity_versions_moduleVersionId_fkey" FOREIGN KEY ("moduleVersionId") REFERENCES "module_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "version_changelogs" ADD CONSTRAINT "version_changelogs_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_audit_logs" ADD CONSTRAINT "course_audit_logs_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event_mappings" ADD CONSTRAINT "calendar_event_mappings_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event_mappings" ADD CONSTRAINT "calendar_event_mappings_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "calendar_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

