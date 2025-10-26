import { createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';
import { openSnackbar } from '../reducers/snackbar';
import eventBus from '../events/EventBus';
import { DomainEvents } from '../events/domainEvents';

/**
 * Semantic Commands for Settings Management
 *
 * These commands express user intentions for project settings operations.
 * They provide a semantic API that matches how users think about their actions.
 */

// ==============================|| SETTINGS COMMANDS ||============================== //

/**
 * Update project schedule settings
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project ID
 * @param {string} params.startDate - Project start date
 * @param {string} params.endDate - Project end date
 * @param {string} params.startOfDayTime - Daily start time
 * @param {string} params.endOfDayTime - Daily end time
 * @param {string} params.lunchTime - Lunch break time
 * @param {array} params.workingDays - Array of working days
 * @param {string} params.timezone - Project timezone
 */
export const updateSchedule = createAsyncThunk(
  'settings/updateSchedule',
  async ({ projectId, ...scheduleData }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'UPDATE_SCHEDULE',
        projectId,
        schedule: scheduleData,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Updating project schedule:', command);

      const result = await dispatch(projectApi.endpoints.updateProjectSettings.initiate({
        projectId,
        ...scheduleData,
        updatedBy: 'user'
      })).unwrap();

      // Publish domain event for cross-component updates
      eventBus.publish(DomainEvents.PROJECT_SCHEDULE_UPDATED, {
        projectId,
        scheduleChanges: scheduleData,
        affectedEvents: result.affectedEvents || [],
        command
      });

      dispatch(openSnackbar({
        open: true,
        message: 'Project schedule updated successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return {
        ...result,
        command
      };

    } catch (error) {
      console.error('[Command] Failed to update schedule:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.data?.message || 'Failed to update project schedule',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue({ error: error.data?.message || error.message });
    }
  }
);

/**
 * Update project information
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project ID
 * @param {string} params.title - Project title
 * @param {string} params.description - Project description
 * @param {string} params.trainingRecipientId - Training recipient ID
 */
export const updateProjectInfo = createAsyncThunk(
  'settings/updateProjectInfo',
  async ({ projectId, ...infoData }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'UPDATE_PROJECT_INFO',
        projectId,
        info: infoData,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Updating project info:', command);

      // Use updateProject mutation for title and training recipient
      const result = await dispatch(projectApi.endpoints.updateProject.initiate({
        projectId,
        ...infoData
      })).unwrap();

      // Publish domain event
      eventBus.publish(DomainEvents.PROJECT_INFO_UPDATED, {
        projectId,
        updates: infoData,
        result
      });

      dispatch(openSnackbar({
        open: true,
        message: 'Project information updated successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return {
        ...result,
        command
      };

    } catch (error) {
      console.error('[Command] Failed to update project info:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.data?.message || 'Failed to update project information',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue({ error: error.data?.message || error.message });
    }
  }
);

/**
 * Add instructor to project
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project ID
 * @param {string} params.instructorId - Instructor ID to add
 */
export const addInstructor = createAsyncThunk(
  'settings/addInstructor',
  async ({ projectId, instructorId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'ADD_INSTRUCTOR',
        projectId,
        instructorId,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Adding instructor to project:', command);

      // TODO: Call appropriate API endpoint when available
      // For now, using a placeholder that will need to be implemented
      const result = { success: true, instructorId };

      // Publish domain event
      eventBus.publish(DomainEvents.INSTRUCTOR_ADDED_TO_PROJECT, {
        projectId,
        instructor: { id: instructorId },
        result
      });

      dispatch(openSnackbar({
        open: true,
        message: 'Instructor added successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return {
        ...result,
        command
      };

    } catch (error) {
      console.error('[Command] Failed to add instructor:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.data?.message || 'Failed to add instructor',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue({ error: error.data?.message || error.message });
    }
  }
);

/**
 * Remove instructor from project
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project ID
 * @param {string} params.instructorId - Instructor ID to remove
 */
export const removeInstructor = createAsyncThunk(
  'settings/removeInstructor',
  async ({ projectId, instructorId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'REMOVE_INSTRUCTOR',
        projectId,
        instructorId,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Removing instructor from project:', command);

      // TODO: Call appropriate API endpoint when available
      const result = { success: true, instructorId };

      // Publish domain event
      eventBus.publish(DomainEvents.INSTRUCTOR_REMOVED_FROM_PROJECT, {
        projectId,
        instructor: { id: instructorId },
        affectedEvents: result.affectedEvents || [],
        result
      });

      dispatch(openSnackbar({
        open: true,
        message: 'Instructor removed successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return {
        ...result,
        command
      };

    } catch (error) {
      console.error('[Command] Failed to remove instructor:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.data?.message || 'Failed to remove instructor',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue({ error: error.data?.message || error.message });
    }
  }
);

/**
 * Update project topics
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project ID
 * @param {array} params.topicIds - Array of topic IDs
 */
export const updateProjectTopics = createAsyncThunk(
  'settings/updateProjectTopics',
  async ({ projectId, topicIds }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'UPDATE_PROJECT_TOPICS',
        projectId,
        topicIds,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Updating project topics:', command);

      // TODO: Call appropriate API endpoint when available
      const result = { success: true, topicIds };

      // Publish domain event
      eventBus.publish(DomainEvents.PROJECT_TOPICS_UPDATED, {
        projectId,
        topics: topicIds,
        result
      });

      dispatch(openSnackbar({
        open: true,
        message: 'Project topics updated successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return {
        ...result,
        command
      };

    } catch (error) {
      console.error('[Command] Failed to update project topics:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.data?.message || 'Failed to update project topics',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue({ error: error.data?.message || error.message });
    }
  }
);

/**
 * Update project curriculums
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project ID
 * @param {array} params.curriculumIds - Array of curriculum IDs
 */
export const updateProjectCurriculums = createAsyncThunk(
  'settings/updateProjectCurriculums',
  async ({ projectId, curriculumIds }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'UPDATE_PROJECT_CURRICULUMS',
        projectId,
        curriculumIds,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Updating project curriculums:', command);

      // TODO: Call appropriate API endpoint when available
      const result = { success: true, curriculumIds };

      // Publish domain event
      eventBus.publish(DomainEvents.PROJECT_CURRICULUMS_UPDATED, {
        projectId,
        curriculums: curriculumIds,
        result
      });

      dispatch(openSnackbar({
        open: true,
        message: 'Project curriculums updated successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return {
        ...result,
        command
      };

    } catch (error) {
      console.error('[Command] Failed to update project curriculums:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.data?.message || 'Failed to update project curriculums',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue({ error: error.data?.message || error.message });
    }
  }
);

/**
 * Convenience object for grouped access to settings commands
 */
export const settingsCommands = {
  updateSchedule,
  updateProjectInfo,
  addInstructor,
  removeInstructor,
  updateProjectTopics,
  updateProjectCurriculums
};

// Export as default for backward compatibility
export default settingsCommands;