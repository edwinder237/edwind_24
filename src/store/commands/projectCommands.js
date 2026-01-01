import { createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';
import { openSnackbar } from '../reducers/snackbar';
import { removeProjectById } from '../reducers/project/projects';

/**
 * Semantic Commands for Project Management
 *
 * These commands express user intentions rather than technical operations.
 * They provide a more natural API that matches how users think about their actions.
 */

// ==============================|| PROJECT COMMANDS ||============================== //

/**
 * Delete a project
 * @param {Object} params - Command parameters
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

      console.log('[Command] Deleting project:', command);

      const result = await dispatch(projectApi.endpoints.deleteProject.initiate({
        projectId
      })).unwrap();

      // Remove project from Redux store immediately
      dispatch(removeProjectById(projectId));

      dispatch(openSnackbar({
        open: true,
        message: `"${projectTitle || 'Project'}" has been deleted successfully`,
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
  deleteProject
};
