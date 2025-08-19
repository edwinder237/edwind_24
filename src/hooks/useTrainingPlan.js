import { useCallback } from 'react';

/**
 * Custom hook for training plan operations
 * @param {Array} trainingPlan - Current training plan state
 * @param {Function} setTrainingPlan - State setter for training plan
 * @param {Function} setHasUnsavedChanges - State setter for unsaved changes flag
 * @returns {Object} Training plan operations
 */
export const useTrainingPlan = (trainingPlan, setTrainingPlan, setHasUnsavedChanges) => {
  
  const updateModule = useCallback((dayIndex, moduleIndex, updates) => {
    const updatedPlan = [...trainingPlan];
    updatedPlan[dayIndex].modules[moduleIndex] = {
      ...updatedPlan[dayIndex].modules[moduleIndex],
      ...updates
    };
    setTrainingPlan(updatedPlan);
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  }, [trainingPlan, setTrainingPlan, setHasUnsavedChanges]);

  const moveModuleUp = useCallback((dayIndex, moduleIndex) => {
    if (moduleIndex === 0) return;
    
    const updatedPlan = [...trainingPlan];
    const modules = [...updatedPlan[dayIndex].modules];
    [modules[moduleIndex - 1], modules[moduleIndex]] = [modules[moduleIndex], modules[moduleIndex - 1]];
    updatedPlan[dayIndex].modules = modules;
    setTrainingPlan(updatedPlan);
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  }, [trainingPlan, setTrainingPlan, setHasUnsavedChanges]);

  const moveModuleDown = useCallback((dayIndex, moduleIndex) => {
    const updatedPlan = [...trainingPlan];
    const modules = updatedPlan[dayIndex].modules;
    
    if (moduleIndex >= modules.length - 1) return;
    
    const newModules = [...modules];
    [newModules[moduleIndex], newModules[moduleIndex + 1]] = [newModules[moduleIndex + 1], newModules[moduleIndex]];
    updatedPlan[dayIndex].modules = newModules;
    setTrainingPlan(updatedPlan);
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  }, [trainingPlan, setTrainingPlan, setHasUnsavedChanges]);

  const addModule = useCallback((dayIndex, moduleType = 'course') => {
    const updatedPlan = [...trainingPlan];
    const newModule = {
      id: Date.now(),
      title: '',
      duration: 60,
      activities: [],
      learningObjectives: [],
      isSupportActivity: moduleType === 'support'
    };
    
    updatedPlan[dayIndex].modules.push(newModule);
    setTrainingPlan(updatedPlan);
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  }, [trainingPlan, setTrainingPlan, setHasUnsavedChanges]);

  const removeModule = useCallback((dayIndex, moduleIndex) => {
    const updatedPlan = [...trainingPlan];
    updatedPlan[dayIndex].modules.splice(moduleIndex, 1);
    setTrainingPlan(updatedPlan);
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  }, [trainingPlan, setTrainingPlan, setHasUnsavedChanges]);

  const updateModuleFromSelection = useCallback((dayIndex, moduleIndex, selectedOption, curriculum) => {
    if (!selectedOption) return;

    const selectedCourse = curriculum.curriculum_courses?.find(
      cc => cc.courseId === selectedOption.courseId
    );
    const selectedModule = selectedCourse?.course?.modules?.find(
      m => m.id === selectedOption.moduleId
    );
    
    if (selectedCourse && selectedModule) {
      const updates = {
        courseId: selectedOption.courseId,
        courseName: selectedCourse.course?.title,
        moduleId: selectedOption.moduleId,
        title: selectedModule.title
      };
      
      if (selectedModule.duration) {
        updates.duration = selectedModule.duration;
      }
      
      updateModule(dayIndex, moduleIndex, updates);
    }
  }, [updateModule]);

  const updateSupportActivityFromSelection = useCallback((dayIndex, moduleIndex, selectedOption, curriculum) => {
    if (!selectedOption) return;

    const selectedCourse = curriculum.curriculum_courses?.find(
      cc => cc.courseId === selectedOption.courseId
    );
    const selectedActivity = selectedCourse?.course?.supportActivities?.find(
      a => a.id === selectedOption.activityId
    );
    
    if (selectedCourse && selectedActivity) {
      const updates = {
        courseId: selectedOption.courseId,
        courseName: selectedCourse.course?.title,
        activityId: selectedOption.activityId,
        title: selectedActivity.title,
        isSupportActivity: true
      };
      
      updateModule(dayIndex, moduleIndex, updates);
    }
  }, [updateModule]);

  return {
    updateModule,
    moveModuleUp,
    moveModuleDown,
    addModule,
    removeModule,
    updateModuleFromSelection,
    updateSupportActivityFromSelection
  };
};