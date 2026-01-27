import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'store';
import {
  useGetProjectSettingsQuery,
  useUpdateProjectSettingsMutation,
  useUpdateProjectMutation
} from 'store/api/projectApi';
import { settingsCommands } from 'store/commands/settingsCommands';
import {
  selectCurrentProjectSettings,
  selectProjectSchedule,
  selectProjectInstructors,
  selectProjectTopics,
  selectProjectCurriculums,
  selectSettingsLoadingState,
  selectSettingsError
} from 'store/entities/settingsSlice';
import { openSnackbar } from 'store/reducers/snackbar';
import {
  createInitialState,
  hasSettingsChanged,
  prepareSettingsForSubmission,
  validateSettings
} from '../utils/settingsHelpers';
import { NOTIFICATION_MESSAGES } from '../utils/constants';

/**
 * Modern Project Settings Hook using RTK Query and CQRS
 *
 * This hook provides a complete interface for managing project settings
 * using RTK Query for data fetching, semantic commands for business logic,
 * and normalized entity store for state management.
 */
export const useProjectSettings = (projectId) => {
  const dispatch = useDispatch();

  // ==============================|| RTK QUERY ||============================== //

  // Fetch settings using RTK Query
  const {
    data: queryData,
    isLoading: queryLoading,
    isFetching,
    error: queryError,
    refetch
  } = useGetProjectSettingsQuery(projectId, {
    skip: !projectId,
    pollingInterval: 0, // Disable polling, use manual refresh
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  // Mutations
  const [updateSettingsMutation, { isLoading: isUpdating }] = useUpdateProjectSettingsMutation();
  const [updateProjectMutation, { isLoading: isUpdatingProject }] = useUpdateProjectMutation();

  // ==============================|| ENTITY SELECTORS ||============================== //

  // Get normalized data from entity store
  const normalizedSettings = useSelector(selectCurrentProjectSettings);
  const projectSchedule = useSelector(selectProjectSchedule);
  const projectInstructors = useSelector(selectProjectInstructors);
  const projectTopics = useSelector(selectProjectTopics);
  const projectCurriculums = useSelector(selectProjectCurriculums);
  const storeLoading = useSelector(selectSettingsLoadingState);
  const storeError = useSelector(selectSettingsError);

  // ==============================|| LOCAL STATE ||============================== //

  const [localSettings, setLocalSettings] = useState(() => createInitialState(null));
  const [hasChanges, setHasChanges] = useState(false);
  const [localError, setLocalError] = useState(null);

  // ==============================|| SYNC STATE ||============================== //

  // Initialize settings from RTK Query data first, then sync from normalized store
  useEffect(() => {
    // First priority: Use RTK Query data if available
    if (queryData && !queryLoading) {
      if (queryData.project && queryData.settings) {
        const initialState = createInitialState({
          projectId: queryData.project.id,
          title: queryData.project.title,
          summary: queryData.project.summary,
          trainingRecipientId: queryData.project.trainingRecipientId,
          ...queryData.settings,
          projectInstructors: queryData.projectInstructors || [],
          projectTopics: queryData.projectTopics || [],
          projectCurriculums: queryData.projectCurriculums || []
        });
        setLocalSettings(initialState);
        setHasChanges(false);
      }
    }
    // Second priority: Use normalized settings from store
    else if (normalizedSettings) {
      const initialState = createInitialState({
        ...normalizedSettings,
        // Ensure we have the schedule data
        startDate: normalizedSettings.startDate || projectSchedule?.startDate,
        endDate: normalizedSettings.endDate || projectSchedule?.endDate,
        startOfDayTime: normalizedSettings.startOfDayTime || projectSchedule?.startOfDayTime,
        endOfDayTime: normalizedSettings.endOfDayTime || projectSchedule?.endOfDayTime,
        lunchTime: normalizedSettings.lunchTime || projectSchedule?.lunchTime,
        workingDays: normalizedSettings.workingDays || projectSchedule?.workingDays || [],
        timezone: normalizedSettings.timezone || projectSchedule?.timezone
      });
      setLocalSettings(initialState);
      setHasChanges(false);
    }
  }, [queryData, queryLoading, normalizedSettings, projectSchedule]);

  // Track changes
  useEffect(() => {
    const changed = hasSettingsChanged(localSettings, normalizedSettings);
    setHasChanges(changed);
  }, [localSettings, normalizedSettings]);

  // ==============================|| FIELD UPDATES ||============================== //

  const updateField = useCallback((field, value) => {
    setLocalSettings(prevState => ({
      ...prevState,
      [field]: value
    }));
    setLocalError(null); // Clear error on edit
  }, []);

  const toggleWorkingDay = useCallback((day) => {
    setLocalSettings(prevState => ({
      ...prevState,
      workingDays: prevState.workingDays.includes(day)
        ? prevState.workingDays.filter(d => d !== day)
        : [...prevState.workingDays, day]
    }));
    setLocalError(null);
  }, []);

  // ==============================|| SAVE OPERATIONS ||============================== //

  const saveSettings = useCallback(async () => {
    if (!projectId) {
      setLocalError('No project ID available');
      return false;
    }

    // Validate settings
    const validation = validateSettings(localSettings);
    if (!validation.isValid) {
      setLocalError(validation.errors.join(', '));
      dispatch(openSnackbar({
        open: true,
        message: validation.errors.join(', '),
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return false;
    }

    try {
      const settingsData = prepareSettingsForSubmission(localSettings);

      // Use semantic command for schedule updates
      const result = await dispatch(settingsCommands.updateSchedule({
        projectId,
        ...settingsData
      }));

      if (result.type.endsWith('/fulfilled')) {
        setHasChanges(false);
        setLocalError(null);
        return true;
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      const errorMessage = error.message || NOTIFICATION_MESSAGES.SAVE_ERROR;
      setLocalError(errorMessage);
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return false;
    }
  }, [projectId, localSettings, dispatch]);

  // ==============================|| PROJECT INFO UPDATES ||============================== //

  const updateProjectInfo = useCallback(async (updates) => {
    if (!projectId) {
      setLocalError('No project ID available');
      return false;
    }

    try {
      const result = await dispatch(settingsCommands.updateProjectInfo({
        projectId,
        ...updates
      }));

      if (result.type.endsWith('/fulfilled')) {
        setLocalError(null);
        return true;
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating project info:', error);
      const errorMessage = error.message || 'Failed to update project information';
      setLocalError(errorMessage);
      return false;
    }
  }, [projectId, dispatch]);

  // ==============================|| INSTRUCTOR MANAGEMENT ||============================== //

  const addInstructor = useCallback(async (instructorId) => {
    if (!projectId) return false;

    try {
      const result = await dispatch(settingsCommands.addInstructor({
        projectId,
        instructorId
      }));
      return result.type.endsWith('/fulfilled');
    } catch (error) {
      console.error('Error adding instructor:', error);
      return false;
    }
  }, [projectId, dispatch]);

  const removeInstructor = useCallback(async (instructorId) => {
    if (!projectId) return false;

    try {
      const result = await dispatch(settingsCommands.removeInstructor({
        projectId,
        instructorId
      }));
      return result.type.endsWith('/fulfilled');
    } catch (error) {
      console.error('Error removing instructor:', error);
      return false;
    }
  }, [projectId, dispatch]);

  // ==============================|| TOPIC & CURRICULUM MANAGEMENT ||============================== //

  const updateTopics = useCallback(async (topicIds) => {
    if (!projectId) return false;

    try {
      const result = await dispatch(settingsCommands.updateProjectTopics({
        projectId,
        topicIds
      }));
      return result.type.endsWith('/fulfilled');
    } catch (error) {
      console.error('Error updating topics:', error);
      return false;
    }
  }, [projectId, dispatch]);

  const updateCurriculums = useCallback(async (curriculumIds) => {
    if (!projectId) return false;

    try {
      const result = await dispatch(settingsCommands.updateProjectCurriculums({
        projectId,
        curriculumIds
      }));
      return result.type.endsWith('/fulfilled');
    } catch (error) {
      console.error('Error updating curriculums:', error);
      return false;
    }
  }, [projectId, dispatch]);

  // ==============================|| UTILITY FUNCTIONS ||============================== //

  const cancelChanges = useCallback(() => {
    if (normalizedSettings) {
      const initialState = createInitialState(normalizedSettings);
      setLocalSettings(initialState);
      setHasChanges(false);
      setLocalError(null);
    }

    dispatch(openSnackbar({
      open: true,
      message: NOTIFICATION_MESSAGES.CANCEL_SUCCESS,
      variant: 'alert',
      alert: { color: 'info' }
    }));
  }, [normalizedSettings, dispatch]);

  const retryLoadSettings = useCallback(() => {
    setLocalError(null);
    refetch();
  }, [refetch]);

  // ==============================|| COMPUTED VALUES ||============================== //

  const isLoading = queryLoading || storeLoading;
  const isSaving = isUpdating || isUpdatingProject;

  // Filter out the "condition callback" error - this occurs when query is skipped due to missing projectId
  // It's not a real error, just RTK Query indicating the query was intentionally skipped
  const queryErrorMessage = queryError?.message;
  const isQuerySkipError = queryErrorMessage?.includes('condition callback returning false');
  const isStoreSkipError = storeError?.includes?.('condition callback returning false');
  const filteredQueryError = isQuerySkipError ? null : queryErrorMessage;
  const filteredStoreError = isStoreSkipError ? null : storeError;
  const error = localError || filteredQueryError || filteredStoreError;

  // Use query data directly for instructors/topics/curriculums if available
  const actualProjectInstructors = queryData?.projectInstructors || projectInstructors || [];
  const actualProjectTopics = queryData?.projectTopics || projectTopics || [];
  const actualProjectCurriculums = queryData?.projectCurriculums || projectCurriculums || [];

  // ==============================|| RETURN INTERFACE ||============================== //

  return {
    // State
    settings: localSettings,
    hasChanges,
    loading: isLoading,
    saving: isSaving,
    fetching: isFetching,
    error,

    // Normalized data (with fallback to query data)
    projectSchedule: queryData?.settings || projectSchedule,
    projectInstructors: actualProjectInstructors,
    projectTopics: actualProjectTopics,
    projectCurriculums: actualProjectCurriculums,

    // Raw query data (for debugging)
    queryData,

    // Field operations
    updateField,
    toggleWorkingDay,

    // Save operations
    saveSettings,
    updateProjectInfo,

    // Instructor operations
    addInstructor,
    removeInstructor,

    // Topic/Curriculum operations
    updateTopics,
    updateCurriculums,

    // Utility operations
    cancelChanges,
    retryLoadSettings,
    refetch
  };
};

// Export as default for convenience
export default useProjectSettings;