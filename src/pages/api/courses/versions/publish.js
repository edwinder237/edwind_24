import prisma from '../../../../lib/prisma';

/**
 * POST /api/courses/versions/publish
 * Publishes a draft version, making it the current version
 *
 * Body: { versionId, changelog?, userId }
 * - versionId: Required - the draft version to publish
 * - changelog: Optional - description of changes in this version
 * - userId: Optional - the user publishing
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { versionId, changelog, userId } = req.body;

  if (!versionId) {
    return res.status(400).json({ error: 'versionId is required' });
  }

  try {
    // Get the version to publish
    const version = await prisma.course_versions.findUnique({
      where: { id: parseInt(versionId) },
      include: {
        course: {
          select: {
            id: true,
            currentVersionId: true,
            draftVersionId: true
          }
        }
      }
    });

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    if (version.status !== 'draft') {
      return res.status(400).json({
        error: 'Only draft versions can be published',
        currentStatus: version.status
      });
    }

    // Publish in a transaction
    const publishedVersion = await prisma.$transaction(async (tx) => {
      // Archive the previous published version (if any)
      if (version.course.currentVersionId) {
        await tx.course_versions.update({
          where: { id: version.course.currentVersionId },
          data: { status: 'archived' }
        });
      }

      // Mark this version as published
      const updated = await tx.course_versions.update({
        where: { id: parseInt(versionId) },
        data: {
          status: 'published',
          publishedAt: new Date(),
          publishedBy: userId || null
        }
      });

      // Update module and activity versions to published
      await tx.module_versions.updateMany({
        where: { courseVersionId: parseInt(versionId) },
        data: {
          status: 'published',
          publishedAt: new Date()
        }
      });

      // Get module version IDs to update activity versions
      const moduleVersions = await tx.module_versions.findMany({
        where: { courseVersionId: parseInt(versionId) },
        select: { id: true }
      });

      if (moduleVersions.length > 0) {
        await tx.activity_versions.updateMany({
          where: {
            moduleVersionId: { in: moduleVersions.map(mv => mv.id) }
          },
          data: {
            status: 'published',
            publishedAt: new Date()
          }
        });
      }

      // Update course to set currentVersionId and clear draftVersionId
      await tx.courses.update({
        where: { id: version.courseId },
        data: {
          currentVersionId: parseInt(versionId),
          draftVersionId: null,
          version: version.version // Sync the simple version string
        }
      });

      // Add changelog entry for publishing
      await tx.version_changelogs.create({
        data: {
          courseVersionId: parseInt(versionId),
          changeType: 'publish',
          changeCategory: 'version_published',
          description: changelog || `Version ${version.version} published`,
          entityType: 'course',
          entityId: version.courseId,
          createdBy: userId || null
        }
      });

      return updated;
    });

    // Fetch complete published version
    const completeVersion = await prisma.course_versions.findUnique({
      where: { id: publishedVersion.id },
      include: {
        moduleVersions: {
          include: {
            activityVersions: true
          }
        },
        _count: {
          select: {
            changelogs: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Version ${publishedVersion.version} published successfully`,
      version: completeVersion
    });

  } catch (error) {
    console.error('Error publishing version:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish version',
      details: error.message
    });
  }
}
