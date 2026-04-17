/**
 * Claims Manager
 *
 * High-level API for managing user claims with caching.
 * This is the main interface for getting and refreshing user permissions.
 */

import * as cache from './cache.js';
import { buildUserClaims, rebuildClaimsFromWorkOS, syncMembershipsToDatabase } from './claimsBuilder.js';
import {
  getClaimsKey,
  serializeClaims,
  deserializeClaims,
  areClaimsExpired,
  shouldRefreshClaims,
  validateClaims,
  CLAIMS_CONFIG
} from './claims.js';

// In-memory cache is always ready - no initialization needed

/**
 * Gets user claims from cache or builds fresh
 *
 * @param {string} workosUserId - WorkOS user ID
 * @param {Object} workosClient - WorkOS SDK client instance
 * @param {boolean} forceRefresh - Force rebuild from WorkOS (default: false)
 * @param {Object} req - Request object to extract JWT from cookies (optional)
 * @returns {Promise<UserClaims|null>} User claims or null if user not found
 */
export async function getUserClaims(workosUserId, workosClient, forceRefresh = false, req = null) {

  try {
    const cacheKey = getClaimsKey(workosUserId);

    // Try to get from cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedClaims = await cache.get(cacheKey);

      if (cachedClaims) {
        const claims = deserializeClaims(cachedClaims);

        if (claims && !areClaimsExpired(claims)) {
          return claims;
        }
      }
    }

    // Cache miss or expired - rebuild from WorkOS
    const freshClaims = await rebuildClaimsFromWorkOS(workosUserId, workosClient, req);

    if (!freshClaims) {
      return null;
    }

    // Cache the fresh claims
    await cacheClaims(freshClaims);

    return freshClaims;
  } catch (error) {
    console.error('Error getting user claims:', error);
    throw error;
  }
}

/**
 * Caches user claims in Redis/memory
 *
 * @param {UserClaims} claims - Claims to cache
 * @returns {Promise<void>}
 */
export async function cacheClaims(claims) {

  if (!validateClaims(claims)) {
    throw new Error('Invalid claims structure');
  }

  try {
    const cacheKey = getClaimsKey(claims.workos_user_id);
    const serialized = serializeClaims(claims);

    await cache.set(cacheKey, serialized, CLAIMS_CONFIG.TTL_SECONDS);
  } catch (error) {
    console.error('Error caching claims:', error);
    throw error;
  }
}

/**
 * Invalidates (deletes) cached claims for a user
 *
 * @param {string} workosUserId - WorkOS user ID
 * @returns {Promise<void>}
 */
export async function invalidateClaims(workosUserId) {

  try {
    const cacheKey = getClaimsKey(workosUserId);
    await cache.del(cacheKey);
  } catch (error) {
    console.error('Error invalidating claims:', error);
    throw error;
  }
}

/**
 * Invalidates all cached claims (use carefully!)
 *
 * @returns {Promise<number>} Number of claims invalidated
 */
export async function invalidateAllClaims() {

  try {
    const pattern = `${CLAIMS_CONFIG.KEY_PREFIX}*`;
    const deletedCount = await cache.deletePattern(pattern);
    return deletedCount;
  } catch (error) {
    console.error('Error invalidating all claims:', error);
    throw error;
  }
}

/**
 * Refreshes claims if they're close to expiring
 *
 * @param {UserClaims} claims - Current claims
 * @param {Object} workosClient - WorkOS SDK client instance
 * @returns {Promise<UserClaims>} Refreshed claims or original if not needed
 */
export async function refreshClaimsIfNeeded(claims, workosClient) {
  if (!claims) {
    return null;
  }

  if (shouldRefreshClaims(claims)) {
    return await getUserClaims(claims.workos_user_id, workosClient, true);
  }

  return claims;
}

/**
 * Gets claims from request cookies
 * This is the main function to use in API routes
 *
 * @param {Object} req - Next.js request object
 * @param {Object} workosClient - WorkOS SDK client instance
 * @returns {Promise<UserClaims|null>} User claims or null
 */
export async function getClaimsFromRequest(req, workosClient) {
  const workosUserId = req.cookies.workos_user_id;

  if (!workosUserId) {
    return null;
  }

  try {
    // Pass req to getUserClaims so it can extract JWT permissions if needed
    const claims = await getUserClaims(workosUserId, workosClient, false, req);

    // Proactively refresh if needed (background operation)
    if (claims && shouldRefreshClaims(claims)) {
      // Don't await - let it refresh in background
      refreshClaimsIfNeeded(claims, workosClient).catch(err =>
        console.error('Background claims refresh failed:', err)
      );
    }

    return claims;
  } catch (error) {
    console.error('Error getting claims from request:', error);
    return null;
  }
}

/**
 * Builds and caches claims for a new user during authentication
 *
 * @param {string} workosUserId - WorkOS user ID
 * @param {Array} workOSMemberships - WorkOS memberships array
 * @param {Array} jwtPermissions - Permissions from JWT access token (optional)
 * @returns {Promise<UserClaims|null>} Built and cached claims
 */
export async function buildAndCacheClaims(workosUserId, workOSMemberships, jwtPermissions = []) {

  try {
    // Sync memberships to database first
    await syncMembershipsToDatabase(workosUserId, workOSMemberships);

    // Build claims with JWT permissions
    const claims = await buildUserClaims(workosUserId, workOSMemberships, jwtPermissions);

    if (!claims) {
      return null;
    }

    // Cache the claims
    await cacheClaims(claims);

    return claims;
  } catch (error) {
    console.error('Error building and caching claims:', error);
    throw error;
  }
}

/**
 * Gets cache statistics for monitoring
 *
 * @returns {Promise<Object>} Cache statistics
 */
export async function getCacheStats() {
  return await cache.getStats();
}

/**
 * Gets cache status for health checks
 *
 * @returns {Object} Cache status
 */
export function getCacheStatus() {
  return cache.getStatus();
}

/**
 * Cleanup function for graceful shutdown
 *
 * @returns {Promise<void>}
 */
export async function shutdown() {
  await cache.disconnect();
}

/**
 * Export all functions
 */
export default {
  getUserClaims,
  cacheClaims,
  invalidateClaims,
  invalidateAllClaims,
  refreshClaimsIfNeeded,
  getClaimsFromRequest,
  buildAndCacheClaims,
  getCacheStats,
  getCacheStatus,
  shutdown
};
