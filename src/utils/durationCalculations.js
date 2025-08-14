/**
 * Duration calculation utilities for courses, modules, and activities
 * 
 * Hierarchy:
 * - Activity durations are stored in the database
 * - Module durations are calculated from activity durations (with optional customDuration override)
 * - Course durations are calculated from module durations
 */

/**
 * Calculate total duration of a module from its activities
 * @param {Object} module - Module object with activities array
 * @returns {number} Total duration in minutes
 */
export const calculateModuleDurationFromActivities = (module) => {
  if (!module?.activities || module.activities.length === 0) return 0;
  return module.activities.reduce((acc, activity) => acc + (parseInt(activity.duration) || 0), 0);
};

/**
 * Get the display duration for a module (uses customDuration if set, otherwise calculated)
 * @param {Object} module - Module object
 * @returns {number} Duration in minutes
 */
export const getModuleDisplayDuration = (module) => {
  if (!module) return 0;
  const calculatedDuration = calculateModuleDurationFromActivities(module);
  return module.customDuration || calculatedDuration;
};

/**
 * Calculate total duration of a course from its modules
 * @param {Array} modules - Array of module objects
 * @returns {number} Total duration in minutes
 */
export const calculateCourseDurationFromModules = (modules) => {
  if (!modules || modules.length === 0) return 0;
  return modules.reduce((acc, module) => acc + getModuleDisplayDuration(module), 0);
};

/**
 * Calculate total duration of a course from a course object with modules
 * @param {Object} course - Course object with modules array
 * @returns {number} Total duration in minutes
 */
export const getCourseTotalDuration = (course) => {
  if (!course?.modules) return 0;
  return calculateCourseDurationFromModules(course.modules);
};

/**
 * Check if a module has a custom duration override
 * @param {Object} module - Module object
 * @returns {boolean} True if module has custom duration set
 */
export const hasModuleCustomDuration = (module) => {
  if (!module) return false;
  const calculatedDuration = calculateModuleDurationFromActivities(module);
  return module.customDuration && module.customDuration !== calculatedDuration;
};

/**
 * Format duration from minutes to human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} min`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
};

/**
 * Calculate statistics for a course
 * @param {Object} course - Course object with modules
 * @returns {Object} Course statistics
 */
export const calculateCourseStatistics = (course) => {
  const modules = course?.modules || [];
  const totalModules = modules.length;
  const totalDuration = getCourseTotalDuration(course);
  const totalActivities = modules.reduce((acc, module) => acc + (module.activities?.length || 0), 0);
  
  return {
    totalModules,
    totalDuration,
    totalActivities,
    formattedDuration: formatDuration(totalDuration),
    averageModuleDuration: totalModules > 0 ? Math.round(totalDuration / totalModules) : 0
  };
};

/**
 * Calculate progress statistics for a course
 * @param {Object} course - Course object with modules
 * @returns {Object} Progress statistics
 */
export const calculateCourseProgress = (course) => {
  const modules = course?.modules || [];
  const totalModules = modules.length;
  
  // Consider a module complete if it has content (JSONContent with blocks)
  const completedModules = modules.filter(module => 
    module.JSONContent && module.JSONContent.blocks?.length > 1
  ).length;
  
  const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  
  return {
    totalModules,
    completedModules,
    progressPercentage,
    remainingModules: totalModules - completedModules
  };
};