import { createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';
import eventBus from '../events/EventBus';
import { DomainEvents, createParticipantEvent } from '../events/domainEvents';
import { openSnackbar } from '../reducers/snackbar';

/**
 * Semantic Commands for Participant Management
 * 
 * These commands express user intentions rather than technical operations.
 * They provide a more natural API that matches how users think about their actions.
 */

// ==============================|| PARTICIPANT COMMANDS ||============================== //

/**
 * Add a new participant to the project
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project to add participant to
 * @param {Object} params.participantData - Participant information
 * @param {string} params.groupId - Optional group to assign participant to
 */
export const addParticipant = createAsyncThunk(
  'participant/add',
  async ({ projectId, participantData, groupId }, { dispatch, rejectWithValue }) => {
    try {
      // Build the command context
      const command = {
        type: 'ADD_PARTICIPANT',
        projectId,
        participant: {
          firstName: participantData.firstName,
          lastName: participantData.lastName,
          email: participantData.email,
          role: participantData.role,
          phone: participantData.phone
        },
        groupId,
        timestamp: new Date().toISOString()
      };

      // Execute the technical operation
      const result = await dispatch(projectApi.endpoints.addParticipant.initiate({
        projectId,
        participantData
      })).unwrap();

      // Show success feedback
      const participantName = participantData.participant 
        ? `${participantData.participant.firstName} ${participantData.participant.lastName}`.trim()
        : 'Participant';
      dispatch(openSnackbar({
        open: true,
        message: `${participantName} has been added to the project`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return {
        ...result,
        command,
        participantName
      };

    } catch (error) {
      console.error('[Command] Failed to add participant:', error);
      
      // Handle specific error cases with proper error message extraction
      let errorMessage = 'Failed to add participant';
      
      // Check if error comes from our API (success: false)
      if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.data?.error) {
        errorMessage = error.data.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Handle specific error types
      if (errorMessage.includes('already enrolled') || errorMessage.includes('already exists')) {
        // Don't show error for duplicate participant - just a warning
        dispatch(openSnackbar({
          open: true,
          message: errorMessage,
          variant: 'alert',
          alert: { color: 'warning' },
          close: false
        }));
      } else {
        // Show actual errors
        dispatch(openSnackbar({
          open: true,
          message: errorMessage,
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        }));
      }

      return rejectWithValue({ error: errorMessage, originalError: error });
    }
  }
);

/**
 * Add multiple participants to the project
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project to add participants to
 * @param {Array} params.participants - Array of participant data
 */
export const addMultipleParticipants = createAsyncThunk(
  'participant/addMultiple',
  async ({ projectId, participants }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'ADD_MULTIPLE_PARTICIPANTS',
        projectId,
        participantsCount: participants.length,
        timestamp: new Date().toISOString()
      };


      const result = await dispatch(projectApi.endpoints.addMultipleParticipants.initiate({
        projectId,
        participants
      })).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: `${participants.length} participants have been added successfully`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };

    } catch (error) {
      console.error('[Command] Failed to add multiple participants:', error);
      
      const errorMessage = error.data?.message || 'Failed to add participants';
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

/**
 * Update participant information
 * @param {Object} params - Command parameters
 * @param {string} params.participantId - ID of participant to update
 * @param {Object} params.updates - Fields to update
 * @param {number} params.projectId - Project ID for event metadata
 */
export const updateParticipant = createAsyncThunk(
  'participant/update',
  async ({ participantId, updates, projectId }, { dispatch, rejectWithValue }) => {
    try {
      // Validate input
      if (!participantId) {
        const errorMessage = 'Invalid participant ID';

        // Publish validation error event
        const isRoleUpdate = 'role' in updates;
        const eventType = isRoleUpdate
          ? DomainEvents.PARTICIPANT_ROLE_UPDATE_FAILED
          : DomainEvents.PARTICIPANT_UPDATE_FAILED;

        eventBus.publish(eventType, {
          participantId,
          error: errorMessage,
          reason: 'missing_participant_id'
        }, {
          source: 'participant-command',
          projectId
        });

        return rejectWithValue({ error: errorMessage, originalError: new Error(errorMessage) });
      }

      const command = {
        type: 'UPDATE_PARTICIPANT',
        participantId,
        updates: Object.keys(updates),
        timestamp: new Date().toISOString()
      };


      const result = await dispatch(projectApi.endpoints.updateParticipant.initiate({
        participantId,
        updates,
        projectId
      })).unwrap();

      // Publish domain event instead of dispatching snackbar
      eventBus.publish(DomainEvents.PARTICIPANT_UPDATED,
        createParticipantEvent(
          result.participant || { id: participantId, ...updates },
          'updated',
          {
            updatedFields: Object.keys(updates)
          }
        ),
        {
          source: 'participant-command',
          projectId,
          correlationId: `participant_update_${participantId}_${Date.now()}`
        }
      );

      // If role was updated, publish role-specific event for detailed tracking
      if ('role' in updates) {
        eventBus.publish(DomainEvents.PARTICIPANT_ROLE_UPDATED, {
          participant: { id: participantId },
          newRole: updates.role?.title,
          roleId: updates.role?.id
        }, {
          source: 'participant-command',
          projectId,
          correlationId: `role_update_${participantId}_${Date.now()}`
        });
      }

      return { ...result, command };

    } catch (error) {
      console.error('[Command] Failed to update participant:', error);

      let errorMessage = 'Failed to update participant';
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message?.includes('email')) {
        errorMessage = 'Email already exists. Please use a different email address.';
      }

      // Publish failure event
      const isRoleUpdate = 'role' in updates;
      const eventType = isRoleUpdate
        ? DomainEvents.PARTICIPANT_ROLE_UPDATE_FAILED
        : DomainEvents.PARTICIPANT_UPDATE_FAILED;

      eventBus.publish(eventType, {
        participantId,
        error: errorMessage,
        updates: Object.keys(updates)
      }, {
        source: 'participant-command',
        projectId
      });

      return rejectWithValue({ error: errorMessage, originalError: error });
    }
  }
);

/**
 * Remove participant from project
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project to remove participant from
 * @param {string} params.participantId - ID of participant to remove
 */
export const removeParticipant = createAsyncThunk(
  'participant/remove',
  async ({ projectId, participantId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'REMOVE_PARTICIPANT',
        projectId,
        participantId,
        timestamp: new Date().toISOString()
      };


      const result = await dispatch(projectApi.endpoints.removeParticipant.initiate({
        projectId,
        participantId
      })).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: 'Participant has been removed successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };

    } catch (error) {
      console.error('[Command] Failed to remove participant:', error);
      
      const errorMessage = error.data?.message || 'Failed to remove participant';
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

/**
 * Remove multiple participants from project
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project to remove participants from
 * @param {Array} params.participantIds - Array of participant IDs to remove
 */
export const removeMultipleParticipants = createAsyncThunk(
  'participant/removeMultiple',
  async ({ projectId, participantIds }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'REMOVE_MULTIPLE_PARTICIPANTS',
        projectId,
        participantIds,
        participantsCount: participantIds.length,
        timestamp: new Date().toISOString()
      };


      const result = await dispatch(projectApi.endpoints.removeMultipleParticipants.initiate({
        projectId,
        participantIds
      })).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: `${participantIds.length} participants have been removed successfully`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };

    } catch (error) {
      console.error('[Command] Failed to remove multiple participants:', error);
      
      const errorMessage = error.data?.message || 'Failed to remove participants';
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

/**
 * Import participants from CSV data
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project to import participants to
 * @param {Array} params.participants - Array of participant data from CSV
 * @param {string} params.importType - Type of import ('csv', 'excel', etc.)
 */
export const importParticipants = createAsyncThunk(
  'participant/import',
  async ({ projectId, participants, importType = 'csv' }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'IMPORT_PARTICIPANTS',
        projectId,
        importType,
        participantsCount: participants.length,
        timestamp: new Date().toISOString()
      };


      const result = await dispatch(projectApi.endpoints.importParticipantsFromCSV.initiate({
        projectId,
        participants
      })).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: `Successfully imported ${participants.length} participants from ${importType.toUpperCase()}`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };

    } catch (error) {
      console.error('[Command] Failed to import participants:', error);
      
      const errorMessage = error.data?.message || `Failed to import participants from ${importType.toUpperCase()}`;
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

/**
 * Assign participant to group
 * @param {Object} params - Command parameters
 * @param {string} params.participantId - ID of participant to assign
 * @param {string} params.groupId - ID of group to assign to
 */
export const assignParticipantToGroup = createAsyncThunk(
  'participant/assignToGroup',
  async ({ participantId, groupId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'ASSIGN_PARTICIPANT_TO_GROUP',
        participantId,
        groupId,
        timestamp: new Date().toISOString()
      };


      const result = await dispatch(projectApi.endpoints.addParticipantToGroup.initiate({
        participantId,
        groupId
      })).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: 'Participant has been assigned to group successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };

    } catch (error) {
      console.error('[Command] Failed to assign participant to group:', error);
      
      const errorMessage = error.data?.message || 'Failed to assign participant to group';
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

// Export all participant commands
export const participantCommands = {
  addParticipant,
  addMultipleParticipants,
  updateParticipant,
  removeParticipant,
  removeMultipleParticipants,
  importParticipants,
  assignParticipantToGroup
};