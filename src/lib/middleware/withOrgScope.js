/**
 * Organization Scope Middleware
 *
 * Wraps API routes to enforce organization-level access control.
 * Validates user authentication, organization membership, and attaches
 * organization context to the request.
 *
 * Attaches to request:
 * req.orgContext = {
 *   organizationId: 'uuid',           // DB organization.id
 *   workosOrgId: 'org_xyz',           // WorkOS org ID
 *   title: 'ACME Corp',               // Organization name
 *   subOrganizationIds: [1, 2, 3],    // Accessible sub-org IDs
 *   role: 'Admin',                    // Original WorkOS role
 *   normalizedRole: 'admin',          // Normalized role (admin|user)
 *   isAdmin: true,                    // Convenience boolean
 *   permissions: ['projects:*', ...], // User permissions
 *   userId: 'user_xyz',               // WorkOS user ID
 *   claims: {...}                     // Full user claims
 * }
 *
 * Usage:
 * export default withOrgScope(async (req, res) => {
 *   const { organizationId, subOrganizationIds } = req.orgContext;
 *   // Your route logic with guaranteed org context
 * });
 *
 * Options:
 * - requireOrg: true (default) - Throw error if no org selected
 * - requireAdmin: false - Require admin role
 */

import { WorkOS } from '@workos-inc/node';
import { getCachedClaims } from '../auth/claimsCache.js';
import { getCurrentOrganization, getOrganizationContext } from '../session/organizationSession.js';
import { normalizeRole, isAdmin } from '../auth/roleNormalization.js';
import { getUserPermissions } from '../auth/permissionService.js';
import prisma from '../prisma.js';
import {
  NoOrganizationError,
  OrganizationAccessDeniedError,
  AdminRequiredError,
  UnauthorizedError,
  AccountInactiveError,
  errorHandler
} from '../errors/index.js';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

/**
 * Organization scope middleware options
 * @typedef {Object} OrgScopeOptions
 * @property {boolean} requireOrg - Require organization to be selected (default: true)
 * @property {boolean} requireAdmin - Require admin role (default: false)
 * @property {boolean} allowPublic - Allow access without authentication (default: false)
 */

/**
 * Middleware to enforce organization scoping on API routes
 *
 * @param {Function} handler - API route handler
 * @param {OrgScopeOptions} options - Middleware options
 * @returns {Function} Wrapped handler with org context
 */
export function withOrgScope(handler, options = {}) {
  const {
    requireOrg = true,
    requireAdmin = false,
    allowPublic = false
  } = options;

  return async (req, res) => {
    try {
      // ============================================
      // 1. Authentication Check
      // ============================================
      const workosUserId = req.cookies?.workos_user_id;

      if (!allowPublic && !workosUserId) {
        throw new UnauthorizedError('Authentication required');
      }

      if (allowPublic && !workosUserId) {
        // Public route, no org context needed
        return await handler(req, res);
      }

      // ============================================
      // 1.5 Check if User is Active
      // ============================================
      const dbUser = await prisma.user.findUnique({
        where: { workos_user_id: workosUserId },
        select: { isActive: true }
      });

      if (dbUser && dbUser.isActive === false) {
        // Clear auth cookies
        res.setHeader('Set-Cookie', [
          'workos_user_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
          'workos_access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
          'workos_session_id=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
        ]);
        throw new AccountInactiveError('Your account has been deactivated');
      }

      // ============================================
      // 2. Get User Claims (Two-Tier Cache)
      // ============================================
      const claims = await getCachedClaims(req, workos);

      if (!claims) {
        throw new UnauthorizedError('Invalid or expired session');
      }

      if (!claims.organizations || claims.organizations.length === 0) {
        throw new OrganizationAccessDeniedError('No organization membership found');
      }

      // ============================================
      // 3. Get Current Organization from Cookie
      // ============================================
      const currentOrgId = await getCurrentOrganization(req);

      if (requireOrg && !currentOrgId) {
        throw new NoOrganizationError('No organization selected');
      }

      if (!currentOrgId) {
        // Optional org, proceed without context
        req.orgContext = null;
        return await handler(req, res);
      }

      // ============================================
      // 4. Validate Organization Membership
      // ============================================
      const orgContext = await getOrganizationContext(currentOrgId);

      if (!orgContext) {
        throw new NoOrganizationError('Selected organization not found');
      }

      // Check user has access to this organization
      const userOrg = claims.organizations.find(
        org => org.workos_org_id === orgContext.workosOrgId
      );

      if (!userOrg) {
        throw new OrganizationAccessDeniedError('You do not have access to this organization');
      }

      // ============================================
      // 5. Build Organization Context
      // ============================================
      const normalizedUserRole = normalizeRole(userOrg.role);
      const isUserAdmin = isAdmin(userOrg.role);

      // ============================================
      // 5.1 Load Permissions from Database
      // ============================================
      // Get app role permissions (Level 2-4) with organization overrides
      const permissionData = await getUserPermissions(
        claims.workos_user_id,
        orgContext.organizationId,
        userOrg.role
      );

      // Merge WorkOS JWT permissions with database permissions
      const jwtPermissions = claims.permissions || [];
      const dbPermissions = permissionData.permissions || [];
      const allPermissions = [...new Set([...jwtPermissions, ...dbPermissions])];

      req.orgContext = {
        // Organization IDs
        organizationId: orgContext.organizationId,
        workosOrgId: orgContext.workosOrgId,
        title: orgContext.title,
        subOrganizationIds: orgContext.subOrganizationIds || [],

        // User role (WorkOS)
        role: userOrg.role, // Original WorkOS role
        normalizedRole: normalizedUserRole, // 'admin' or 'user'
        isAdmin: isUserAdmin,

        // App role (Database - Level 2-4)
        appRole: permissionData.appRole,
        hierarchyLevel: permissionData.hierarchyLevel,
        isAppAdmin: permissionData.isAppAdmin,
        isClientAdmin: permissionData.isClientAdmin,

        // Permissions (merged WorkOS + Database)
        permissions: allPermissions,

        // User info
        userId: claims.workos_user_id,
        email: claims.email,

        // Full claims (for advanced use)
        claims
      };

      // ============================================
      // 6. Admin Role Check (if required)
      // ============================================
      if (requireAdmin && !isUserAdmin) {
        throw new AdminRequiredError('Administrator privileges required for this action');
      }

      // ============================================
      // 7. Call Handler with Context
      // ============================================
      return await handler(req, res);

    } catch (error) {
      // Handle errors consistently
      return errorHandler(error, req, res);
    }
  };
}

/**
 * Shortcut for routes that require admin role
 * @param {Function} handler - API route handler
 * @returns {Function} Wrapped handler requiring admin
 */
export function withAdminScope(handler) {
  return withOrgScope(handler, { requireAdmin: true });
}

/**
 * Shortcut for routes where org is optional
 * @param {Function} handler - API route handler
 * @returns {Function} Wrapped handler with optional org
 */
export function withOptionalOrgScope(handler) {
  return withOrgScope(handler, { requireOrg: false });
}

/**
 * Shortcut for public routes (no auth required)
 * @param {Function} handler - API route handler
 * @returns {Function} Wrapped handler allowing public access
 */
export function withPublicScope(handler) {
  return withOrgScope(handler, { allowPublic: true, requireOrg: false });
}

/**
 * Export middleware functions
 */
export default {
  withOrgScope,
  withAdminScope,
  withOptionalOrgScope,
  withPublicScope
};
