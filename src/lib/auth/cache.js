/**
 * Cache Layer for Claims
 *
 * Provides a caching interface that can use Redis (production) or in-memory cache (development).
 * Falls back gracefully if Redis is not available.
 */

let redisClient = null;
let useRedis = false;

// In-memory fallback cache (for development without Redis)
const memoryCache = new Map();

/**
 * Initialize Redis client
 * Safe to call multiple times - will only initialize once
 */
export async function initializeCache() {
  // Skip if already initialized
  if (redisClient !== null) {
    return redisClient;
  }

  // Check if Redis URL is configured
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('⚠️  REDIS_URL not configured. Using in-memory cache (not suitable for production)');
    useRedis = false;
    return null;
  }

  try {
    // Dynamically import redis (only if configured)
    const redis = await import('redis');

    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      useRedis = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
      useRedis = true;
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error.message);
    console.warn('⚠️  Falling back to in-memory cache');
    useRedis = false;
    return null;
  }
}

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<string|null>} Cached value or null
 */
export async function get(key) {
  if (useRedis && redisClient) {
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      // Fallback to memory cache
      return memoryCache.get(key) || null;
    }
  }

  // Use memory cache
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
  if (useRedis && redisClient) {
    try {
      await redisClient.setEx(key, ttlSeconds, value);
      return;
    } catch (error) {
      console.error('Redis SET error:', error);
      // Fall through to memory cache
    }
  }

  // Use memory cache
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
  if (useRedis && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (error) {
      console.error('Redis DEL error:', error);
      // Fall through to memory cache
    }
  }

  // Use memory cache
  memoryCache.delete(key);
}

/**
 * Delete multiple keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., "claims:*")
 * @returns {Promise<number>} Number of keys deleted
 */
export async function deletePattern(pattern) {
  if (useRedis && redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) return 0;

      await redisClient.del(keys);
      return keys.length;
    } catch (error) {
      console.error('Redis pattern delete error:', error);
      // Fall through to memory cache
    }
  }

  // Use memory cache
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
  if (useRedis && redisClient) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      // Fall through to memory cache
    }
  }

  // Use memory cache
  return memoryCache.has(key);
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
export async function getStats() {
  if (useRedis && redisClient) {
    try {
      const info = await redisClient.info('stats');
      return {
        type: 'redis',
        connected: useRedis,
        info
      };
    } catch (error) {
      console.error('Redis INFO error:', error);
    }
  }

  // Memory cache stats
  return {
    type: 'memory',
    connected: true,
    keyCount: memoryCache.size,
    keys: Array.from(memoryCache.keys())
  };
}

/**
 * Clear all cache entries (use with caution!)
 * @returns {Promise<void>}
 */
export async function flushAll() {
  if (useRedis && redisClient) {
    try {
      await redisClient.flushAll();
      console.log('✅ Redis cache flushed');
      return;
    } catch (error) {
      console.error('Redis FLUSHALL error:', error);
      // Fall through to memory cache
    }
  }

  // Clear memory cache
  memoryCache.clear();
  console.log('✅ Memory cache cleared');
}

/**
 * Disconnect from Redis (call on app shutdown)
 * @returns {Promise<void>}
 */
export async function disconnect() {
  if (useRedis && redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Redis disconnected');
    } catch (error) {
      console.error('Redis disconnect error:', error);
    }
    redisClient = null;
    useRedis = false;
  }

  // Clear memory cache
  memoryCache.clear();
}

/**
 * Get cache client status
 * @returns {Object} Status object
 */
export function getStatus() {
  return {
    type: useRedis ? 'redis' : 'memory',
    connected: useRedis ? (redisClient?.isOpen || false) : true,
    isProduction: process.env.NODE_ENV === 'production'
  };
}

// Clean up expired memory cache entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    if (!useRedis) {
      const now = Date.now();
      for (const [key, cached] of memoryCache.entries()) {
        if (cached.expiresAt && now > cached.expiresAt) {
          memoryCache.delete(key);
        }
      }
    }
  }, 60000); // Every minute
}

/**
 * Export all cache functions
 */
export default {
  initializeCache,
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
