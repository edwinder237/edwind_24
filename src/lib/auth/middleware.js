/**
 * Permission Middleware for API Routes
 *
 * Fast, claims-based authorization middleware for Next.js API routes.
 * Uses cached claims for 1-2ms permission checks.
 */

import { WorkOS } from '@workos-inc/node';
import { getClaimsFromRequest } from './claimsManager';
import { findOrganizationClaim, hasSubOrgAccess } from './claims';
import { hasPermission } from './policyMap';

// Initialize WorkOS
let workos;
const getWorkOS = () => {
  if (!workos) {
    workos = new WorkOS(process.env.WORKOS_API_KEY);
  }
  return workos;
};

/**
 * Gets user claims from request and attaches to req object
 * Call this first in your API routes that need authorization
 *
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @returns {Promise<Object|null>} User claims or null
 */
export async function attachUserClaims(req, res) {
  try {
    const claims = await getClaimsFromRequest(req, getWorkOS());

    if (!claims) {
      return null;
    }

    // Attach claims to request for downstream use
    req.userClaims = claims;
    req.userId = claims.userId;
    req.workosUserId = claims.workos_user_id;

    return claims;
  } catch (error) {
    console.error('Error attaching user claims:', error);
    return null;
  }
}

/**
 * Requires user to be authenticated
 * Returns 401 if not authenticated
 *
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @returns {Promise<boolean>} True if authenticated
 */
export async function requireAuth(req, res) {
  const claims = await attachUserClaims(req, res);

  if (!claims) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    });
    return false;
  }

  return true;
}

/**
 * Requires user to have a specific permission
 * Returns 403 if permission denied
 *
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @param {string} permission - Required permission (e.g., "projects:create")
 * @param {string} orgId - Optional: specific organization ID to check
 * @returns {Promise<boolean>} True if permission granted
 */
export async function requirePermission(req, res, permission, orgId = null) {
  // First ensure user is authenticated
  const isAuthenticated = await requireAuth(req, res);
  if (!isAuthenticated) {
    return false;
  }

  const claims = req.userClaims;

  // If specific org requested, check that org only
  if (orgId) {
    const orgClaim = findOrganizationClaim(claims, orgId);

    if (!orgClaim) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this organization'
      });
      return false;
    }

    if (orgClaim.status !== 'active') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Your membership in this organization is not active'
      });
      return false;
    }

    if (!hasPermission(orgClaim.permissions, permission)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `You do not have permission: ${permission}`
      });
      return false;
    }

    // Attach current org to request
    req.currentOrg = orgClaim;
    return true;
  }

  // Check across all organizations
  const hasAnyPermission = claims.organizations.some(org =>
    org.status === 'active' && hasPermission(org.permissions, permission)
  );

  if (!hasAnyPermission) {
    res.status(403).json({
      error: 'Forbidden',
      message: `You do not have permission: ${permission} in any organization`
    });
    return false;
  }

  return true;
}

/**
 * Requires user to have access to a specific sub_organization
 * Returns 403 if access denied
 *
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @param {number} subOrgId - Sub-organization ID to check
 * @returns {Promise<boolean>} True if access granted
 */
export async function requireSubOrgAccess(req, res, subOrgId) {
  // First ensure user is authenticated
  const isAuthenticated = await requireAuth(req, res);
  if (!isAuthenticated) {
    return false;
  }

  const claims = req.userClaims;

  if (!hasSubOrgAccess(claims, subOrgId)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have access to this sub-organization'
    });
    return false;
  }

  // Attach sub_org ID to request
  req.currentSubOrgId = subOrgId;
  return true;
}

/**
 * Requires user to have a specific role
 * Returns 403 if role not met
 *
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @param {string|string[]} roles - Required role(s) (e.g., "Admin" or ["Admin", "Organization Admin"])
 * @param {string} orgId - Optional: specific organization ID to check
 * @returns {Promise<boolean>} True if role requirement met
 */
