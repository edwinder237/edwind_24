/**
 * createHandler — Default-Secure API Route Factory
 *
 * Single entry point for creating API routes. Organization scoping
 * is ON by default so developers cannot accidentally ship unprotected routes.
 *
 * Usage:
 *   import { createHandler } from '../../../lib/api/createHandler';
 *
 *   export default createHandler({
 *     POST: async (req, res) => {
 *       const projects = await req.db.projects.findMany({});
 *       res.status(200).json({ projects });
 *     }
 *   });
 *
 * Scopes:
 *   'org'    (default) — full org scoping via withOrgScope, req.db available
 *   'admin'  — admin-only via withAdminScope, req.db available
 *   'auth'   — authenticated user, org optional via withOptionalOrgScope
 *   'public' — no auth required via withPublicScope
 */

import {
  withOrgScope,
  withAdminScope,
  withAdminScopeSkipSubCheck,
  withOptionalOrgScope,
  withPublicScope,
} from '../middleware/withOrgScope.js';
import { asyncHandler } from '../errors/index.js';
import { createScopedDb } from './scopedDb.js';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * @param {Object} options
 * @param {Function} [options.GET]    - GET handler
 * @param {Function} [options.POST]   - POST handler
 * @param {Function} [options.PUT]    - PUT handler
 * @param {Function} [options.DELETE] - DELETE handler
 * @param {Function} [options.PATCH]  - PATCH handler
 * @param {'org'|'admin'|'auth'|'public'} [options.scope='org'] - Security scope
 * @param {boolean} [options.skipSubscriptionCheck=false] - Skip subscription status validation
 * @returns {Function} Next.js API route handler
 */
export function createHandler(options) {
  const {
    scope = 'org',
    skipSubscriptionCheck = false,
  } = options;

  // Extract method handlers
  const methodHandlers = {};
  for (const method of HTTP_METHODS) {
    if (options[method]) {
      methodHandlers[method] = options[method];
    }
  }

  if (Object.keys(methodHandlers).length === 0) {
    throw new Error('createHandler: at least one HTTP method handler (GET, POST, PUT, DELETE, PATCH) is required');
  }

  // Core handler: method routing + req.db attachment
  async function coreHandler(req, res) {
    // 1. Method validation
    const handler = methodHandlers[req.method];
    if (!handler) {
      res.setHeader('Allow', Object.keys(methodHandlers).join(', '));
      return res.status(405).json({
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
        allowed: Object.keys(methodHandlers),
      });
    }

    // 2. Attach scoped DB if org context exists
    if (req.orgContext) {
      req.db = createScopedDb(req.orgContext);
    }

    // 3. Run the handler
    return await handler(req, res);
  }

  // Wrap with asyncHandler for centralized error catching
  let wrapped = asyncHandler(coreHandler);

  // Apply security scope (outermost layer)
  switch (scope) {
    case 'org':
      wrapped = withOrgScope(wrapped, { skipSubscriptionCheck });
      break;
    case 'admin':
      if (skipSubscriptionCheck) {
        wrapped = withAdminScopeSkipSubCheck(wrapped);
      } else {
        wrapped = withAdminScope(wrapped);
      }
      break;
    case 'auth':
      wrapped = withOptionalOrgScope(wrapped);
      break;
    case 'public':
      wrapped = withPublicScope(wrapped);
      break;
    default:
      throw new Error(`createHandler: unknown scope "${scope}"`);
  }

  return wrapped;
}
