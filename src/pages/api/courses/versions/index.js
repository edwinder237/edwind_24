import prisma from '../../../../lib/prisma';

/**
 * GET /api/courses/versions?courseId=123
 * Lists all versions for a course
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { courseId } = req.query;

  if (!courseId) {
    return res.status(400).json({ error: 'courseId is required' });
  }

  try {
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
  } catch (error) {
    console.error('Error fetching course versions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch versions',
      details: error.message
    });
  }
}
