/**
 * Scoped Database Interface (req.db)
 *
 * Wraps the shared Prisma singleton with organization-scoped queries.
 * Models that have `sub_organizationId` are automatically filtered.
 * Models without it pass through to the raw Prisma client.
 *
 * Usage (inside a createHandler route):
 *   const projects = await req.db.projects.findMany({ orderBy: { createdAt: 'desc' } });
 *   const raw = await req.db.$raw.someModel.findMany();  // escape hatch
 */

import prisma from '../prisma.js';
import {
  scopedFindMany,
  scopedFindUnique,
  scopedFindFirst,
  scopedCount,
  scopedCreate,
  scopedUpdate,
  scopedUpdateMany,
  scopedDelete,
  scopedDeleteMany,
  scopedAggregate,
  scopedGroupBy,
} from '../prisma/scopedQueries.js';

/**
 * Models that have `sub_organizationId` and MUST be scoped.
 * Matches the Prisma client accessor name (model name as used in prisma.xxx).
 */
const SCOPED_MODELS = new Set([
  'user',
  'projects',
  'courses',
  'curriculums',
  'instructors',
  'training_recipients',
  'course_tags',
  'organization_tools',
  'topics',
  'sub_organization_participant_role',
  'email_logs',
]);

/**
 * Build a scoped model interface that delegates to scopedQueries.
 * The API mirrors Prisma's client methods so devs use the same patterns.
 */
function createScopedModel(orgContext, modelName) {
  return {
    findMany:   (options = {}) => scopedFindMany(orgContext, modelName, options),
    findUnique: (options = {}) => scopedFindUnique(orgContext, modelName, options),
    findFirst:  (options = {}) => scopedFindFirst(orgContext, modelName, options),
    count:      (options = {}) => scopedCount(orgContext, modelName, options),

    create: (options) => {
      // scopedCreate expects (orgContext, model, data) — unwrap Prisma-style { data }
      const data = options.data || options;
      return scopedCreate(orgContext, modelName, data);
    },

    update:     (options) => scopedUpdate(orgContext, modelName, options),
    updateMany: (options) => scopedUpdateMany(orgContext, modelName, options.where, options.data),
    delete:     (options) => scopedDelete(orgContext, modelName, options.where),
    deleteMany: (options) => scopedDeleteMany(orgContext, modelName, options.where),
    aggregate:  (options) => scopedAggregate(orgContext, modelName, options),
    groupBy:    (options) => scopedGroupBy(orgContext, modelName, options),
  };
}

/**
 * Create the scoped database interface attached to req.db.
 *
 * - Scoped models: all operations auto-filter by sub_organizationId
 * - Unscoped models: pass-through to the raw Prisma client
 * - $raw: escape hatch for cross-org queries (flagged in code review / CI)
 * - $transaction: raw Prisma transaction support
 * - $orgContext: access to the org context for custom logic
 *
 * @param {Object} orgContext - req.orgContext from withOrgScope
 * @returns {Object} Scoped database interface
 */
export function createScopedDb(orgContext) {
  // Use a Proxy so any prisma model name resolves automatically:
  //  - If it's a scoped model → return scoped wrapper
  //  - If it's a special key ($raw, $transaction, $orgContext) → return escape hatch
  //  - Otherwise → pass through to raw prisma client
  return new Proxy({}, {
    get(_, prop) {
      // Escape hatches
      if (prop === '$raw') return prisma;
      if (prop === '$transaction') return prisma.$transaction.bind(prisma);
      if (prop === '$orgContext') return orgContext;

      // Scoped models
      if (SCOPED_MODELS.has(prop)) {
        return createScopedModel(orgContext, prop);
      }

      // Unscoped models — pass through to raw Prisma
      if (prisma[prop]) {
        return prisma[prop];
      }

      return undefined;
    }
  });
}
