import { createSlice, createEntityAdapter, createSelector } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';

/**
 * Settings Entity Slice
 *
 * Normalized entity store for project settings using Redux Toolkit's EntityAdapter.
 * This provides a single source of truth for all settings-related data.
 */

// Create entity adapter for normalized settings storage
// Using projectId as the unique identifier
const settingsAdapter = createEntityAdapter({
  selectId: (settings) => settings.projectId,
  // Sort by project ID (though typically we only have one project's settings at a time)
  sortComparer: (a, b) => a.projectId - b.projectId,
});

// Initial state with entity adapter's default structure
const initialState = settingsAdapter.getInitialState({
  // Additional state beyond the normalized entities
  currentProjectId: null,
  lastUpdated: null,
  isLoading: false,
  error: null,
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // ==============================|| BASIC CRUD OPERATIONS ||============================== //

    /**
     * Set settings for a project (upsert)
     */
    settingsUpserted: (state, action) => {
      const { projectId, settings } = action.payload;
      settingsAdapter.upsertOne(state, {
        projectId,
        ...settings,
        lastModified: new Date().toISOString()
      });
      state.currentProjectId = projectId;
      state.lastUpdated = new Date().toISOString();
    },

    /**
     * Update specific fields in settings
     */
    settingsUpdated: (state, action) => {
      const { projectId, updates } = action.payload;
      settingsAdapter.updateOne(state, {
        id: projectId,
        changes: {
          ...updates,
          lastModified: new Date().toISOString()
        }
      });
      state.lastUpdated = new Date().toISOString();
    },

    /**
     * Update project schedule
     */
    scheduleUpdated: (state, action) => {
      const { projectId, schedule } = action.payload;
      const existingSettings = state.entities[projectId];
      if (existingSettings) {
        settingsAdapter.updateOne(state, {
          id: projectId,
          changes: {
            ...schedule,
            lastModified: new Date().toISOString()
          }
        });
      }
      state.lastUpdated = new Date().toISOString();
    },

    /**
     * Update project instructors
     */
    instructorsUpdated: (state, action) => {
      const { projectId, instructors } = action.payload;
      const existingSettings = state.entities[projectId];
      if (existingSettings) {
        settingsAdapter.updateOne(state, {
          id: projectId,
          changes: {
            projectInstructors: instructors,
            lastModified: new Date().toISOString()
          }
        });
      }
    },

    /**
     * Add instructor to project
     */
    instructorAdded: (state, action) => {
      const { projectId, instructor } = action.payload;
      const existingSettings = state.entities[projectId];
      if (existingSettings) {
        const currentInstructors = existingSettings.projectInstructors || [];
        settingsAdapter.updateOne(state, {
          id: projectId,
          changes: {
            projectInstructors: [...currentInstructors, instructor],
            lastModified: new Date().toISOString()
          }
        });
      }
    },

    /**
     * Remove instructor from project
     */
    instructorRemoved: (state, action) => {
      const { projectId, instructorId } = action.payload;
      const existingSettings = state.entities[projectId];
      if (existingSettings) {
        const currentInstructors = existingSettings.projectInstructors || [];
        settingsAdapter.updateOne(state, {
          id: projectId,
          changes: {
            projectInstructors: currentInstructors.filter(i => i.id !== instructorId),
            lastModified: new Date().toISOString()
          }
        });
      }
    },

    /**
     * Update project topics
     */
    topicsUpdated: (state, action) => {
      const { projectId, topics } = action.payload;
      const existingSettings = state.entities[projectId];
      if (existingSettings) {
        settingsAdapter.updateOne(state, {
          id: projectId,
          changes: {
            projectTopics: topics,
            lastModified: new Date().toISOString()
          }
        });
      }
    },

    /**
     * Update project curriculums
     */
    curriculumsUpdated: (state, action) => {
      const { projectId, curriculums } = action.payload;
      const existingSettings = state.entities[projectId];
      if (existingSettings) {
        settingsAdapter.updateOne(state, {
          id: projectId,
          changes: {
            projectCurriculums: curriculums,
            lastModified: new Date().toISOString()
          }
        });
      }
    },

    /**
     * Clear settings for a project
     */
    settingsCleared: (state, action) => {
      const { projectId } = action.payload;
      settingsAdapter.removeOne(state, projectId);
      if (state.currentProjectId === projectId) {
        state.currentProjectId = null;
      }
    },

    /**
     * Set current project
     */
    currentProjectSet: (state, action) => {
      state.currentProjectId = action.payload;
    },

    /**
     * Set loading state
     */
    loadingSet: (state, action) => {
      state.isLoading = action.payload;
    },

    /**
     * Set error state
     */
    errorSet: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    /**
     * Clear all settings
     */
    allSettingsCleared: (state) => {
      settingsAdapter.removeAll(state);
      state.currentProjectId = null;
      state.lastUpdated = null;
      state.error = null;
    }
  },

  // Handle RTK Query actions
  extraReducers: (builder) => {
    // Handle successful settings fetch
    builder.addMatcher(
      projectApi.endpoints.getProjectSettings.matchFulfilled,
      (state, action) => {
        const response = action.payload;
        // console.log('[SettingsSlice] Received RTK Query response'); // Commented out to reduce noise

        if (response && response.project) {
          const projectId = response.project.id;

          // Combine all settings data into normalized entity
          const normalizedSettings = {
            projectId: projectId,
            // Project info
            title: response.project.title,
            summary: response.project.summary,
            status: response.project.status,
            trainingRecipientId: response.project.trainingRecipientId,

            // Schedule settings
            startDate: response.settings?.startDate || response.project.startDate,
            endDate: response.settings?.endDate || response.project.endDate,
            startOfDayTime: response.settings?.startOfDayTime || "09:00",
            endOfDayTime: response.settings?.endOfDayTime || "17:00",
            lunchTime: response.settings?.lunchTime || "12:00-13:00",
            timezone: response.settings?.timezone || "UTC",
            workingDays: response.settings?.workingDays || ["monday", "tuesday", "wednesday", "thursday", "friday"],

            // Available resources
            availableRoles: response.availableRoles || [],
            availableInstructors: response.availableInstructors || [],
            availableTopics: response.availableTopics || [],
            availableCurriculums: response.availableCurriculums || [],
            availableTrainingRecipients: response.availableTrainingRecipients || [],

            // Assigned resources
            projectInstructors: response.projectInstructors || [],
            projectTopics: response.projectTopics || [],
            projectCurriculums: response.projectCurriculums || [],

            // Metadata
            projectInfo: response.project,
            trainingPlans: response.trainingPlans || [],
            summary: response.summary || {},
            counts: response.project.counts || {},
            lastModified: new Date().toISOString()
          };

          // Log summary only when debugging
          // console.log(`[SettingsSlice] Settings loaded: Project ${projectId}, ${normalizedSettings.projectInstructors.length} instructors`);

          settingsAdapter.upsertOne(state, normalizedSettings);
          state.currentProjectId = projectId;
          state.lastUpdated = new Date().toISOString();
          state.isLoading = false;
          state.error = null;
        }
      }
    );

    // Handle successful settings update
    builder.addMatcher(
      projectApi.endpoints.updateProjectSettings.matchFulfilled,
      (state, action) => {
        const { projectId, ...updates } = action.meta.arg.originalArgs;
        settingsAdapter.updateOne(state, {
          id: projectId,
          changes: {
            ...updates,
            lastModified: new Date().toISOString()
          }
        });
        state.lastUpdated = new Date().toISOString();
      }
    );

    // Handle loading state
    builder.addMatcher(
      projectApi.endpoints.getProjectSettings.matchPending,
      (state) => {
        state.isLoading = true;
        state.error = null;
      }
    );

    // Handle errors
    builder.addMatcher(
      projectApi.endpoints.getProjectSettings.matchRejected,
      (state, action) => {
        state.isLoading = false;
        // Filter out the "condition callback" error - this occurs when query is skipped
        // due to missing projectId and is not a real error
        const errorMessage = action.error?.message || '';
        const isSkipError = errorMessage.includes('condition callback returning false');
        state.error = isSkipError ? null : (errorMessage || 'Failed to load settings');
      }
    );
  }
});

