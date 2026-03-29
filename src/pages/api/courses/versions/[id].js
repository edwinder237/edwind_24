import prisma from '../../../../lib/prisma';
import { createHandler } from '../../../../lib/api/createHandler';

/**
 * GET /api/courses/versions/[id]
 * Get a specific version with full content
 */
export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Version ID is required' });
    }

    const version = await prisma.course_versions.findUnique({
      where: { id: parseInt(id) },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            currentVersionId: true,
            draftVersionId: true
          }
        },
        moduleVersions: {
          orderBy: { moduleOrder: 'asc' },
          include: {
            module: {
              select: { id: true, title: true }
            },
            activityVersions: {
              orderBy: { ActivityOrder: 'asc' },
              include: {
                activity: {
                  select: { id: true, title: true }
                }
              }
            }
          }
        },
        changelogs: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        _count: {
          select: {
            enrollee_progress: true,
            events: true
          }
        }
      }
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        error: 'Version not found'
      });
    }

    // Calculate if version is locked (has participant progress)
    const isLocked = version._count.enrollee_progress > 0;
    const isCurrent = version.course.currentVersionId === version.id;
    const isDraft = version.course.draftVersionId === version.id;

    res.status(200).json({
      success: true,
      version: {
        ...version,
        isLocked,
        isCurrent,
        isDraft,
        participantCount: version._count.enrollee_progress,
        eventCount: version._count.events
      }
    });
  }
});
