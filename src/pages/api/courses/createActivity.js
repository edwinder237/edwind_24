import prisma from '../../../lib/prisma';
import { isVersionLocked } from '../../../lib/utils/versionProtection';
import { createAuditLog } from '../../../lib/utils/auditLog';
import { attachUserClaims } from '../../../lib/auth/middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get user info for audit logging
  await attachUserClaims(req, res);

  try {
    const {
      title,
      summary,
      content,
      contentUrl,
      duration,
      activityType = 'exercise',
      activityCategory = 'practice',
      activityStatus = 'draft',
      moduleId,
      ActivityOrder = 1,
      changedByName,
    } = req.body;

    if (!title || !moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Activity title and module ID are required',
      });
    }

    // Check if the course's current version is locked before creating
    const moduleWithCourse = await prisma.modules.findUnique({
      where: { id: parseInt(moduleId) },
      include: {
        course: {
          select: { currentVersionId: true, version: true }
        }
      }
    });

    if (moduleWithCourse?.course?.currentVersionId) {
      const locked = await isVersionLocked(prisma, moduleWithCourse.course.currentVersionId);
      if (locked) {
        return res.status(403).json({
          success: false,
          error: 'Version locked',
          message: `This course version (${moduleWithCourse.course.version}) has participants who have started. Create a new draft version to make changes.`,
          requiresNewVersion: true,
          courseId: moduleWithCourse.courseId
        });
      }
    }

    // Create the activity
    const activity = await prisma.activities.create({
      data: {
        title,
        summary: summary || null,
        content: content || null,
        contentUrl: contentUrl || '',
        duration: duration ? parseInt(duration) : null,
        activityType,
        activityCategory,
        activityStatus,
        moduleId: parseInt(moduleId),
        ActivityOrder: ActivityOrder ? parseInt(ActivityOrder) : 1,
        published: false,
        createdAt: new Date(),
        lastUpdated: new Date(),
      },
    });

    // Get course info (don't bump version on creation - only bump when content changes)
    const module = await prisma.modules.findUnique({
      where: { id: parseInt(moduleId) },
      select: { courseId: true },
    });
    let currentVersion = null;
    if (module) {
      const course = await prisma.courses.findUnique({
        where: { id: module.courseId },
        select: { version: true, authorName: true },
      });
      currentVersion = course?.version;

      // Log the audit entry (no version bump for creation)
      const userName = changedByName || req.userClaims?.name || course?.authorName || 'Author';
      await createAuditLog(prisma, {
        courseId: module.courseId,
        entityType: 'activity',
        entityId: activity.id,
        actionType: 'create',
        metadata: { title: activity.title },
        changedByName: userName,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      activity,
      courseId: module?.courseId || null,
      courseVersion: currentVersion,
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activity',
      error: error.message,
    });
  }
}
