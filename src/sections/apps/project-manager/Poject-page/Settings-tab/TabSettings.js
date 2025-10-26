import React, { useState, useCallback, useMemo } from 'react';
import { Grid, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Components
import {
  SettingsSidebar,
  SettingsContent,
  SettingsActions,
  LoadingSpinner,
  ErrorAlert
} from './components';

// CQRS Hook
import { useProjectSettings } from './hooks/useProjectSettings';

/**
 * TabSettings Component
 *
 * Modern CQRS-based Settings tab using RTK Query and domain events.
 *
 * Features:
 * - RTK Query for data fetching and caching
 * - Semantic commands for business operations
 * - Domain events for cross-component communication
 * - Normalized entity store for single source of truth
 * - Optimistic updates for better UX
 *
 * @param {Object} props
 * @param {Object} props.project - Project data (can be passed from parent)
 */
const TabSettings = React.memo(({ project: passedProject }) => {
  const [activeCategory, setActiveCategory] = useState('information');

  // Use CQRS hook for all settings management
  const {
    settings,
    hasChanges,
    saving,
    loading,
    error,
    projectSchedule,
    projectInstructors,
    projectTopics,
    projectCurriculums,
    updateField,
    toggleWorkingDay,
    saveSettings,
    updateProjectInfo,
    addInstructor,
    removeInstructor,
    updateTopics,
    updateCurriculums,
    cancelChanges,
    retryLoadSettings
  } = useProjectSettings(passedProject?.id);

  // Handlers for project info updates
  const handleUpdateTitle = useCallback(async (newTitle) => {
    return updateProjectInfo({ title: newTitle });
  }, [updateProjectInfo]);

  const handleUpdateSummary = useCallback(async (newSummary) => {
    return updateProjectInfo({ summary: newSummary });
  }, [updateProjectInfo]);

  const handleUpdateTrainingRecipient = useCallback(async (recipientId) => {
    return updateProjectInfo({ trainingRecipientId: recipientId });
  }, [updateProjectInfo]);

  // Instructor management handlers
  const handleAddInstructor = useCallback(async (instructorId) => {
    return addInstructor(instructorId);
  }, [addInstructor]);

  const handleRemoveInstructor = useCallback(async (instructorId) => {
    return removeInstructor(instructorId);
  }, [removeInstructor]);

  // Topics and curriculums handlers
  const handleUpdateTopics = useCallback(async (topicIds) => {
    return updateTopics(topicIds);
  }, [updateTopics]);

  const handleUpdateCurriculums = useCallback(async (curriculumIds) => {
    return updateCurriculums(curriculumIds);
  }, [updateCurriculums]);

  // Memoize handlers to prevent unnecessary re-renders
  const handlers = useMemo(() => ({
    onUpdateField: updateField,
    onToggleWorkingDay: toggleWorkingDay,
    onUpdateTitle: handleUpdateTitle,
    onUpdateSummary: handleUpdateSummary,
    onUpdateTrainingRecipient: handleUpdateTrainingRecipient,
    onAddInstructor: handleAddInstructor,
    onRemoveInstructor: handleRemoveInstructor,
    onUpdateTopics: handleUpdateTopics,
    onUpdateCurriculums: handleUpdateCurriculums
  }), [
    updateField,
    toggleWorkingDay,
    handleUpdateTitle,
    handleUpdateSummary,
    handleUpdateTrainingRecipient,
    handleAddInstructor,
    handleRemoveInstructor,
    handleUpdateTopics,
    handleUpdateCurriculums
  ]);

  // Combined project data for the content component
  const projectData = useMemo(() => ({
    ...passedProject,
    ...settings,
    projectInstructors,
    projectTopics,
    projectCurriculums
  }), [passedProject, settings, projectInstructors, projectTopics, projectCurriculums]);

  // Settings data for the content component
  const projectSettings = useMemo(() => ({
    schedule: projectSchedule,
    instructors: projectInstructors,
    topics: projectTopics,
    curriculums: projectCurriculums,
    ...settings
  }), [projectSchedule, projectInstructors, projectTopics, projectCurriculums, settings]);

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
                project={projectData}
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