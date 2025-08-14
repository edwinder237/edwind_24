import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'store';
import { getProjectSettings, updateProjectSettings } from 'store/reducers/projects';
import { openSnackbar } from 'store/reducers/snackbar';
import { 
  createInitialState, 
  hasSettingsChanged, 
  prepareSettingsForSubmission,
  validateSettings 
} from '../utils/settingsHelpers';
import { NOTIFICATION_MESSAGES } from '../utils/constants';

export const useProjectSettings = (projectId) => {
  const dispatch = useDispatch();
  const { projectSettings, settingsLoading, error } = useSelector((state) => state.projects);
  
  const [state, setState] = useState(() => createInitialState(null));
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load project settings when projectId changes
  useEffect(() => {
    if (projectId) {
      dispatch(getProjectSettings(projectId));
    }
  }, [projectId, dispatch]);

  // Initialize form state when projectSettings loads
  useEffect(() => {
    if (projectSettings) {
      const initialState = createInitialState(projectSettings);
      setState(initialState);
      setHasChanges(false);
    }
  }, [projectSettings]);

  // Track changes whenever state changes
  useEffect(() => {
    const changed = hasSettingsChanged(state, projectSettings);
    setHasChanges(changed);
  }, [state, projectSettings]);

  // Update individual fields
  const updateField = useCallback((field, value) => {
    setState(prevState => ({
      ...prevState,
      [field]: value
    }));
  }, []);

  // Toggle working days
  const toggleWorkingDay = useCallback((day) => {
    setState(prevState => ({
      ...prevState,
      workingDays: prevState.workingDays.includes(day)
        ? prevState.workingDays.filter(d => d !== day)
        : [...prevState.workingDays, day]
    }));
  }, []);

  // Save settings
  const saveSettings = useCallback(async () => {
    if (!projectId) {
      dispatch(openSnackbar({
        open: true,
        message: NOTIFICATION_MESSAGES.NO_PROJECT,
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return false;
    }

    // Validate settings
    const validation = validateSettings(state);
    if (!validation.isValid) {
      dispatch(openSnackbar({
        open: true,
        message: validation.errors.join(', '),
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return false;
    }

    try {
      setSaving(true);
      const settingsData = prepareSettingsForSubmission(state);
      const result = await dispatch(updateProjectSettings(projectId, settingsData));

      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: NOTIFICATION_MESSAGES.SAVE_SUCCESS,
          variant: 'alert',
          alert: { color: 'success' }
        }));
        setHasChanges(false);
        return true;
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating project settings:', error);
      dispatch(openSnackbar({
        open: true,
        message: NOTIFICATION_MESSAGES.SAVE_ERROR,
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return false;
    } finally {
      setSaving(false);
    }
  }, [projectId, state, dispatch]);

  // Cancel changes
  const cancelChanges = useCallback(() => {
    if (projectSettings) {
      const initialState = createInitialState(projectSettings);
      setState(initialState);
      setHasChanges(false);
    }
    
    dispatch(openSnackbar({
      open: true,
      message: NOTIFICATION_MESSAGES.CANCEL_SUCCESS,
      variant: 'alert',
      alert: { color: 'info' }
    }));
  }, [projectSettings, dispatch]);

  // Retry loading settings
  const retryLoadSettings = useCallback(() => {
    if (projectId) {
      dispatch(getProjectSettings(projectId));
    }
  }, [projectId, dispatch]);

  return {
    // State
    settings: state,
    hasChanges,
    saving,
    loading: settingsLoading,
    error,
    
    // Actions
    updateField,
    toggleWorkingDay,
    saveSettings,
    cancelChanges,
    retryLoadSettings
  };
};