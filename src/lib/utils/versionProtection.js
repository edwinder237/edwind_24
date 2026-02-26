/**
 * Version Protection Utilities
 *
 * Functions to check if a version can be edited.
 * A version is "locked" when participants have started the course.
 *
 * IMPORTANT: These functions should be called inline in API routes
 * using the shared prisma import from '../lib/prisma'.
 */

/**
 * Check if a course version is locked (has participant progress)
 * Call this with prisma instance from the API route.
 *
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} courseVersionId - The version ID to check
 * @returns {Promise<boolean>} True if version is locked
 */
export async function isVersionLocked(prisma, courseVersionId) {
  // First get the courseId for this version to check legacy records
  const version = await prisma.course_versions.findUnique({
    where: { id: courseVersionId },
    select: { courseId: true }
  });

  if (!version) return false;

  // Check if any participant has progress on this specific version
  const hasVersionProgress = await prisma.courses_enrollee_progress.count({
    where: { courseVersionId: courseVersionId }
  }) > 0;

  if (hasVersionProgress) return true;

  // Check for legacy progress records (created before versioning, have courseId but null courseVersionId)
  const hasLegacyProgress = await prisma.courses_enrollee_progress.count({
    where: {
      courseId: version.courseId,
      courseVersionId: null
    }
  }) > 0;

  if (hasLegacyProgress) return true;

  // Check if any event module progress exists for events using this version
  const hasEventProgress = await prisma.event_module_progress.count({
    where: {
      event: { courseVersionId: courseVersionId }
    }
  }) > 0;

  if (hasEventProgress) return true;

  // Check for legacy event progress (events with this courseId but no courseVersionId)
  const hasLegacyEventProgress = await prisma.event_module_progress.count({
    where: {
      event: {
        courseId: version.courseId,
        courseVersionId: null
      }
    }
  }) > 0;

  return hasLegacyEventProgress;
}

/**
 * Check if a version can be edited
 * Returns detailed information about editability.
 *
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} versionId - The version ID to check
 * @returns {Promise<object>} { editable, reason?, participantCount? }
 */
export async function checkVersionEditable(prisma, versionId) {
  const version = await prisma.course_versions.findUnique({
    where: { id: versionId },
    select: {
      id: true,
      status: true,
      version: true,
      courseId: true
    }
  });

  if (!version) {
    return {
      editable: false,
      reason: 'Version not found'
    };
  }

  // Draft versions are always editable
  if (version.status === 'draft') {
    return { editable: true, status: 'draft' };
  }

  // Published versions - check if locked by participant progress
  const locked = await isVersionLocked(prisma, versionId);

  if (locked) {
    // Get participant count for the error message (including legacy records)
    const versionProgressCount = await prisma.courses_enrollee_progress.count({
      where: { courseVersionId: versionId }
    });
    const legacyProgressCount = await prisma.courses_enrollee_progress.count({
      where: {
        courseId: version.courseId,
        courseVersionId: null
      }
    });
    const participantCount = versionProgressCount + legacyProgressCount;

    return {
      editable: false,
      status: 'locked',
      reason: `Version ${version.version} has ${participantCount} participant(s) who have started the course. Create a new version to make changes.`,
      participantCount
    };
  }

  // Published but no progress yet - still editable
  return {
    editable: true,
    status: 'published_unlocked',
    warning: 'This version is published but can still be edited since no participants have started.'
  };
}

/**
 * Get the draft version ID for a course, creating one if needed
 *
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} courseId - The course ID
 * @returns {Promise<number|null>} Draft version ID or null if course not found
 */
export async function getOrCreateDraftVersionId(prisma, courseId) {
  const course = await prisma.courses.findUnique({
    where: { id: courseId },
    select: {
      draftVersionId: true,
      currentVersionId: true
    }
  });

  if (!course) return null;

  // If there's already a draft, return it
  if (course.draftVersionId) {
    return course.draftVersionId;
  }

  // If there's no draft but there's a current version, check if it's editable
  if (course.currentVersionId) {
    const editCheck = await checkVersionEditable(prisma, course.currentVersionId);
    if (editCheck.editable) {
      return course.currentVersionId;
    }
    // Current version is locked - caller needs to create a new draft
    return null;
  }

  // No versions at all - this is a new course without versioning
  return null;
}
