/**
 * Permission Service
 *
 * Loads and checks user permissions from the database.
 * Handles app roles (Level 2-4) and organization-specific overrides.
 *
 * Permission Resolution:
 * 1. Level 0-1 (Admin/Client Admin) - Full access via WorkOS role
 * 2. Level 2-4 (App Roles) - Permissions from database with org overrides
 */

import prisma from '../prisma.js';

// Admin roles from WorkOS (Level 0-1)
const ADMIN_ROLES = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];

/**
 * Get user's effective permissions for an organization
 *
 * @param {string} workosUserId - WorkOS user ID
 * @param {string} organizationId - Database organization ID
 * @param {string} workosRole - User's WorkOS role in this organization
 * @returns {Object} { permissions: string[], appRole: object|null, isAppAdmin: boolean, isClientAdmin: boolean }
 */
export async function getUserPermissions(workosUserId, organizationId, workosRole) {
  const normalizedWorkosRole = workosRole?.toLowerCase() || '';

  // Check if user is Level 0-1 (Admin tier)
  const isClientAdmin = ADMIN_ROLES.includes(normalizedWorkosRole);

  if (isClientAdmin) {
    // Admin/Client Admin gets full permissions
    return {
      permissions: ['*:*'], // Wildcard = all permissions
      appRole: null,
      isAppAdmin: normalizedWorkosRole === 'owner',
      isClientAdmin: true,
      hierarchyLevel: normalizedWorkosRole === 'owner' ? 0 : 1
    };
  }

  // Get user's database record
  const dbUser = await prisma.user.findUnique({
    where: { workos_user_id: workosUserId },
    select: { id: true }
  });

  if (!dbUser) {
    // User not in database, return default viewer permissions
    return {
      permissions: getDefaultPermissions(),
      appRole: null,
      isAppAdmin: false,
      isClientAdmin: false,
      hierarchyLevel: 4
    };
  }

  // Get user's app role assignment for this organization
  const roleAssignment = await prisma.user_role_assignments.findUnique({
    where: {
      userId_organizationId: {
        userId: dbUser.id,
        organizationId: organizationId
      }
    },
    include: {
      role: {
        include: {
          role_permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });

  if (!roleAssignment || !roleAssignment.role) {
    // No role assigned, return default viewer permissions
    return {
      permissions: getDefaultPermissions(),
      appRole: null,
      isAppAdmin: false,
      isClientAdmin: false,
      hierarchyLevel: 4
    };
  }

  // Get organization-specific overrides for this role
  const overrides = await prisma.organization_role_overrides.findMany({
    where: {
      organizationId: organizationId,
      roleId: roleAssignment.roleId
    },
    include: {
      permission: true
    }
  });

  // Build permission map from role's default permissions
  const permissionMap = new Map();

  for (const rp of roleAssignment.role.role_permissions) {
    permissionMap.set(rp.permission.key, true);
  }

  // Apply organization overrides
  for (const override of overrides) {
    if (override.isEnabled) {
      permissionMap.set(override.permission.key, true);
    } else {
      permissionMap.delete(override.permission.key);
    }
  }

  // Convert to array of permission keys
  const permissions = Array.from(permissionMap.keys());

  return {
    permissions,
    appRole: {
      id: roleAssignment.role.id,
      slug: roleAssignment.role.slug,
      name: roleAssignment.role.name,
      hierarchyLevel: roleAssignment.role.hierarchyLevel
    },
    isAppAdmin: false,
    isClientAdmin: false,
    hierarchyLevel: roleAssignment.role.hierarchyLevel
  };
}

/**
 * Get default permissions for users without a role assignment
 * @returns {string[]} Array of default permission keys
 */
function getDefaultPermissions() {
  return [
    'projects:read:assigned',
    'courses:read:published',
    'events:read:assigned'
  ];
}

/**
 * Check if user has a specific permission
 *
 * @param {string[]} userPermissions - User's permission array
 * @param {string} requiredPermission - Permission to check (e.g., 'projects:read')
 * @returns {boolean} True if user has permission
 */
export function hasPermission(userPermissions, requiredPermission) {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  // Check for wildcard (full access)
  if (userPermissions.includes('*:*')) {
    return true;
  }

  // Exact match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Parse permission parts
  const [resource, action, scope] = requiredPermission.split(':');

  // Check for resource wildcard (e.g., 'projects:*' grants 'projects:read')
  if (userPermissions.includes(`${resource}:*`)) {
    return true;
  }

  // Check for action without scope (e.g., 'projects:read' grants 'projects:read:own')
  if (scope && userPermissions.includes(`${resource}:${action}`)) {
    return true;
  }

  return false;
}

/**
 * Check if user can access all items of a resource type
 * Checks for both the base permission and legacy permission names
 *
 * @param {string[]} userPermissions - User's permission array
 * @param {string} resource - Resource type (e.g., 'projects')
 * @returns {boolean} True if user can view all
 */
export function canViewAll(userPermissions, resource) {
  // Check new permission format
  if (hasPermission(userPermissions, `${resource}:read`)) {
    return true;
  }

  // Check legacy permission names
  const legacyPermissions = {
    projects: 'accessallprojects',
    courses: 'accessallcourses',
    participants: 'accessallparticipants',
    events: 'accessallevents'
  };

  if (legacyPermissions[resource] && userPermissions.includes(legacyPermissions[resource])) {
    return true;
  }

  return false;
}

/**
 * Check if user can only access assigned/own items
 *
 * @param {string[]} userPermissions - User's permission array
 * @param {string} resource - Resource type
 * @returns {boolean} True if limited to assigned items only
 */
export function canViewAssignedOnly(userPermissions, resource) {
  // If can view all, not limited to assigned
  if (canViewAll(userPermissions, resource)) {
    return false;
  }

  // Check for assigned scope
  return hasPermission(userPermissions, `${resource}:read:assigned`) ||
         hasPermission(userPermissions, `${resource}:read:own`) ||
         hasPermission(userPermissions, `${resource}:read:enrolled`);
}

export default {
  getUserPermissions,
  hasPermission,
  canViewAll,
  canViewAssignedOnly
};
