/**
 * Audit Logging Utilities
 *
 * Functions to log changes to courses, modules, and activities.
 */

/**
 * Create an audit log entry
 *
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {object} params - Audit log parameters
 * @param {number} params.courseId - Course ID
 * @param {string} params.entityType - "course", "module", or "activity"
 * @param {number} params.entityId - ID of the entity
 * @param {string} params.actionType - "create", "update", "delete", or "publish"
 * @param {object} [params.fieldChanges] - Object of field changes { fieldName: { old, new } }
 * @param {string} [params.previousVersion] - Version before change
 * @param {string} [params.newVersion] - Version after change
 * @param {string} [params.versionBumpType] - "major", "minor", or "patch"
 * @param {object} [params.metadata] - Additional metadata { title, deletedTitle, etc. }
 * @param {string} [params.changedBy] - User ID who made the change
 * @param {string} [params.changedByName] - User display name
 */
export async function createAuditLog(prisma, params) {
  const {
    courseId,
    entityType,
    entityId,
    actionType,
    fieldChanges,
    previousVersion,
    newVersion,
    versionBumpType,
    metadata,
    changedBy,
    changedByName,
  } = params;

  try {
    await prisma.course_audit_logs.create({
      data: {
        courseId,
        entityType,
        entityId,
        actionType,
        fieldChanges: fieldChanges || null,
        previousVersion: previousVersion || null,
        newVersion: newVersion || null,
        versionBumpType: versionBumpType || null,
        metadata: metadata || null,
        changedBy: changedBy || null,
        changedByName: changedByName || 'Author',
      },
    });
  } catch (error) {
    // Log but don't fail the main operation
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Calculate field changes between two objects
 *
 * @param {object} oldData - Original data
 * @param {object} newData - Updated data
 * @param {string[]} fieldsToTrack - List of field names to compare
 * @returns {object|null} - Object of changes or null if no changes
 */
export function calculateFieldChanges(oldData, newData, fieldsToTrack) {
  const changes = {};

  for (const field of fieldsToTrack) {
    const oldValue = oldData?.[field];
    const newValue = newData?.[field];

    // Skip if both are undefined/null
    if (oldValue === undefined && newValue === undefined) continue;
    if (oldValue === null && newValue === null) continue;

    // Check if values are different
    const oldStr = JSON.stringify(oldValue);
    const newStr = JSON.stringify(newValue);

    if (oldStr !== newStr) {
      changes[field] = {
        from: oldValue,
        to: newValue,
      };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * Track fields for different entity types
 */
export const TRACKED_FIELDS = {
  course: [
    'title',
    'summary',
    'duration',
    'level',
    'courseStatus',
    'published',
    'deliveryMethod',
    'targetAudience',
    'certification',
    'JSONSyllabus',
    'authorName',
  ],
  module: [
    'title',
    'summary',
    'content',
    'JSONContent',
    'customDuration',
    'moduleStatus',
    'moduleOrder',
    'backgroundImg',
  ],
  activity: [
    'title',
    'summary',
    'content',
    'contentUrl',
    'activityType',
    'activityCategory',
    'activityStatus',
    'duration',
    'ActivityOrder',
    'published',
  ],
};
