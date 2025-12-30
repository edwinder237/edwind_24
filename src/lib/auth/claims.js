/**
 * User Claims Structure and Types
 *
 * Claims are short-lived permission tokens cached in Redis.
 * They contain all the information needed for fast authorization checks.
 */

/**
 * Claims structure stored in Redis
 * @typedef {Object} UserClaims
 * @property {string} userId - Local database user ID
 * @property {string} workos_user_id - WorkOS user ID
 * @property {string} email - User email
 * @property {OrganizationClaim[]} organizations - Organizations user belongs to
 * @property {number} issued_at - Timestamp when claims were issued (ms)
 * @property {number} expires_at - Timestamp when claims expire (ms)
 */

/**
 * Organization-specific claims
 * @typedef {Object} OrganizationClaim
 * @property {string} orgId - Local organization ID
 * @property {string} workos_org_id - WorkOS organization ID
 * @property {string} role - User's role in this organization (from WorkOS)
 * @property {string[]} permissions - Computed permissions for this org
 * @property {number[]} sub_organizations - Accessible sub_organization IDs
 * @property {string} status - Membership status (active, pending, inactive)
 */

/**
 * Claims configuration
 */
export const CLAIMS_CONFIG = {
  // Time-to-live for claims in Redis (15 minutes)
  TTL_SECONDS: 15 * 60,

  // Redis key prefix
  KEY_PREFIX: 'claims:',

  // Grace period before expiry to trigger refresh (2 minutes)
  REFRESH_GRACE_PERIOD: 2 * 60 * 1000
};

/**
 * Generates Redis key for user claims
 * @param {string} workosUserId - WorkOS user ID
 * @returns {string} Redis key
 */
export function getClaimsKey(workosUserId) {
  return `${CLAIMS_CONFIG.KEY_PREFIX}${workosUserId}`;
}

/**
 * Creates an empty claims structure
 * @param {string} userId - Local user ID
 * @param {string} workosUserId - WorkOS user ID
 * @param {string} email - User email
 * @returns {UserClaims} Empty claims object
 */
export function createEmptyClaims(userId, workosUserId, email) {
  const now = Date.now();
  return {
    userId,
    workos_user_id: workosUserId,
    email,
    organizations: [],
    issued_at: now,
    expires_at: now + (CLAIMS_CONFIG.TTL_SECONDS * 1000)
  };
}

/**
 * Checks if claims are expired
 * @param {UserClaims} claims - Claims to check
 * @returns {boolean} True if expired
 */
export function areClaimsExpired(claims) {
  if (!claims || !claims.expires_at) {
    return true;
  }
  return Date.now() >= claims.expires_at;
}

/**
 * Checks if claims should be refreshed soon
 * @param {UserClaims} claims - Claims to check
 * @returns {boolean} True if within grace period
 */
export function shouldRefreshClaims(claims) {
  if (!claims || !claims.expires_at) {
    return true;
  }
  const timeUntilExpiry = claims.expires_at - Date.now();
  return timeUntilExpiry <= CLAIMS_CONFIG.REFRESH_GRACE_PERIOD;
}

/**
 * Validates claims structure
 * @param {any} claims - Object to validate
 * @returns {boolean} True if valid claims structure
 */
export function validateClaims(claims) {
  if (!claims || typeof claims !== 'object') {
    return false;
  }

  const required = ['userId', 'workos_user_id', 'email', 'organizations', 'issued_at', 'expires_at'];
  const hasRequiredFields = required.every(field => field in claims);

  if (!hasRequiredFields) {
    return false;
  }

  if (!Array.isArray(claims.organizations)) {
    return false;
  }

  // Validate each organization claim
  for (const org of claims.organizations) {
    if (!org.orgId || !org.workos_org_id || !org.role || !Array.isArray(org.permissions)) {
      return false;
    }
  }

  return true;
}

/**
 * Serializes claims for Redis storage
 * @param {UserClaims} claims - Claims to serialize
 * @returns {string} JSON string
 */
export function serializeClaims(claims) {
  return JSON.stringify(claims);
}

