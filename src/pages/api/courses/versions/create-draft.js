import prisma from '../../../../lib/prisma';
import { bumpVersion } from '../../../../lib/utils/versionUtils';

/**
 * POST /api/courses/versions/create-draft
 * Creates a new draft version by cloning from a published version
 *
 * Body: { courseId, fromVersionId?, userId }
 * - courseId: Required - the course to create a draft for
 * - fromVersionId: Optional - specific version to clone from (defaults to latest published)
 * - userId: Optional - the user creating the draft
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { courseId, fromVersionId, userId } = req.body;

  if (!courseId) {
    return res.status(400).json({ error: 'courseId is required' });
  }

  try {
    // Check if course already has a draft
    const course = await prisma.courses.findUnique({
      where: { id: parseInt(courseId) },
      select: {
        id: true,
        title: true,
        draftVersionId: true,
        currentVersionId: true
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.draftVersionId) {
      return res.status(400).json({
        error: 'Course already has a draft version',
        draftVersionId: course.draftVersionId
      });
    }

    // Get source version to clone from
    let sourceVersion = null;
    if (fromVersionId) {
      sourceVersion = await prisma.course_versions.findUnique({
        where: { id: parseInt(fromVersionId) },
        include: {
          moduleVersions: {
            include: {
              activityVersions: true
            }
          }
        }
      });
    } else if (course.currentVersionId) {
      // Clone from current published version
      sourceVersion = await prisma.course_versions.findUnique({
        where: { id: course.currentVersionId },
        include: {
          moduleVersions: {
            include: {
              activityVersions: true
            }
          }
        }
      });
    }

    // Calculate next version number
    let nextVersion;
    if (sourceVersion) {
      nextVersion = bumpVersion(sourceVersion.version, 'minor');
    } else {
      // First version for this course
      nextVersion = '1.0.0';
    }

    // Create the draft in a transaction
    const newDraft = await prisma.$transaction(async (tx) => {
      // Create course version
      const courseVersion = await tx.course_versions.create({
        data: {
          courseId: parseInt(courseId),
          version: nextVersion,
          status: 'draft',
          title: sourceVersion?.title || course.title,
          summary: sourceVersion?.summary || null,
          duration: sourceVersion?.duration || null,
          JSONSyllabus: sourceVersion?.JSONSyllabus || null,
          snapshotData: sourceVersion?.snapshotData || null,
          createdBy: userId || null
        }
      });

      // Clone module versions if source exists
      if (sourceVersion?.moduleVersions) {
        for (const mv of sourceVersion.moduleVersions) {
          const moduleVersion = await tx.module_versions.create({
            data: {
              moduleId: mv.moduleId,
              courseVersionId: courseVersion.id,
              version: mv.version,
              status: 'draft',
              title: mv.title,
              summary: mv.summary,
              content: mv.content,
              JSONContent: mv.JSONContent,
              duration: mv.duration,
              customDuration: mv.customDuration,
              moduleOrder: mv.moduleOrder,
              snapshotData: mv.snapshotData
            }
          });

          // Clone activity versions
          for (const av of mv.activityVersions) {
            await tx.activity_versions.create({
              data: {
                activityId: av.activityId,
                moduleVersionId: moduleVersion.id,
                version: av.version,
                status: 'draft',
                title: av.title,
                summary: av.summary,
                content: av.content,
                contentUrl: av.contentUrl,
                activityType: av.activityType,
                duration: av.duration,
                ActivityOrder: av.ActivityOrder,
                snapshotData: av.snapshotData
              }
            });
          }
        }
      }

      // Update course to point to draft
      await tx.courses.update({
        where: { id: parseInt(courseId) },
        data: { draftVersionId: courseVersion.id }
      });

      // Add changelog entry
      await tx.version_changelogs.create({
        data: {
          courseVersionId: courseVersion.id,
          changeType: 'minor',
          changeCategory: 'version_created',
          description: sourceVersion
            ? `Draft ${nextVersion} created from ${sourceVersion.version}`
            : `Initial draft ${nextVersion} created`,
          entityType: 'course',
          entityId: parseInt(courseId),
          createdBy: userId || null
        }
      });

      return courseVersion;
    });

    // Fetch the complete draft with relations
    const completeDraft = await prisma.course_versions.findUnique({
      where: { id: newDraft.id },
      include: {
        moduleVersions: {
          include: {
            activityVersions: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: `Draft version ${nextVersion} created successfully`,
      version: completeDraft,
      clonedFrom: sourceVersion?.version || null
    });

  } catch (error) {
    console.error('Error creating draft version:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create draft version',
      details: error.message
    });
  }
}