// Export actions
export const {
  settingsUpserted,
  settingsUpdated,
  scheduleUpdated,
  instructorsUpdated,
  instructorAdded,
  instructorRemoved,
  topicsUpdated,
  curriculumsUpdated,
  settingsCleared,
  currentProjectSet,
  loadingSet,
  errorSet,
  allSettingsCleared
} = settingsSlice.actions;

// Export reducer
export default settingsSlice.reducer;

// ==============================|| SELECTORS ||============================== //

// Get the selectors from the adapter
const selectors = settingsAdapter.getSelectors((state) => state.settings);

// Basic selectors
export const selectAllSettings = selectors.selectAll;
export const selectSettingsById = selectors.selectById;
export const selectSettingsEntities = selectors.selectEntities;
export const selectSettingsTotal = selectors.selectTotal;

// Custom selectors
export const selectCurrentProjectSettings = (state) => {
  const currentProjectId = state.settings.currentProjectId;
  return currentProjectId ? state.settings.entities[currentProjectId] : null;
};

export const selectProjectSchedule = createSelector(
  [selectCurrentProjectSettings],
  (settings) => {
    if (!settings) return null;
    // Return memoized object
    return {
      startDate: settings.startDate,
      endDate: settings.endDate,
      startOfDayTime: settings.startOfDayTime,
      endOfDayTime: settings.endOfDayTime,
      lunchTime: settings.lunchTime,
      workingDays: settings.workingDays,
      timezone: settings.timezone
    };
  }
);

export const selectProjectInstructors = createSelector(
  [selectCurrentProjectSettings],
  (settings) => settings?.projectInstructors || []
);

export const selectAvailableInstructors = createSelector(
  [selectCurrentProjectSettings],
  (settings) => settings?.availableInstructors || []
);

export const selectProjectTopics = createSelector(
  [selectCurrentProjectSettings],
  (settings) => settings?.projectTopics || []
);

export const selectProjectCurriculums = createSelector(
  [selectCurrentProjectSettings],
  (settings) => settings?.projectCurriculums || []
);

export const selectSettingsLoadingState = (state) => state.settings.isLoading;
export const selectSettingsError = (state) => state.settings.error;
export const selectSettingsLastUpdated = (state) => state.settings.lastUpdated;