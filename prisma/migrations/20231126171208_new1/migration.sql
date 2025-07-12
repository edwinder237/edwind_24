/*
  Warnings:

  - You are about to drop the column `usersId` on the `accounts` table. All the data in the column will be lost.
  - The primary key for the `sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `accessToken` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `sessionToken` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `sessions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[session_token]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `session_token` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `accounts_usersId_idx` ON `accounts`;

-- DropIndex
DROP INDEX `sessions_accessToken_key` ON `sessions`;

-- DropIndex
DROP INDEX `sessions_sessionToken_key` ON `sessions`;

-- DropIndex
DROP INDEX `sessions_userId_idx` ON `sessions`;

-- AlterTable
ALTER TABLE `accounts` DROP COLUMN `usersId`;

-- AlterTable
ALTER TABLE `sessions` DROP PRIMARY KEY,
    DROP COLUMN `accessToken`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `sessionToken`,
    DROP COLUMN `updatedAt`,
    DROP COLUMN `userId`,
    ADD COLUMN `session_token` VARCHAR(191) NOT NULL,
    ADD COLUMN `user_id` VARCHAR(191) NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `users` MODIFY `username` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL,
    MODIFY `name` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `accounts_user_id_idx` ON `accounts`(`user_id`);

-- CreateIndex
CREATE INDEX `events_courseId_idx` ON `events`(`courseId`);

-- CreateIndex
CREATE INDEX `group_participants_participantId_idx` ON `group_participants`(`participantId`);

-- CreateIndex
CREATE INDEX `projects_sub_organizationId_idx` ON `projects`(`sub_organizationId`);

-- CreateIndex
CREATE UNIQUE INDEX `sessions_session_token_key` ON `sessions`(`session_token`);

-- CreateIndex
CREATE INDEX `sessions_user_id_idx` ON `sessions`(`user_id`);
