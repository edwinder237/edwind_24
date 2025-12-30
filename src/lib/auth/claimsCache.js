/**
 * Two-Tier Claims Caching
 *
 * Implements a hierarchical caching strategy:
 * L1: In-memory LRU cache (1-minute TTL, sub-millisecond lookups)
 * L2: Redis cache (15-minute TTL, reduces WorkOS API calls)
 * L3: WorkOS API (fallback, fresh data)
 *
 * Benefits:
 * - Sub-millisecond response times for frequently accessed claims
 * - Reduced Redis connections per request
 * - Automatic cache warming and invalidation
 * - Memory-efficient with LRU eviction
 */

import { getClaimsFromRequest as getClaimsFromRequestOriginal } from './claimsManager';
import * as cache from './cache';

// L1: In-memory LRU cache
class LRUCache {
  constructor(maxSize = 100, ttlMs = 60000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check expiration
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (mark as recently used)
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  set(key, value) {
    // Remove if already exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // Add new item
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Initialize L1 cache
const L1_TTL_MS = 60 * 1000; // 1 minute
const L1_MAX_SIZE = 100; // Max 100 users in memory
const l1Cache = new LRUCache(L1_MAX_SIZE, L1_TTL_MS);

// Cleanup expired L1 entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    l1Cache.cleanup();
  }, 60000);
}

/**
 * Get claims cache key for a user
 * @param {string} workosUserId - WorkOS user ID
 * @returns {string} Cache key
 */
function getClaimsCacheKey(workosUserId) {
  return `claims:${workosUserId}`;
}

/**
 * Get cached claims with two-tier lookup
 *
 * Lookup order:
 * 1. L1 (Memory) - sub-ms
 * 2. L2 (Redis) - warm L1 on hit
 * 3. WorkOS API - warm both caches
 *
 * @param {Object} req - Next.js request object
 * @param {Object} workos - WorkOS SDK client instance
 * @returns {Promise<UserClaims|null>} User claims or null
 */
export async function getCachedClaims(req, workos) {
  const workosUserId = req.cookies?.workos_user_id;

  if (!workosUserId) {
    return null;
  }

  const cacheKey = getClaimsCacheKey(workosUserId);

  try {
    // L1: Check in-memory cache first (fastest)
    const l1Claims = l1Cache.get(cacheKey);
    if (l1Claims) {
      // console.log(`🚀 L1 cache hit for user: ${workosUserId}`);
      return l1Claims;
    }

    // L2: Check Redis cache
    const l2ClaimsJson = await cache.get(cacheKey);
    if (l2ClaimsJson) {
      // console.log(`📦 L2 cache hit for user: ${workosUserId}`);
      const l2Claims = JSON.parse(l2ClaimsJson);

      // Warm L1 cache
      l1Cache.set(cacheKey, l2Claims);

      return l2Claims;
    }

    // L3: Fetch from WorkOS API (via claimsManager)
    console.log(`🔄 Cache miss, fetching from WorkOS for user: ${workosUserId}`);
    const freshClaims = await getClaimsFromRequestOriginal(req, workos);

    if (!freshClaims) {
      return null;
    }

    // Warm both caches
    l1Cache.set(cacheKey, freshClaims);
    await cache.set(cacheKey, JSON.stringify(freshClaims), 15 * 60); // 15 minutes in Redis

    return freshClaims;

  } catch (error) {
    console.error('Error in getCachedClaims:', error);
    return null;
  }
}

/**
 * Invalidate cached claims for a user (on org switch, role change, etc.)
 * Clears both L1 and L2 caches
 *
 * @param {string} workosUserId - WorkOS user ID
 * @returns {Promise<void>}
 */
export async function invalidateClaimsCache(workosUserId) {
  const cacheKey = getClaimsCacheKey(workosUserId);

  try {
    // Clear L1 (memory)
    l1Cache.delete(cacheKey);

    // Clear L2 (Redis)
    await cache.del(cacheKey);

    console.log(`✅ Invalidated claims cache for user: ${workosUserId}`);
  } catch (error) {
    console.error('Error invalidating claims cache:', error);
    throw error;
  }
}

/**
 * Invalidate all claims caches (L1 + L2)
 * Use carefully - clears all cached claims
 *
 * @returns {Promise<number>} Number of L2 entries deleted
 */
export async function invalidateAllClaimsCache() {
  try {
    // Clear L1
    l1Cache.clear();
    console.log('✅ Cleared L1 claims cache');

    // Clear L2
    const deletedCount = await cache.deletePattern('claims:*');
    console.log(`✅ Cleared ${deletedCount} L2 claims cache entries`);

    return deletedCount;
  } catch (error) {
    console.error('Error invalidating all claims cache:', error);
    throw error;
  }
}

/**
 * Warm cache for a user (proactive caching)
 * Useful after login or org switch
 *
 * @param {Object} req - Next.js request object
 * @param {Object} workos - WorkOS SDK client instance
 * @returns {Promise<UserClaims|null>}
 */
export async function warmClaimsCache(req, workos) {
  const workosUserId = req.cookies?.workos_user_id;

  if (!workosUserId) {
    return null;
  }

  try {
    // Force refresh from WorkOS
    const freshClaims = await getClaimsFromRequestOriginal(req, workos);

    if (!freshClaims) {
      return null;
    }

    const cacheKey = getClaimsCacheKey(workosUserId);

    // Warm both caches
    l1Cache.set(cacheKey, freshClaims);
    await cache.set(cacheKey, JSON.stringify(freshClaims), 15 * 60);

    console.log(`✅ Warmed cache for user: ${workosUserId}`);

    return freshClaims;
  } catch (error) {
    console.error('Error warming claims cache:', error);
    return null;
  }
}

/**
 * Get cache statistics for monitoring
 * @returns {Promise<Object>} Cache stats
 */
export async function getCacheStatistics() {
  const l2Stats = await cache.getStats();

  return {
    l1: {
      type: 'memory-lru',
      size: l1Cache.size(),
      maxSize: L1_MAX_SIZE,
      ttlMs: L1_TTL_MS
    },
    l2: l2Stats
  };
}

/**
 * Export functions
 */
export default {
  getCachedClaims,
  invalidateClaimsCache,
  invalidateAllClaimsCache,
  warmClaimsCache,
  getCacheStatistics
};
