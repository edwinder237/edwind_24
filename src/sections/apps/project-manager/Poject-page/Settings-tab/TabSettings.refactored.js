import React from 'react';
import { Grid } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSelector } from 'store';

// Components
import {
  ProjectScheduleCard,
  ProjectInfoCard,
  SettingsActions,
  LoadingSpinner,
  ErrorAlert
} from './components';
import ProjectInstructors from './ProjectInstructors';

// Hooks
import { useProjectSettings } from './hooks/useProjectSettings';

// ==============================|| PROJECT SETTINGS - REFACTORED ||============================== //

const TabSettings = React.memo(() => {
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
          <ProjectInfoCard
            project={project}
            projectSettings={projectSettings}
          />
        </Grid>

        {/* Project Instructors */}
        <Grid item xs={12} lg={6}>
          <ProjectInstructors projectId={project?.id} />
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