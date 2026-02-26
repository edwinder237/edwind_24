import prisma from '../../../lib/prisma';
import { bumpVersion } from '../../../lib/utils/versionUtils';
import { isVersionLocked } from '../../../lib/utils/versionProtection';
import { createAuditLog, calculateFieldChanges, TRACKED_FIELDS } from '../../../lib/utils/auditLog';
import { attachUserClaims } from '../../../lib/auth/middleware';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get user info for audit logging
  await attachUserClaims(req, res);

  try {
    const { id, title, summary, activityType, duration, content, contentUrl, changedByName } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Activity ID is required' });
    }

    // Check if activity exists
    const existingActivity = await prisma.activities.findUnique({
      where: { id: parseInt(id) },
      include: {
        module: {
          select: {
            courseId: true,
            course: {
              select: { currentVersionId: true, version: true }
            }
          }
        }
      }
    });

    if (!existingActivity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Check if the course's current version is locked
    if (existingActivity.module?.course?.currentVersionId) {
      const locked = await isVersionLocked(prisma, existingActivity.module.course.currentVersionId);
      if (locked) {
        return res.status(403).json({
          success: false,
          error: 'Version locked',
          message: `This course version (${existingActivity.module.course.version}) has participants who have started. Create a new draft version to make changes.`,
          requiresNewVersion: true,
          courseId: existingActivity.module.courseId
        });
      }
    }

    // Build update data object, only including provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;
    if (activityType !== undefined) updateData.activityType = activityType;
    if (duration !== undefined) updateData.duration = parseInt(duration) || 0;
    if (content !== undefined) updateData.content = content;
    if (contentUrl !== undefined) updateData.contentUrl = contentUrl;

    // Update the activity in the database
    const updatedActivity = await prisma.activities.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Calculate field changes for audit log
    const fieldChanges = calculateFieldChanges(existingActivity, updatedActivity, TRACKED_FIELDS.activity);

    // Bump course version (patch bump for activity changes)
    let newVersion = null;
    let previousVersion = null;
    const module = await prisma.modules.findUnique({
      where: { id: existingActivity.moduleId },
      select: { courseId: true },
    });
    if (module) {
      const course = await prisma.courses.findUnique({
        where: { id: module.courseId },
        select: { version: true, authorName: true },
      });
      previousVersion = course?.version;
      newVersion = bumpVersion(previousVersion, 'patch');
      await prisma.courses.update({
        where: { id: module.courseId },
        data: { version: newVersion },
      });

      // Log the audit entry
      const userName = changedByName || req.userClaims?.name || course?.authorName || 'Author';
      await createAuditLog(prisma, {
        courseId: module.courseId,
        entityType: 'activity',
        entityId: parseInt(id),
        actionType: 'update',
        fieldChanges,
        previousVersion,
        newVersion,
        versionBumpType: 'patch',
        metadata: { title: updatedActivity.title },
        changedByName: userName,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      activity: updatedActivity,
      courseId: module?.courseId || null,
      courseVersion: newVersion,
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity',
      error: error.message,
    });
  }
}
