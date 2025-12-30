/**
 * Role Normalization Utilities
 *
 * Normalizes WorkOS roles to consistent application roles
 * Maps various role names to standardized values: 'admin' or 'user'
 *
 * WorkOS Role Mapping:
 * - owner, admin, organization admin → 'admin'
 * - member, user, participant, instructor → 'user'
 */

/**
 * Normalize a WorkOS role to a standard application role
 * @param {string} workosRole - Role from WorkOS (e.g., 'owner', 'admin', 'member')
 * @returns {string} Normalized role: 'admin' or 'user'
 */
export function normalizeRole(workosRole) {
  if (!workosRole || typeof workosRole !== 'string') {
    return 'user';
  }

  const role = workosRole.toLowerCase().trim();

  // Admin roles
  const adminRoles = [
    'owner',
    'admin',
    'organization admin',
    'org admin',
    'administrator'
  ];

  if (adminRoles.includes(role)) {
    return 'admin';
  }

  // All other roles default to 'user'
  return 'user';
}

/**
 * Check if a role has admin privileges
 * @param {string} role - Role to check (can be WorkOS or normalized)
 * @returns {boolean} True if role has admin privileges
 */
export function isAdmin(role) {
  if (!role) {
    return false;
  }

  const normalized = normalizeRole(role);
  return normalized === 'admin';
}

/**
 * Check if a role is a regular user (non-admin)
 * @param {string} role - Role to check
 * @returns {boolean} True if role is a regular user
 */
export function isUser(role) {
  return !isAdmin(role);
}

/**
 * Get human-readable role display name
 * @param {string} role - Role to format (can be WorkOS or normalized)
 * @returns {string} Display name (e.g., 'Administrator', 'User')
 */
export function getRoleDisplayName(role) {
  const normalized = normalizeRole(role);

  switch (normalized) {
    case 'admin':
      return 'Administrator';
    case 'user':
      return 'User';
    default:
      return 'User';
  }
}

/**
 * Normalize all roles in an organization membership array
 * Adds a 'normalizedRole' field to each membership
 *
 * @param {Array} organizations - Array of organization memberships from claims
 * @returns {Array} Organizations with normalizedRole field added
 */
export function normalizeOrganizationRoles(organizations) {
  if (!Array.isArray(organizations)) {
    return [];
  }

  return organizations.map(org => ({
    ...org,
    normalizedRole: normalizeRole(org.role)
  }));
}

/**
 * Check if user has admin role in any organization
 * @param {Array} organizations - Array of organization memberships
 * @returns {boolean} True if user is admin in at least one org
 */
export function hasAdminInAnyOrg(organizations) {
  if (!Array.isArray(organizations) || organizations.length === 0) {
    return false;
  }

  return organizations.some(org => isAdmin(org.role));
}

/**
 * Check if user has admin role in a specific organization
 * @param {Array} organizations - Array of organization memberships
 * @param {string} workosOrgId - WorkOS organization ID
 * @returns {boolean} True if user is admin in specified org
 */
export function hasAdminInOrg(organizations, workosOrgId) {
  if (!Array.isArray(organizations) || !workosOrgId) {
    return false;
  }

  const org = organizations.find(o => o.workos_org_id === workosOrgId);
  return org ? isAdmin(org.role) : false;
}

/**
 * Get user's role in a specific organization
 * @param {Array} organizations - Array of organization memberships
 * @param {string} workosOrgId - WorkOS organization ID
 * @returns {string|null} Normalized role or null if not member
 */
export function getRoleInOrg(organizations, workosOrgId) {
  if (!Array.isArray(organizations) || !workosOrgId) {
    return null;
  }

  const org = organizations.find(o => o.workos_org_id === workosOrgId);
  return org ? normalizeRole(org.role) : null;
}

/**
 * Filter organizations where user has admin role
 * @param {Array} organizations - Array of organization memberships
 * @returns {Array} Organizations where user is admin
 */
export function getAdminOrganizations(organizations) {
  if (!Array.isArray(organizations)) {
    return [];
  }

  return organizations.filter(org => isAdmin(org.role));
}

/**
 * Filter organizations where user has regular user role
 * @param {Array} organizations - Array of organization memberships
 * @returns {Array} Organizations where user is regular user
 */
export function getUserOrganizations(organizations) {
  if (!Array.isArray(organizations)) {
    return [];
  }

  return organizations.filter(org => isUser(org.role));
}

/**
 * Export all role utilities
 */
export default {
  normalizeRole,
  isAdmin,
  isUser,
  getRoleDisplayName,
  normalizeOrganizationRoles,
  hasAdminInAnyOrg,
  hasAdminInOrg,
  getRoleInOrg,
  getAdminOrganizations,
  getUserOrganizations
};
