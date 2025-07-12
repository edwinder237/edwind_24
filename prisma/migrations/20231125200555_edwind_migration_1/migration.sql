-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `email_verified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `midName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `info` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `sub_organizationId` INTEGER NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_sub_organizationId_idx`(`sub_organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `accessToken` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    UNIQUE INDEX `sessions_sessionToken_key`(`sessionToken`),
    UNIQUE INDEX `sessions_accessToken_key`(`accessToken`),
    INDEX `sessions_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `provider_account_id` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,
    `usersId` VARCHAR(191) NULL,

    INDEX `accounts_usersId_idx`(`usersId`),
    UNIQUE INDEX `accounts_provider_provider_account_id_key`(`provider`, `provider_account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verificationtokens` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `verificationtokens_token_key`(`token`),
    UNIQUE INDEX `verificationtokens_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organizations` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedby` VARCHAR(191) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `info` JSON NULL,
    `logo_url` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `type` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `published` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_organizations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedby` VARCHAR(191) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `sub_organizations_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sub_organizationId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUpdated` DATETIME(3) NOT NULL,
    `updatedby` VARCHAR(191) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `title` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NULL,
    `duration` INTEGER NULL,
    `tags` JSON NULL,
    `projectType` VARCHAR(191) NULL,
    `projectCategory` VARCHAR(191) NULL,
    `projectStatus` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `ownerId` INTEGER NULL,
    `backgroundImg` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,

    INDEX `projects_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participants` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `middleName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `participantStatus` VARCHAR(191) NULL,
    `participantType` VARCHAR(191) NULL,
    `sub_organization` INTEGER NOT NULL,
    `derpartement` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `profilePrefs` JSON NOT NULL,
    `profileImg` DATETIME(3) NULL,
    `credentials` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUpdated` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedby` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_participants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `participantId` VARCHAR(191) NOT NULL,

    INDEX `project_participants_projectId_idx`(`projectId`),
    UNIQUE INDEX `project_participants_participantId_key`(`participantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupName` VARCHAR(191) NOT NULL,
    `projectId` INTEGER NOT NULL,
    `chipColor` VARCHAR(191) NOT NULL,

    INDEX `groups_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_participants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupId` INTEGER NOT NULL,
    `participantId` INTEGER NOT NULL,

    INDEX `group_participants_groupId_idx`(`groupId`),
    UNIQUE INDEX `group_participants_groupId_participantId_key`(`groupId`, `participantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userSubParentId` INTEGER NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,
    `lastUpdated` DATETIME(3) NULL,
    `published` BOOLEAN NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NULL,
    `language` VARCHAR(191) NULL,
    `deliveryMethod` VARCHAR(191) NULL,
    `goLiveDate` DATETIME(3) NULL,
    `maxParticipants` INTEGER NULL,
    `deadline` DATETIME(3) NULL,
    `duration` INTEGER NULL,
    `cost` DOUBLE NULL,
    `level` VARCHAR(191) NULL,
    `accessRestrictions` VARCHAR(191) NULL,
    `certification` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NULL,
    `CourseType` VARCHAR(191) NULL,
    `courseCategory` VARCHAR(191) NULL,
    `courseStatus` VARCHAR(191) NULL,
    `targetAudience` VARCHAR(191) NULL,
    `backgroundImg` VARCHAR(191) NULL,
    `resources` VARCHAR(191) NULL,
    `syllabusId` INTEGER NULL,
    `JSONSyllabus` JSON NULL,
    `rating` DOUBLE NULL,
    `code` VARCHAR(191) NULL,
    `version` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUpdated` DATETIME(3) NOT NULL,
    `published` BOOLEAN NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NULL,
    `content` VARCHAR(191) NULL,
    `JSONContent` JSON NULL,
    `duration` INTEGER NULL,
    `moduleStatus` VARCHAR(191) NULL,
    `backgroundImg` VARCHAR(191) NULL,
    `courseId` INTEGER NOT NULL,
    `moduleOrder` INTEGER NULL,

    INDEX `modules_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUpdated` DATETIME(3) NOT NULL,
    `published` BOOLEAN NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NULL,
    `content` VARCHAR(191) NULL,
    `duration` INTEGER NULL,
    `activityType` VARCHAR(191) NULL,
    `activityCategory` VARCHAR(191) NULL,
    `activityStatus` VARCHAR(191) NULL,
    `backgroundImg` VARCHAR(191) NULL,
    `moduleId` INTEGER NOT NULL,
    `ActivityOrder` INTEGER NULL,

    INDEX `activities_moduleId_idx`(`moduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `eventType` VARCHAR(191) NULL,
    `projectId` INTEGER NOT NULL,
    `courseId` INTEGER NULL,
    `start` DATETIME(3) NOT NULL,
    `end` DATETIME(3) NOT NULL,
    `allDay` BOOLEAN NOT NULL,
    `color` VARCHAR(191) NULL,
    `textColor` VARCHAR(191) NULL,
    `backgroundColor` VARCHAR(191) NULL,
    `borderColor` VARCHAR(191) NULL,
    `editable` BOOLEAN NULL,
    `eventStatus` VARCHAR(191) NULL,
    `extendedProps` JSON NULL,

    INDEX `events_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_attendees` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventsId` INTEGER NOT NULL,
    `attendance_status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `project_paticipantId` INTEGER NOT NULL,

    INDEX `event_attendees_eventsId_idx`(`eventsId`),
    UNIQUE INDEX `event_attendees_project_paticipantId_key`(`project_paticipantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventsId` INTEGER NOT NULL,
    `groupId` INTEGER NOT NULL,

    INDEX `event_groups_eventsId_idx`(`eventsId`),
    UNIQUE INDEX `event_groups_groupId_key`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
