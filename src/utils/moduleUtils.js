/**
 * Transforms curriculum courses into module options for dropdowns
 * @param {Array} curriculumCourses - Array of curriculum courses
 * @param {Function} getModuleUsage - Function to get module usage info
 * @returns {Array} Array of module options
 */
export const createModuleOptions = (curriculumCourses, getModuleUsage) => {
  const options = [];
  
  curriculumCourses?.forEach((cc) => {
    const courseModules = cc.course?.modules || [];
    
    courseModules.forEach((courseModule, moduleIndex) => {
      const moduleUsage = getModuleUsage(courseModule.id, cc.courseId);
      const moduleNumber = courseModule.moduleOrder || (moduleIndex + 1);
      
      // Get target audience from course participant roles
      const getTargetAudience = (course) => {
        const roles = course?.course_participant_roles || [];
        if (roles.length === 0) return '';
        
        const roleNames = roles
          .filter(cpr => cpr.role) // Ensure role exists
          .map(cpr => cpr.role.title)
          .join(', ');
        
        return roleNames;
      };

      const option = {
        id: `${cc.courseId}-${courseModule.id}`,
        courseId: cc.courseId,
        moduleId: courseModule.id,
        courseTitle: cc.course?.code ? `${cc.course.title} (${cc.course.code})` : cc.course?.title || '',
        moduleTitle: `Module ${moduleNumber}: ${courseModule.title || ''}`,
        moduleNumber: moduleNumber,
        originalModuleTitle: courseModule.title || '',
        targetAudience: getTargetAudience(cc.course),
        duration: courseModule.duration,
        isUsed: moduleUsage.isUsed,
        usedDays: moduleUsage.usedDays,
        usageCount: moduleUsage.usageCount,
        searchText: `${cc.course?.title} ${cc.course?.code || ''} module ${moduleNumber} ${courseModule.title}`.toLowerCase()
      };
      
      options.push(option);
    });
  });
  
  return options;
};

/**
 * Creates support activity options from curriculum courses
 * @param {Array} curriculumCourses - Array of curriculum courses
 * @returns {Array} Array of support activity options
 */
export const createSupportActivityOptions = (curriculumCourses) => {
  const options = [];
  
  curriculumCourses?.forEach((cc) => {
    const courseSupportActivities = cc.course?.supportActivities || [];
    
    courseSupportActivities.forEach((activity) => {
      options.push({
        id: `${cc.courseId}-${activity.id}`,
        courseId: cc.courseId,
        activityId: activity.id,
        courseTitle: cc.course?.code ? `${cc.course.title} (${cc.course.code})` : cc.course?.title || '',
        activityTitle: activity.title || '',
        searchText: `${cc.course?.title} ${cc.course?.code || ''} ${activity.title}`.toLowerCase()
      });
    });
  });
  
  return options;
};

/**
 * Formats duration in minutes to human readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes < 60) {
    return `${minutes || 0}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};