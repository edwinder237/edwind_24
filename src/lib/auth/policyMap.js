/**
 * Policy Mapping for WorkOS Roles → Application Permissions
 *
 * This file maps WorkOS organization roles to granular application permissions.
 * Permissions use the format: "resource:action" (e.g., "projects:create")
 * Wildcard "*" grants all actions for a resource (e.g., "projects:*")
 */

/**
 * Role-based permission mappings
 * These roles should match what you configure in WorkOS
 */
export const ROLE_PERMISSIONS = {
  /**
   * Admin - Full system access
   * Can manage everything across all sub_organizations
   * Note: "admin" (lowercase) is also supported for WorkOS compatibility
   */
  'Admin': [
    'projects:*',
    'sub_organizations:*',
    'users:*',
    'courses:*',
    'curriculums:*',
    'participants:*',
    'instructors:*',
    'reports:*',
    'settings:*',
    'assessments:*',
    'events:*'
  ],

  /**
   * admin (lowercase) - Same as Admin for WorkOS compatibility
   */
  'admin': [
    'projects:*',
    'sub_organizations:*',
    'users:*',
    'courses:*',
    'curriculums:*',
    'participants:*',
    'instructors:*',
    'reports:*',
    'settings:*',
    'assessments:*',
    'events:*'
  ],

  /**
   * Organization Admin - Organization-wide management
   * Can manage all sub_organizations within their organization
   */
  'Organization Admin': [
    'projects:read',
    'projects:create',
    'projects:update',
    'projects:delete',
    'sub_organizations:read',
    'sub_organizations:manage',
    'users:read',
    'users:invite',
    'users:update',
    'courses:*',
    'curriculums:*',
    'participants:*',
    'instructors:*',
    'reports:read',
    'reports:export',
    'settings:read',
    'settings:update',
    'assessments:*',
    'events:*'
  ],

  /**
   * Project Manager - Project-level management
   * Can create and manage projects, participants, and schedules
   */
  'Project Manager': [
    'projects:read',
    'projects:create',
    'projects:update',
    'participants:read',
    'participants:create',
    'participants:update',
    'participants:manage',
    'instructors:read',
    'instructors:assign',
    'courses:read',
    'curriculums:read',
    'reports:read',
    'events:create',
    'events:read',
    'events:update',
    'events:delete',
    'assessments:read',
    'assessments:view_results'
  ],

  /**
   * Instructor - Course facilitation and grading
   * Can manage course content, activities, and assess participants
   */
  'Instructor': [
    'courses:read',
    'courses:update',
    'curriculums:read',
    'participants:read',
    'projects:read',
    'events:read',
    'events:update',
    'assessments:read',
    'assessments:grade',
    'assessments:view_results',
    'activities:read',
    'activities:update',
    'modules:read',
    'modules:update'
  ],

  /**
   * instructor (lowercase) - Same as Instructor for WorkOS compatibility
   */
  'instructor': [
    'courses:read',
    'courses:update',
    'curriculums:read',
    'participants:read',
    'projects:read',
    'events:read',
    'events:update',
    'assessments:read',
    'assessments:grade',
    'assessments:view_results',
    'activities:read',
    'activities:update',
    'modules:read',
    'modules:update'
  ],

  /**
   * Participant - Learner access only
   * Can view their own courses, submit assignments, view own data
   */
  'Participant': [
    'courses:read',
    'own_data:read',
    'own_data:update',
    'own_assessments:read',
    'own_assessments:submit',
    'own_projects:read',
    'own_events:read'
  ],

  /**
   * Viewer - Read-only access
   * Can view but not modify anything
   */
  'Viewer': [
    'projects:read',
    'courses:read',
    'participants:read',
    'reports:read'
  ],

  /**
   * Member - Default role for organization members
   * Basic read access, typically upgraded to a more specific role
   */
  'Member': [
    'projects:read',
    'courses:read',
    'own_data:read'
  ]
};

/**
 * Role hierarchy for permission inheritance and comparison
 * Lower number = higher privilege
 */
export const ROLE_HIERARCHY = {
  'Admin': 0,
  'admin': 0, // WorkOS compatibility
  'Organization Admin': 1,
  'Project Manager': 2,
  'Instructor': 3,
  'instructor': 3, // WorkOS compatibility
  'Participant': 4,
  'Viewer': 5,
  'Member': 6
};

/**
 * Maps a WorkOS role to application permissions
 * @param {string} workosRole - Role from WorkOS (e.g., "Admin", "Member")
 * @returns {string[]} Array of permission strings
 */
export function mapRoleToPermissions(workosRole) {
  const permissions = ROLE_PERMISSIONS[workosRole];

  if (!permissions) {
    console.warn(`Unknown WorkOS role: ${workosRole}, defaulting to Member permissions`);
    return ROLE_PERMISSIONS['Member'] || [];
  }

  return permissions;
}

/**
 * Checks if a role has a specific permission
 * Supports wildcard matching (e.g., "projects:*" grants "projects:create")
 *
 * @param {string[]} permissions - Array of permission strings
 * @param {string} requiredPermission - Permission to check (e.g., "projects:create")
 * @returns {boolean} True if permission is granted
 */
export function hasPermission(permissions, requiredPermission) {
  if (!permissions || !Array.isArray(permissions)) {
    return false;
  }

  const [resource, action] = requiredPermission.split(':');

  return permissions.some(permission => {
    if (permission === requiredPermission) {
      return true; // Exact match
    }

    const [permResource, permAction] = permission.split(':');

    // Check for wildcard match
    if (permResource === resource && permAction === '*') {
      return true; // Resource wildcard (e.g., "projects:*" grants "projects:create")
    }

    return false;
  });
}

/**
 * Checks if roleA is higher in hierarchy than roleB
 * @param {string} roleA - First role to compare
 * @param {string} roleB - Second role to compare
 * @returns {boolean} True if roleA has higher privileges than roleB
 */
export function isRoleHigherThan(roleA, roleB) {
  const levelA = ROLE_HIERARCHY[roleA] ?? 999;
  const levelB = ROLE_HIERARCHY[roleB] ?? 999;
  return levelA < levelB;
}

/**
 * Gets all permissions for multiple roles (useful for users with multiple memberships)
 * @param {string[]} roles - Array of WorkOS roles
 * @returns {string[]} Deduplicated array of all permissions
 */
export function getAllPermissionsForRoles(roles) {
  const allPermissions = new Set();

  roles.forEach(role => {
    const permissions = mapRoleToPermissions(role);
    permissions.forEach(perm => allPermissions.add(perm));
  });

  return Array.from(allPermissions);
}

/**
 * Validates if a permission string is properly formatted
 * @param {string} permission - Permission to validate
 * @returns {boolean} True if valid format
 */
export function isValidPermission(permission) {
  if (typeof permission !== 'string') return false;
  const parts = permission.split(':');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}

/**
 * Export default configuration
 */
export default {
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  mapRoleToPermissions,
  hasPermission,
  isRoleHigherThan,
  getAllPermissionsForRoles,
  isValidPermission
};
