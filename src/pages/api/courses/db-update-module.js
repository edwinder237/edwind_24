import prisma from '../../../lib/prisma';
import { bumpVersion } from '../../../lib/utils/versionUtils';
import { isVersionLocked } from '../../../lib/utils/versionProtection';
import { createAuditLog, calculateFieldChanges, TRACKED_FIELDS } from '../../../lib/utils/auditLog';
import { attachUserClaims } from '../../../lib/auth/middleware';

export default async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get user info for audit logging
  await attachUserClaims(req, res);

  const { editedModule, moduleId, changedByName } = req.body;

  if (!moduleId || !editedModule) {
    return res.status(400).json({ error: 'Missing required fields: moduleId and editedModule' });
  }

  // Ensure moduleId is an integer
  const parsedModuleId = parseInt(moduleId);
  if (isNaN(parsedModuleId)) {
    return res.status(400).json({ error: 'Invalid moduleId: must be a number' });
  }

  // Remove fields that shouldn't be updated directly or don't exist in the schema
  const updateData = { ...editedModule };
  delete updateData.activities;
  delete updateData.id;
  delete updateData.numActivities;
  delete updateData.version;
  delete updateData.importance;
  delete updateData.rating;
  delete updateData.learningObjectives;
  delete updateData.isEditing;

  try {
    // First check if the module exists
    const existingModule = await prisma.modules.findUnique({
      where: { id: parsedModuleId },
    });

    if (!existingModule) {
      return res.status(404).json({
        success: false,
        error: 'Module not found',
        moduleId: parsedModuleId,
      });
    }

    // Check if the course's current version is locked
    const course = await prisma.courses.findUnique({
      where: { id: existingModule.courseId },
      select: { currentVersionId: true, version: true, authorName: true }
    });

    if (course?.currentVersionId) {
      const locked = await isVersionLocked(prisma, course.currentVersionId);
      if (locked) {
        return res.status(403).json({
          success: false,
          error: 'Version locked',
          message: `This course version (${course.version}) has participants who have started. Create a new draft version to make changes.`,
          requiresNewVersion: true,
          courseId: existingModule.courseId
        });
      }
    }

    const updatedModule = await prisma.modules.update({
      where: { id: parsedModuleId },
      data: updateData,
    });

    // Calculate field changes for audit log
    const fieldChanges = calculateFieldChanges(existingModule, updatedModule, TRACKED_FIELDS.module);

    // Only bump version for content changes, not title-only changes (renames)
    // Check if any content-related fields changed (not just title)
    const contentFields = ['summary', 'content', 'JSONContent', 'customDuration', 'moduleStatus', 'backgroundImg', 'moduleOrder'];
    const hasContentChanges = contentFields.some(field => updateData[field] !== undefined);

    let newVersion = null;
    let previousVersion = course?.version;
    if (hasContentChanges) {
      // Bump course version (minor bump for module content changes)
      const latestCourse = await prisma.courses.findUnique({
        where: { id: existingModule.courseId },
        select: { version: true },
      });
      previousVersion = latestCourse?.version;
      newVersion = bumpVersion(previousVersion, 'minor');
      await prisma.courses.update({
        where: { id: existingModule.courseId },
        data: { version: newVersion },
      });
    }

    // Log the audit entry (always log, even for title-only changes)
    const userName = changedByName || req.userClaims?.name || course?.authorName || 'Author';
    await createAuditLog(prisma, {
      courseId: existingModule.courseId,
      entityType: 'module',
      entityId: parsedModuleId,
      actionType: 'update',
      fieldChanges,
      previousVersion,
      newVersion: newVersion || previousVersion,
      versionBumpType: hasContentChanges ? 'minor' : null,
      metadata: { title: updatedModule.title },
      changedByName: userName,
    });

    res.status(200).json({
      success: true,
      message: 'Module updated and saved to database',
      module: updatedModule,
      courseVersion: newVersion,
    });
  } catch (error) {
    console.error('Error updating module:', error);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
    res.status(500).json({
      success: false,
      error: 'Failed to update module',
      details: error.message,
      code: error.code,
      meta: error.meta,
    });
  }
}
