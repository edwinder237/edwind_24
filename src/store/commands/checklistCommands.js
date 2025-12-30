/**
 * Checklist Semantic Commands
 *
 * This module contains semantic commands for checklist management operations.
 * Commands represent user intentions and business operations rather than
 * technical implementation details.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';
import { openSnackbar } from '../reducers/snackbar';

// ==============================|| CHECKLIST COMMANDS ||============================== //

/**
 * Complete a checklist item
 * Business Intent: User wants to mark a task as complete
 * Supports both course and curriculum checklist items
 */
export const completeChecklistItem = createAsyncThunk(
  'checklist/completeChecklistItem',
  async ({ projectId, checklistItemId, itemTitle, completedBy, notes, itemType }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'COMPLETE_CHECKLIST_ITEM',
        projectId,
        checklistItemId,
        itemTitle,
        itemType,
        completedBy,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.toggleChecklistItem.initiate({
        projectId,
        checklistItemId,
        completed: true,
        notes,
        completedBy,
        itemType
      })).unwrap();

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: `"${itemTitle}" marked as complete`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };

    } catch (error) {
      console.error('Failed to complete checklist item:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to complete checklist item',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(error.message || 'Failed to complete checklist item');
    }
  }
);

/**
 * Mark a checklist item as incomplete
 * Business Intent: User wants to uncomplete a previously completed task
 * Supports both course and curriculum checklist items
 */
export const uncompleteChecklistItem = createAsyncThunk(
  'checklist/uncompleteChecklistItem',
  async ({ projectId, checklistItemId, itemTitle, completedBy, itemType }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'UNCOMPLETE_CHECKLIST_ITEM',
        projectId,
        checklistItemId,
        itemTitle,
        itemType,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.toggleChecklistItem.initiate({
        projectId,
        checklistItemId,
        completed: false,
        completedBy,
        itemType
      })).unwrap();

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: `"${itemTitle}" marked as incomplete`,
        variant: 'alert',
        alert: { color: 'info' },
        close: false
      }));

      return { ...result, command };

    } catch (error) {
      console.error('Failed to uncomplete checklist item:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to update checklist item',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(error.message || 'Failed to uncomplete checklist item');
    }
  }
);

/**
 * Update or add a note to a checklist item
 * Business Intent: User wants to add context or details to a task
 * Supports both course and curriculum checklist items
 */
export const updateChecklistNote = createAsyncThunk(
  'checklist/updateChecklistNote',
  async ({ projectId, checklistItemId, itemTitle, notes, completed, completedBy, itemType }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'UPDATE_CHECKLIST_NOTE',
        projectId,
        checklistItemId,
        itemType,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.toggleChecklistItem.initiate({
        projectId,
        checklistItemId,
        completed: completed || false,
        notes: notes || null,
        completedBy,
        itemType
      })).unwrap();

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: notes ? 'Note updated successfully' : 'Note removed',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };

    } catch (error) {
      console.error('Failed to update checklist note:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to update note',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(error.message || 'Failed to update note');
    }
  }
);

/**
 * Mark participant's individual task as complete
 * Business Intent: Participant completes their assigned task
 */
export const markParticipantTaskComplete = createAsyncThunk(
  'checklist/markParticipantTaskComplete',
  async ({ participantId, checklistItemId, projectId, participantName, itemTitle, completed }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'MARK_PARTICIPANT_TASK_COMPLETE',
        participantId,
        checklistItemId,
        projectId,
        completed,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.updateParticipantChecklistProgress.initiate({
        participantId,
        checklistItemId,
        projectId,
        completed
      })).unwrap();

      // Show success notification
      const statusText = completed ? 'marked as complete' : 'marked as incomplete';
      const name = participantName || 'Participant';

      dispatch(openSnackbar({
        open: true,
        message: `${name} ${statusText}`,
        variant: 'alert',
        alert: { color: completed ? 'success' : 'info' },
        close: false
      }));

      return { ...result, command };

    } catch (error) {
      console.error('Failed to update participant task:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to update participant task',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(error.message || 'Failed to update participant task');
    }
  }
);

/**
 * Update participant's task note
 * Business Intent: Participant adds notes to their task
 */
export const updateParticipantTaskNote = createAsyncThunk(
  'checklist/updateParticipantTaskNote',
  async ({ participantId, checklistItemId, projectId, notes, completed }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'UPDATE_PARTICIPANT_TASK_NOTE',
        participantId,
        checklistItemId,
        projectId,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.updateParticipantChecklistProgress.initiate({
        participantId,
        checklistItemId,
        projectId,
        completed: completed || false,
        notes
      })).unwrap();

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: notes ? 'Participant note updated' : 'Participant note removed',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };

    } catch (error) {
      console.error('Failed to update participant note:', error);

      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to update participant note',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));

      return rejectWithValue(error.message || 'Failed to update participant note');
    }
  }
);

// Export all commands as a group for convenience
export const checklistCommands = {
  completeChecklistItem,
  uncompleteChecklistItem,
  updateChecklistNote,
  markParticipantTaskComplete,
  updateParticipantTaskNote
};
