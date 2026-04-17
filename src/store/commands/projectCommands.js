import { createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';
import { openSnackbar } from '../reducers/snackbar';
import { removeProjectById, updateProject } from '../reducers/project/projects';

/**
 * Semantic Commands for Project Management
 *
 * These commands express user intentions rather than technical operations.
 * They provide a more natural API that matches how users think about their actions.
 */

// ==============================|| PROJECT COMMANDS ||============================== //

/**
 * Archive a project (soft delete)
 * Sets projectStatus to 'archived', hiding it from default views.
 * @param {Object} params
 * @param {string} params.projectId - ID of project to archive
 * @param {string} params.projectTitle - Title for notifications
 * @param {string} params.previousStatus - Status before archiving (for undo)
 */
export const archiveProject = createAsyncThunk(
  'project/archive',
  async ({ projectId, projectTitle, previousStatus }, { dispatch, rejectWithValue }) => {
    try {
      const result = await dispatch(updateProject({ id: projectId, projectStatus: 'archived' }));

      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: `"${projectTitle || 'Project'}" has been archived`,
          variant: 'alert',
          alert: { color: 'success' },
          close: false
        }));
        return { success: true, projectId };
      } else {
        throw new Error(result.message || 'Failed to archive project');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to archive project';
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      return rejectWithValue({ error: errorMessage });
    }
  }
);

/**
 * Restore an archived project
 * @param {Object} params
 * @param {string} params.projectId - ID of project to restore
 * @param {string} params.projectTitle - Title for notifications
 * @param {string} params.restoreToStatus - Status to restore to (defaults to 'planning')
 */
export const restoreProject = createAsyncThunk(
  'project/restore',
  async ({ projectId, projectTitle, restoreToStatus = 'planning' }, { dispatch, rejectWithValue }) => {
    try {
      const result = await dispatch(updateProject({ id: projectId, projectStatus: restoreToStatus }));

      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: `"${projectTitle || 'Project'}" has been restored`,
          variant: 'alert',
          alert: { color: 'success' },
          close: false
        }));
        return { success: true, projectId };
      } else {
        throw new Error(result.message || 'Failed to restore project');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to restore project';
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      return rejectWithValue({ error: errorMessage });
    }
  }
);

/**
 * Delete a project (hard delete - admin only)
 * @param {Object} params
 * @param {string} params.projectId - ID of project to delete
 * @param {string} params.projectTitle - Title of project for notifications
 */
export const deleteProject = createAsyncThunk(
  'project/delete',
  async ({ projectId, projectTitle }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'DELETE_PROJECT',
        projectId,
        projectTitle,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.deleteProject.initiate({
        projectId
      })).unwrap();

      // Remove project from Redux store immediately
      dispatch(removeProjectById(projectId));

      dispatch(openSnackbar({
        open: true,
        message: `"${projectTitle || 'Project'}" has been permanently deleted`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command, projectId };

    } catch (error) {
      console.error('[Command] Failed to delete project:', error);

      const errorMessage = error.data?.message || error.message || 'Failed to delete project';
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue({ error: errorMessage, originalError: error });
    }
  }
);

// Export all project commands
export const projectCommands = {
  archiveProject,
  restoreProject,
  deleteProject
};