export async function requireRole(req, res, roles, orgId = null) {
  // First ensure user is authenticated
  const isAuthenticated = await requireAuth(req, res);
  if (!isAuthenticated) {
    return false;
  }

  const claims = req.userClaims;
  const requiredRoles = Array.isArray(roles) ? roles : [roles];

  // If specific org requested, check that org only
  if (orgId) {
    const orgClaim = findOrganizationClaim(claims, orgId);

    if (!orgClaim) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this organization'
      });
      return false;
    }

    if (!requiredRoles.includes(orgClaim.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Requires one of the following roles: ${requiredRoles.join(', ')}`
      });
      return false;
    }

    return true;
  }

  // Check across all organizations
  const hasAnyRole = claims.organizations.some(org =>
    org.status === 'active' && requiredRoles.includes(org.role)
  );

  if (!hasAnyRole) {
    res.status(403).json({
      error: 'Forbidden',
      message: `Requires one of the following roles: ${requiredRoles.join(', ')}`
    });
    return false;
  }

  return true;
}

/**
 * Helper to wrap API handlers with permission checks
 * Usage:
 * export default withPermission('projects:read')(async (req, res) => { ... })
 *
 * @param {string} permission - Required permission
 * @param {string} orgId - Optional organization ID
 * @returns {Function} Wrapped handler
 */
export function withPermission(permission, orgId = null) {
  return (handler) => async (req, res) => {
    const hasPermission = await requirePermission(req, res, permission, orgId);
    if (!hasPermission) {
      return; // Response already sent by requirePermission
    }
    return handler(req, res);
  };
}

/**
 * Helper to wrap API handlers with role checks
 * Usage:
 * export default withRole('Admin')(async (req, res) => { ... })
 *
 * @param {string|string[]} roles - Required role(s)
 * @param {string} orgId - Optional organization ID
 * @returns {Function} Wrapped handler
 */
export function withRole(roles, orgId = null) {
  return (handler) => async (req, res) => {
    const hasRole = await requireRole(req, res, roles, orgId);
    if (!hasRole) {
      return; // Response already sent by requireRole
    }
    return handler(req, res);
  };
}

/**
 * Helper to wrap API handlers with authentication check
 * Usage:
 * export default withAuth(async (req, res) => { ... })
 *
 * @returns {Function} Wrapped handler
 */
export function withAuth(handler) {
  return async (req, res) => {
    const isAuthenticated = await requireAuth(req, res);
    if (!isAuthenticated) {
      return; // Response already sent by requireAuth
    }
    return handler(req, res);
  };
}

/**
 * Gets accessible sub_organization IDs for the current user
 * Useful for scoping database queries
 *
 * @param {Object} req - Next.js request object (must have userClaims attached)
 * @returns {number[]} Array of accessible sub_organization IDs
 */
export function getAccessibleSubOrgs(req) {
  if (!req.userClaims) {
    return [];
  }

  const subOrgIds = new Set();
  req.userClaims.organizations.forEach(org => {
    if (org.status === 'active' && org.sub_organizations) {
      org.sub_organizations.forEach(id => subOrgIds.add(id));
    }
  });

  return Array.from(subOrgIds);
}

/**
 * Checks if user is an admin (any type)
 *
 * @param {Object} req - Next.js request object (must have userClaims attached)
 * @returns {boolean} True if user has admin role
 */
export function isAdmin(req) {
  if (!req.userClaims) {
    return false;
  }

  return req.userClaims.organizations.some(org =>
    org.status === 'active' && (org.role === 'Admin' || org.role === 'Organization Admin')
  );
}

/**
 * Export all middleware functions
 */
export default {
  attachUserClaims,
  requireAuth,
  requirePermission,
  requireSubOrgAccess,
  requireRole,
  withPermission,
  withRole,
  withAuth,
  getAccessibleSubOrgs,
  isAdmin
};
