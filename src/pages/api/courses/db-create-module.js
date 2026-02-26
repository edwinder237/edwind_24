import prisma from '../../../lib/prisma';
import { isVersionLocked } from '../../../lib/utils/versionProtection';
import { createAuditLog } from '../../../lib/utils/auditLog';
import { attachUserClaims } from '../../../lib/auth/middleware';

export default async function handler(req, res) {
  // Get user info for audit logging
  await attachUserClaims(req, res);

  const { module, changedByName } = req.body;

  try {
    // Check if the course's current version is locked before creating
    const courseForVersionCheck = await prisma.courses.findUnique({
      where: { id: parseInt(module.courseId) },
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
          courseId: parseInt(module.courseId)
        });
      }
    }

    // Create a clean module object for database insertion
    const moduleData = {
      title: module.title,
      summary: module.summary || 'Sample Summary',
      content: module.content || 'Sample Content',
      JSONContent: module.JSONContent || {},
      customDuration: module.duration || null,
      published: module.published !== undefined ? module.published : true,
      moduleStatus: module.moduleStatus || 'active',
      backgroundImg: module.backgroundImg || null,
      courseId: parseInt(module.courseId),
      moduleOrder: module.moduleOrder || 1,
    };

    const newModule = await prisma.modules.create({
      data: moduleData,
    });

    // Get current course version and author (don't bump on creation - only bump when content changes)
    const course = await prisma.courses.findUnique({
      where: { id: parseInt(module.courseId) },
      select: { version: true, authorName: true },
    });
    const currentVersion = course?.version;

    // Log the audit entry (no version bump for creation)
    const userName = changedByName || req.userClaims?.name || course?.authorName || 'Author';
    await createAuditLog(prisma, {
      courseId: parseInt(module.courseId),
      entityType: 'module',
      entityId: newModule.id,
      actionType: 'create',
      metadata: { title: newModule.title },
      changedByName: userName,
    });

    res.status(200).json({
      success: true,
      message: 'Module created and saved to database',
      module: newModule,
      courseVersion: currentVersion,
    });
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error.message,
    });
  }
}
