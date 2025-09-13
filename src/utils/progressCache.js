// Shared progress cache utility
// Using CommonJS for better compatibility with API routes

// Cache for progress calculations (5 minute expiry)
const progressCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to clear cache for specific project
function clearProgressCacheForProject(projectId) {
  if (!projectId) {
    console.warn('No projectId provided for cache clearing');
    return;
  }

  const keysToDelete = [];
  for (const [key] of progressCache) {
    // Cache keys are in format "groupId-projectId"
    if (key.endsWith(`-${projectId}`)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => progressCache.delete(key));
  console.log(`Cleared ${keysToDelete.length} progress cache entries for project ${projectId}`);
  
  return keysToDelete.length;
}

// Get cache instance for use in calculate-progress API
function getProgressCache() {
  return progressCache;
}

// Get cache duration
function getCacheDuration() {
  return CACHE_DURATION;
}

module.exports = {
  clearProgressCacheForProject,
  getProgressCache,
  getCacheDuration
};