/**
 * Deserializes claims from Redis
 * @param {string} claimsString - JSON string from Redis
 * @returns {UserClaims|null} Parsed claims or null if invalid
 */
export function deserializeClaims(claimsString) {
  try {
    const claims = JSON.parse(claimsString);
    return validateClaims(claims) ? claims : null;
  } catch (error) {
    console.error('Failed to deserialize claims:', error);
    return null;
  }
}

/**
 * Finds organization claim by org ID
 * @param {UserClaims} claims - User claims
 * @param {string} orgId - Organization ID to find
 * @returns {OrganizationClaim|null} Organization claim or null
 */
export function findOrganizationClaim(claims, orgId) {
  if (!claims || !claims.organizations) {
    return null;
  }
  return claims.organizations.find(org => org.orgId === orgId) || null;
}

/**
 * Finds organization claim by WorkOS org ID
 * @param {UserClaims} claims - User claims
 * @param {string} workosOrgId - WorkOS organization ID to find
 * @returns {OrganizationClaim|null} Organization claim or null
 */
export function findOrganizationClaimByWorkOSId(claims, workosOrgId) {
  if (!claims || !claims.organizations) {
    return null;
  }
  return claims.organizations.find(org => org.workos_org_id === workosOrgId) || null;
}

/**
 * Gets all accessible sub_organization IDs across all organizations
 * @param {UserClaims} claims - User claims
 * @returns {number[]} Array of sub_organization IDs
 */
export function getAllAccessibleSubOrgs(claims) {
  if (!claims || !claims.organizations) {
    return [];
  }

  const subOrgIds = new Set();
  claims.organizations.forEach(org => {
    if (org.sub_organizations && Array.isArray(org.sub_organizations)) {
      org.sub_organizations.forEach(id => subOrgIds.add(id));
    }
  });

  return Array.from(subOrgIds);
}

/**
 * Checks if user has access to a specific sub_organization
 * @param {UserClaims} claims - User claims
 * @param {number} subOrgId - Sub-organization ID to check
 * @returns {boolean} True if user has access
 */
export function hasSubOrgAccess(claims, subOrgId) {
  const accessibleSubOrgs = getAllAccessibleSubOrgs(claims);
  return accessibleSubOrgs.includes(subOrgId);
}

/**
 * Gets all permissions across all organizations
 * @param {UserClaims} claims - User claims
 * @returns {string[]} Deduplicated array of all permissions
 */
export function getAllPermissions(claims) {
  if (!claims || !claims.organizations) {
    return [];
  }

  const allPermissions = new Set();
  claims.organizations.forEach(org => {
    if (org.permissions && Array.isArray(org.permissions)) {
      org.permissions.forEach(perm => allPermissions.add(perm));
    }
  });

  return Array.from(allPermissions);
}

/**
 * Creates a debug-friendly summary of claims
 * @param {UserClaims} claims - Claims to summarize
 * @returns {Object} Summary object
 */
export function summarizeClaims(claims) {
  if (!claims) {
    return { valid: false };
  }

  return {
    valid: validateClaims(claims),
    userId: claims.userId,
    email: claims.email,
    organizationCount: claims.organizations?.length || 0,
    organizations: claims.organizations?.map(org => ({
      orgId: org.orgId,
      role: org.role,
      permissionCount: org.permissions?.length || 0,
      subOrgCount: org.sub_organizations?.length || 0,
      status: org.status
    })),
    isExpired: areClaimsExpired(claims),
    shouldRefresh: shouldRefreshClaims(claims),
    expiresIn: claims.expires_at ? Math.max(0, claims.expires_at - Date.now()) : 0
  };
}

/**
 * Export everything
 */
export default {
  CLAIMS_CONFIG,
  getClaimsKey,
  createEmptyClaims,
  areClaimsExpired,
  shouldRefreshClaims,
  validateClaims,
  serializeClaims,
  deserializeClaims,
  findOrganizationClaim,
  findOrganizationClaimByWorkOSId,
  getAllAccessibleSubOrgs,
  hasSubOrgAccess,
  getAllPermissions,
  summarizeClaims
};
