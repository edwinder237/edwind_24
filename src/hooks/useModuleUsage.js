import { useMemo } from 'react';

/**
 * Custom hook for detecting module usage across training plan
 * @param {Array} trainingPlan - The complete training plan
 * @param {number} excludeDayIndex - Day index to exclude from usage check
 * @param {number} excludeModuleIndex - Module index to exclude from usage check
 * @returns {Function} getModuleUsage function
 */
export const useModuleUsage = (trainingPlan, excludeDayIndex = -1, excludeModuleIndex = -1) => {
  const getModuleUsage = useMemo(() => {
    return (moduleId, courseId) => {
      const usedDays = [];
      
      trainingPlan.forEach((day, dayIdx) => {
        day.modules?.forEach((mod, modIdx) => {
          // Exclude current module being edited
          const isCurrentModule = dayIdx === excludeDayIndex && modIdx === excludeModuleIndex;
          const isMatchingModule = mod.moduleId === moduleId && mod.courseId === courseId;
          
          if (!isCurrentModule && isMatchingModule) {
            usedDays.push(dayIdx + 1); // Add 1 to make it 1-indexed
          }
        });
      });
      
      return {
        isUsed: usedDays.length > 0,
        usedDays,
        usageCount: usedDays.length
      };
    };
  }, [trainingPlan, excludeDayIndex, excludeModuleIndex]);

  return getModuleUsage;
};