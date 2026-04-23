/**
 * Prisma Soft Delete Middleware
 *
 * Intercepts delete operations on soft-delete-enabled models and converts
 * them to updates that set `deletedAt` + `isActive = false`. Also auto-filters
 * soft-deleted records from queries unless explicitly overridden.
 *
 * Models with soft delete: User, organizations, projects, participants,
 * courses, events, training_recipients, instructors.
 *
 * To query including deleted records, pass `where: { deletedAt: { not: null } }`
 * or `where: { deletedAt: undefined }` (explicitly omit the filter).
 */

// Models that support soft delete (must have deletedAt + deletedBy columns)
const SOFT_DELETE_MODELS = new Set([
  'User',
  'organizations',
  'projects',
  'participants',
  'courses',
  'events',
  'training_recipients',
  'instructors',
]);

// Subset of soft-delete models that also have an `isActive` column
const MODELS_WITH_IS_ACTIVE = new Set([
  'User',
  'courses',
]);

/**
 * Middleware that converts delete → soft delete for enabled models.
 *
 * - `delete`      → `update` setting deletedAt, isActive = false
 * - `deleteMany`  → `updateMany` setting deletedAt, isActive = false
 * - `findFirst`, `findMany`, `findUnique`, `count` → injects `deletedAt: null` filter
 *
 * The caller can opt out of the auto-filter by explicitly including `deletedAt`
 * in the `where` clause (e.g. `{ deletedAt: { not: null } }` to find deleted records).
 */
export function softDeleteMiddleware(params, next) {
  const model = params.model;

  if (!SOFT_DELETE_MODELS.has(model)) {
    return next(params);
  }

  // --- Convert deletes to soft deletes ---
  if (params.action === 'delete') {
    params.action = 'update';
    const data = { deletedAt: new Date() };
    if (MODELS_WITH_IS_ACTIVE.has(model)) data.isActive = false;
    params.args.data = data;
    return next(params);
  }

  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    if (!params.args) params.args = {};
    const data = { deletedAt: new Date() };
    if (MODELS_WITH_IS_ACTIVE.has(model)) data.isActive = false;
    params.args.data = data;
    return next(params);
  }

  // --- Auto-filter deleted records from reads ---

  // findUnique/findUniqueOrThrow only accept unique fields in `where`,
  // so we convert them to findFirst which supports arbitrary filters.
  if (params.action === 'findUnique' || params.action === 'findUniqueOrThrow') {
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};

    if (params.args.where.deletedAt === undefined) {
      const originalAction = params.action;
      params.action = originalAction === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
      params.args.where.deletedAt = null;
    }
    return next(params);
  }

  const readActions = ['findFirst', 'findMany', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy'];

  if (readActions.includes(params.action)) {
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};

    // Only inject if the caller hasn't explicitly referenced deletedAt
    if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
  }

  return next(params);
}
