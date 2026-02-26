import prisma from '../../../lib/prisma';
import { bumpVersion } from '../../../lib/utils/versionUtils';
import { isVersionLocked } from '../../../lib/utils/versionProtection';
import { createAuditLog } from '../../../lib/utils/auditLog';
import { attachUserClaims } from '../../../lib/auth/middleware';

export default async function handler(req, res) {
  // Get user info for audit logging
  await attachUserClaims(req, res);

  const { moduleId, changedByName } = req.body;

  try {
    // Get the module info before deletion
    const moduleToDelete = await prisma.modules.findUnique({
      where: { id: parseInt(moduleId) },
    });

    if (!moduleToDelete) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Save courseId before deletion for version bump
    const courseId = moduleToDelete.courseId;

    // Check if the course's current version is locked
    const courseForVersionCheck = await prisma.courses.findUnique({
      where: { id: courseId },
      select: { currentVersionId: true, version: true }
    });

    if (courseForVersionCheck?.currentVersionId) {
      const locked = await isVersionLocked(prisma, courseForVersionCheck.currentVersionId);
      if (locked) {
        return res.status(403).json({
          success: false,
          error: 'Version locked',
          message: `This course version (${courseForVersionCheck.version}) has participants who have started. Create a new draft version to make changes.`,
          requiresNewVersion: true,
          courseId: courseId
        });
      }
    }

    // Use a transaction to ensure all deletions succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete module role assignments first
      await tx.module_participant_roles.deleteMany({
        where: { moduleId: parseInt(moduleId) },
      });

      // Delete activities
      await tx.activities.deleteMany({
        where: { moduleId: parseInt(moduleId) },
      });

      // Delete course checklist items related to this module
      await tx.course_checklist_items.deleteMany({
        where: { moduleId: parseInt(moduleId) },
      });

      // Finally delete the module itself
      await tx.modules.delete({
        where: { id: parseInt(moduleId) },
      });
    });

    // Bump course version (minor bump for module changes)
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: { version: true, authorName: true },
    });
    const previousVersion = course?.version;
    const newVersion = bumpVersion(previousVersion, 'minor');
    await prisma.courses.update({
      where: { id: courseId },
      data: { version: newVersion },
    });

    // Log the audit entry
    const userName = changedByName || req.userClaims?.name || course?.authorName || 'Author';
    await createAuditLog(prisma, {
      courseId,
      entityType: 'module',
      entityId: parseInt(moduleId),
      actionType: 'delete',
      previousVersion,
      newVersion,
      versionBumpType: 'minor',
      metadata: { deletedTitle: moduleToDelete.title },
      changedByName: userName,
    });

    res.status(200).json({
      success: true,
      message: 'Module and all related data deleted successfully',
      courseId: courseId,
      courseVersion: newVersion,
    });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Failed to delete module' });
  }
}
