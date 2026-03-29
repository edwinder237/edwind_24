import prisma from '../../../../lib/prisma';
import { createHandler } from '../../../../lib/api/createHandler';

/**
 * GET /api/courses/versions?courseId=123
 * Lists all versions for a course
 */
export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }

    const versions = await prisma.course_versions.findMany({
      where: { courseId: parseInt(courseId) },
      orderBy: { createdAt: 'desc' },
      include: {
        moduleVersions: {
          include: {
            activityVersions: true
          }
        },
        _count: {
          select: {
            changelogs: true,
            enrollee_progress: true
          }
        }
      }
    });

    // Add computed fields
    const versionsWithMeta = versions.map(version => ({
      ...version,
      isLocked: version._count.enrollee_progress > 0,
      participantCount: version._count.enrollee_progress,
      changelogCount: version._count.changelogs,
      moduleCount: version.moduleVersions.length,
      activityCount: version.moduleVersions.reduce(
        (sum, m) => sum + m.activityVersions.length, 0
      )
    }));

    res.status(200).json({
      success: true,
      versions: versionsWithMeta
    });
  }
});
