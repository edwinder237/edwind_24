/**
 * Development Prisma Proxy
 *
 * Wraps Prisma client in development to detect and warn about
 * potentially unscoped queries that could leak cross-org data.
 *
 * Warnings are logged when:
 * - findMany/findFirst called without sub_organizationId filter
 * - updateMany/deleteMany called without sub_organizationId filter
 *
 * This is a DEVELOPMENT-ONLY safety tool to help catch bugs.
 * It does NOT prevent queries, only warns about potential issues.
 *
 * Usage:
 * import prisma from '@/lib/prisma/devProxy'; // Instead of '@/lib/prisma'
 */

import { PrismaClient } from '@prisma/client';

const isDevelopment = process.env.NODE_ENV === 'development';

// Models that should have sub_organizationId filtering
const MODELS_WITH_SUB_ORG = [
  'projects',
  'project_participants',
  'participants',
  'events',
  'courses',
  'curriculums',
  'training_plans',
  'project_checklist_items',
  'project_notes',
  'daily_training_notes',
  'score_cards',
  'assessment_results',
  'course_activities',
  'course_modules',
  'curriculum_courses',
  'participant_groups',
  'group_participants'
];

/**
 * Check if a where clause includes sub_organizationId filter
 * @param {Object} where - Prisma where clause
 * @returns {boolean} True if sub_organizationId is filtered
 */
function hasSubOrgFilter(where) {
  if (!where) {
    return false;
  }

  // Direct filter
  if (where.sub_organizationId) {
    return true;
  }

  // Check in AND conditions
  if (Array.isArray(where.AND)) {
    return where.AND.some(condition => hasSubOrgFilter(condition));
  }

  // Check in OR conditions (might be intentional, so we allow it)
  if (Array.isArray(where.OR)) {
    return where.OR.some(condition => hasSubOrgFilter(condition));
  }

  return false;
}

/**
 * Get stack trace excluding Prisma and proxy internals
 * @returns {string} Filtered stack trace
 */
function getRelevantStackTrace() {
  const stack = new Error().stack || '';
  const lines = stack.split('\n');

  // Filter out proxy, Prisma, and Node internals
  const relevantLines = lines
    .filter(line => {
      return (
        !line.includes('devProxy.js') &&
        !line.includes('node_modules/@prisma') &&
        !line.includes('node_modules/prisma') &&
        !line.includes('internal/') &&
        !line.includes('node:') &&
        line.trim().startsWith('at ')
      );
    })
    .slice(0, 3); // First 3 relevant stack frames

  return relevantLines.join('\n');
}

/**
 * Log warning about potentially unscoped query
 * @param {string} model - Model name
 * @param {string} operation - Operation name
 * @param {Object} where - Where clause
 */
function logUnscopedQueryWarning(model, operation, where) {
  const stack = getRelevantStackTrace();

  console.warn('');
  console.warn('⚠️  POTENTIALLY UNSCOPED QUERY DETECTED');
  console.warn('━'.repeat(60));
  console.warn(`Model:      ${model}`);
  console.warn(`Operation:  ${operation}`);
  console.warn(`Where:      ${JSON.stringify(where || {}, null, 2)}`);
  console.warn('');
  console.warn('This query might leak cross-organization data.');
  console.warn('Consider using scopedQueries helpers or add sub_organizationId filter.');
  console.warn('');
  console.warn('Call stack:');
  console.warn(stack);
  console.warn('━'.repeat(60));
  console.warn('');
}

/**
 * Create Prisma proxy that warns about unscoped queries
 * @param {PrismaClient} prismaClient - Original Prisma client
 * @returns {Proxy} Proxied Prisma client
 */
function createDevProxy(prismaClient) {
  if (!isDevelopment) {
    // In production, return client as-is
    return prismaClient;
  }

  return new Proxy(prismaClient, {
    get(target, modelName) {
      const model = target[modelName];

      // Only proxy models that should have sub_organizationId
      if (typeof modelName === 'string' && MODELS_WITH_SUB_ORG.includes(modelName)) {
        return new Proxy(model, {
          get(modelTarget, operation) {
            const originalMethod = modelTarget[operation];

            // Only proxy query operations
            if (
              typeof operation === 'string' &&
              typeof originalMethod === 'function' &&
              (operation === 'findMany' ||
               operation === 'findFirst' ||
               operation === 'updateMany' ||
               operation === 'deleteMany')
            ) {
              return function (...args) {
                const [options] = args;
                const where = options?.where;

                // Check if query has sub_organizationId filter
                if (!hasSubOrgFilter(where)) {
                  logUnscopedQueryWarning(modelName, operation, where);
                }

                // Call original method
                return originalMethod.apply(modelTarget, args);
              };
            }

            return originalMethod;
          }
        });
      }

      return model;
    }
  });
}

// Create and export proxied Prisma client
let prisma;

if (isDevelopment) {
  console.log('🔍 Development mode: Prisma proxy enabled (will warn about unscoped queries)');
  const basePrisma = new PrismaClient({
    log: ['warn', 'error']
  });
  prisma = createDevProxy(basePrisma);
} else {
  // Production: use standard client
  prisma = new PrismaClient();
}

export default prisma;

/**
 * Export proxy creation function for testing
 */
export { createDevProxy, hasSubOrgFilter, MODELS_WITH_SUB_ORG };
