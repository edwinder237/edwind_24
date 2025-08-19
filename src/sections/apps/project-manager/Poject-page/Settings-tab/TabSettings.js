import React from 'react';
import { Grid } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSelector, useDispatch } from 'store';
import { updateProject } from 'store/reducers/projects';
import { openSnackbar } from 'store/reducers/snackbar';

// Components
import {
  ProjectScheduleCard,
  ProjectInfoCard,
  ProjectCustomizationCard,
  SettingsActions,
  LoadingSpinner,
  ErrorAlert
} from './components';
import ProjectInstructors from './ProjectInstructors';

// Hooks
import { useProjectSettings } from './hooks/useProjectSettings';

// ==============================|| PROJECT SETTINGS - REFACTORED ||============================== //

const TabSettings = React.memo(() => {
  const dispatch = useDispatch();
  const { singleProject: project, projectSettings } = useSelector((state) => state.projects);
  
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

  // Handle background image update
  const handleUpdateBackgroundImage = async (backgroundImg) => {
    if (!project?.id) return;
    
    const updateData = {
      id: project.id,
      backgroundImg: backgroundImg || ""
    };
    
    const result = await dispatch(updateProject(updateData));
    
    if (result.success) {
      dispatch(openSnackbar({
        open: true,
        message: 'Project background image updated successfully.',
        variant: 'alert',
        alert: { color: 'success' }
      }));
    } else {
      throw new Error(result.message || 'Failed to update background image');
    }
  };

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
      <Grid container spacing={3}>
        {/* Project Schedule Settings */}
        <Grid item xs={12} lg={6}>
          <ProjectScheduleCard
            settings={settings}
            onUpdateField={updateField}
            onToggleWorkingDay={toggleWorkingDay}
          />
        </Grid>

        {/* Project Information */}
        <Grid item xs={12} lg={6}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ProjectInfoCard
                project={project}
                projectSettings={projectSettings}
              />
            </Grid>
            {/* Project Customization */}
            <Grid item xs={12}>
              <ProjectCustomizationCard
                project={project}
                onUpdateBackgroundImage={handleUpdateBackgroundImage}
              />
            </Grid>
            {/* Project Instructors */}
            <Grid item xs={12}>
              <ProjectInstructors projectId={project?.id} />
            </Grid>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <SettingsActions
            hasChanges={hasChanges}
            saving={saving}
            onSave={saveSettings}
            onCancel={cancelChanges}
          />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
});

TabSettings.displayName = 'TabSettings';

export default TabSettings;