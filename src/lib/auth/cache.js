/**
 * Cache Layer for Claims
 *
 * In-memory cache with TTL support.
 * Suitable for single-instance deployments.
 */

// In-memory cache
const memoryCache = new Map();

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<string|null>} Cached value or null
 */
export async function get(key) {
  const cached = memoryCache.get(key);
  if (!cached) return null;

  // Check if expired
  if (cached.expiresAt && Date.now() > cached.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return cached.value;
}

/**
 * Set value in cache with TTL
 * @param {string} key - Cache key
 * @param {string} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<void>}
 */
export async function set(key, value, ttlSeconds) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + (ttlSeconds * 1000)
  });
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<void>}
 */
export async function del(key) {
  memoryCache.delete(key);
}

/**
 * Delete multiple keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., "claims:*")
 * @returns {Promise<number>} Number of keys deleted
 */
export async function deletePattern(pattern) {
  let deletedCount = 0;
  const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');

  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Check if key exists
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} True if key exists
 */
export async function exists(key) {
  const cached = memoryCache.get(key);
  if (!cached) return false;

  // Check if expired
  if (cached.expiresAt && Date.now() > cached.expiresAt) {
    memoryCache.delete(key);
    return false;
  }

  return true;
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
export async function getStats() {
  return {
    type: 'memory',
    connected: true,
    keyCount: memoryCache.size,
    keys: Array.from(memoryCache.keys())
  };
}

/**
 * Clear all cache entries
 * @returns {Promise<void>}
 */
export async function flushAll() {
  memoryCache.clear();
}

/**
 * Clear cache (for app shutdown compatibility)
 * @returns {Promise<void>}
 */
export async function disconnect() {
  memoryCache.clear();
}

/**
 * Get cache status
 * @returns {Object} Status object
 */
export function getStatus() {
  return {
    type: 'memory',
    connected: true
  };
}

// Clean up expired cache entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, cached] of memoryCache.entries()) {
      if (cached.expiresAt && now > cached.expiresAt) {
        memoryCache.delete(key);
      }
    }
  }, 60000); // Every minute
}

/**
 * Export all cache functions
 */
export default {
  get,
  set,
  del,
  deletePattern,
  exists,
  getStats,
  flushAll,
  disconnect,
  getStatus
};
