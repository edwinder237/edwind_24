import React, { useState, useCallback, useMemo } from 'react';
import { Grid, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSelector, useDispatch } from 'store';
import { updateProject, getSingleProject } from 'store/reducers/projects';
import { openSnackbar } from 'store/reducers/snackbar';

// Components
import {
  SettingsSidebar,
  SettingsContent,
  SettingsActions,
  LoadingSpinner,
  ErrorAlert
} from './components';

// Hooks
import { useProjectSettings } from './hooks/useProjectSettings';

const TabSettings = React.memo(() => {
  const dispatch = useDispatch();
  const { singleProject: project, projectSettings } = useSelector((state) => state.projects);
  const [activeCategory, setActiveCategory] = useState('information');
  
  const {
    settings,
    hasChanges,
    saving,
    loading,
    error,
    updateField,
    toggleWorkingDay,
    saveSettings,
    cancelChanges,
    retryLoadSettings
  } = useProjectSettings(project?.id);

  // Optimized update handlers with useCallback for performance
  const handleUpdateBackgroundImage = useCallback(async (backgroundImg) => {
    if (!project?.id) return;
    
    const result = await dispatch(updateProject({
      id: project.id,
      backgroundImg: backgroundImg || ""
    }));
    
    if (result.success) {
      dispatch(openSnackbar({
        open: true,
        message: 'Background image updated successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));
    } else {
      throw new Error(result.message || 'Failed to update background image');
    }
  }, [dispatch, project?.id]);

  const handleUpdateTitle = useCallback(async (newTitle) => {
    if (!project?.id) return;
    
    const result = await dispatch(updateProject({
      id: project.id,
      title: newTitle
    }));
    
    if (result.success) {
      dispatch(openSnackbar({
        open: true,
        message: 'Title updated successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));
    } else {
      throw new Error(result.message || 'Failed to update title');
    }
  }, [dispatch, project?.id]);


  const handleUpdateLocation = useCallback(async (locationData) => {
    if (!project?.id) return;
    
    // Parse location data and extract image URL
    let imageUrl = null;
    try {
      const parsedLocation = typeof locationData === 'string' 
        ? JSON.parse(locationData) 
        : locationData;
      imageUrl = parsedLocation?.imageUrl || null;
    } catch (error) {
      console.error('Error parsing location data:', error);
    }
    
    // Update both location and background image if available
    const updateData = {
      id: project.id,
      location: locationData,
      ...(imageUrl && { backgroundImg: imageUrl })
    };
    
    const result = await dispatch(updateProject(updateData));
    
    if (result.success) {
      // Refetch project to sync UI immediately
      await dispatch(getSingleProject(project.id));
      
      dispatch(openSnackbar({
        open: true,
        message: 'Photo updated successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));
    } else {
      throw new Error(result.message || 'Failed to update location');
    }
  }, [dispatch, project?.id]);

  const handleUpdateTrainingRecipient = useCallback(async (recipientId) => {
    if (!project?.id) return;
    
    const result = await dispatch(updateProject({
      id: project.id,
      trainingRecipientId: recipientId
    }));
    
    if (result.success) {
      dispatch(openSnackbar({
        open: true,
        message: 'Training recipient updated successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));
    } else {
      throw new Error(result.message || 'Failed to update training recipient');
    }
  }, [dispatch, project?.id]);

  // Memoize handlers to prevent unnecessary re-renders
  const handlers = useMemo(() => ({
    onUpdateField: updateField,
    onToggleWorkingDay: toggleWorkingDay,
    onUpdateTitle: handleUpdateTitle,
    onUpdateBackgroundImage: handleUpdateBackgroundImage,
    onUpdateLocation: handleUpdateLocation,
    onUpdateTrainingRecipient: handleUpdateTrainingRecipient
  }), [updateField, toggleWorkingDay, handleUpdateTitle, handleUpdateBackgroundImage, handleUpdateLocation, handleUpdateTrainingRecipient]);

  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Error state
  if (error) {
    return <ErrorAlert error={error} onRetry={retryLoadSettings} />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1 }}>
          <Grid container spacing={3}>
            {/* Left Sidebar Navigation */}
            <Grid item xs={12} md={4} lg={3}>
              <SettingsSidebar
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </Grid>

            {/* Main Content Area */}
            <Grid item xs={12} md={8} lg={9}>
              <SettingsContent
                activeCategory={activeCategory}
                settings={settings}
                project={project}
                projectSettings={projectSettings}
                {...handlers}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Action Buttons - Only show when there are changes to save */}
        {hasChanges && (
          <Box sx={{ mt: 3, width: '100%' }}>
            <SettingsActions
              hasChanges={hasChanges}
              saving={saving}
              onSave={saveSettings}
              onCancel={cancelChanges}
            />
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
});

TabSettings.displayName = 'TabSettings';

export default TabSettings;