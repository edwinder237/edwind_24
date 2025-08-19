import React, { useMemo } from 'react';
import { useModuleUsage } from '../../hooks/useModuleUsage';
import { createModuleOptions } from '../../utils/moduleUtils';
import ModuleSelector from './ModuleSelector';

const ModuleDropdownCell = ({
  module,
  dayIndex,
  originalIndex,
  trainingPlan,
  curriculum,
  updateModuleFromSelection
}) => {
  // Get usage detection for this specific module position
  const moduleUsageDetector = useModuleUsage(trainingPlan, dayIndex, originalIndex);
  
  // Create options with context-specific usage detection
  const contextualOptions = useMemo(() => {
    if (!curriculum?.curriculum_courses) return [];
    return createModuleOptions(curriculum.curriculum_courses, moduleUsageDetector);
  }, [curriculum?.curriculum_courses, moduleUsageDetector]);

  // Find current selection
  const currentValue = module.moduleId ? 
    contextualOptions.find(opt => opt.courseId === module.courseId && opt.moduleId === module.moduleId) : null;

  return (
    <ModuleSelector
      currentValue={currentValue}
      options={contextualOptions}
      onSelectionChange={(selectedOption) => {
        updateModuleFromSelection(dayIndex, originalIndex, selectedOption, curriculum);
      }}
      placeholder="Search courses & modules..."
    />
  );
};

export default ModuleDropdownCell;