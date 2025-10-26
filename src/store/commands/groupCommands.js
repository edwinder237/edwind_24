import { createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';
import { openSnackbar } from '../reducers/snackbar';
import eventBus from '../events/EventBus';
import { DomainEvents } from '../events/domainEvents';

/**
 * Semantic Commands for Group Management
 * 
 * These commands express user intentions rather than technical operations.
 * They provide a more natural API that matches how users think about their actions.
 */

// ==============================|| GROUP COMMANDS ||============================== //

/**
 * Add a new group to the project
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project to add group to
 * @param {Object} params.groupData - Group information
 */
export const addGroup = createAsyncThunk(
  'group/add',
  async ({ projectId, groupData }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'ADD_GROUP',
        projectId,
        group: {
          groupName: groupData.groupName,
          description: groupData.description,
          chipColor: groupData.chipColor,
          maxSize: groupData.maxSize
        },
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Adding group to project:', command);
      console.log('[Command] Calling API with:', { projectId, groupData });

      const result = await dispatch(projectApi.endpoints.addGroup.initiate({
        projectId,
        groupData
      })).unwrap();

      console.log('[Command] API call successful, result:', result);

      const groupName = groupData.groupName || 'Group';
      dispatch(openSnackbar({
        open: true,
        message: `${groupName} has been added to the project`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return {
        ...result,
        command,
        groupName
      };

    } catch (error) {
      console.error('[Command] Failed to add group:', error);
      console.error('[Command] Error details:', {
        data: error.data,
        message: error.message,
        status: error.status,
        error: error.error
      });

      let errorMessage = 'Failed to add group';
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.data?.error) {
        errorMessage = error.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.message?.includes('exists')) {
        errorMessage = 'A group with this name already exists';
      }

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
 * Update group information
 * @param {Object} params - Command parameters
 * @param {string} params.groupId - ID of group to update
 * @param {Object} params.updates - Fields to update
 * @param {string} params.projectId - Project ID for context
 */
export const updateGroup = createAsyncThunk(
  'group/update',
  async ({ groupId, updates, projectId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'UPDATE_GROUP',
        groupId,
        updates: Object.keys(updates),
        projectId,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Updating group:', command);

      const result = await dispatch(projectApi.endpoints.updateGroup.initiate({
        groupId,
        updates,
        projectId
      })).unwrap();

      const groupName = updates.groupName || 'Group';

      dispatch(openSnackbar({
        open: true,
        message: `${groupName} has been updated successfully`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command, groupName };

    } catch (error) {
      console.error('[Command] Failed to update group:', error);
      
      let errorMessage = 'Failed to update group';
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message?.includes('name')) {
        errorMessage = 'Group name already exists. Please use a different name.';
      }

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
 * Remove group from project
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project to remove group from
 * @param {string} params.groupId - ID of group to remove
 * @param {string} params.groupName - Name of group for notifications
 */
export const removeGroup = createAsyncThunk(
  'group/remove',
  async ({ projectId, groupId, groupName }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'REMOVE_GROUP',
        projectId,
        groupId,
        groupName,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Removing group from project:', command);

      const result = await dispatch(projectApi.endpoints.removeGroup.initiate({
        projectId,
        groupId
      })).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: `${groupName || 'Group'} has been removed successfully`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };

    } catch (error) {
      console.error('[Command] Failed to remove group:', error);
      
      const errorMessage = error.data?.message || 'Failed to remove group';
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
 * Add participant to group
 * @param {Object} params - Command parameters
 * @param {string} params.groupId - ID of group to add participant to
 * @param {string} params.participantId - ID of participant to add
 * @param {string} params.projectId - Project ID for event metadata
 */
export const addParticipantToGroup = createAsyncThunk(
  'group/addParticipant',
  async ({ groupId, participantId, projectId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'ADD_PARTICIPANT_TO_GROUP',
        groupId,
        participantId,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Adding participant to group:', command);

      const result = await dispatch(projectApi.endpoints.addParticipantToGroup.initiate({
        groupId,
        participantId
      })).unwrap();

      // Publish domain event with cascade information
      eventBus.publish(DomainEvents.PARTICIPANT_ADDED_TO_GROUP, {
        participant: { id: participantId },
        group: { id: groupId },
        action: 'added',
        cascadeInfo: {
          affectedEvents: result.affectedEvents || [],
          addedToEventCount: result.affectedEvents?.length || 0
        }
      }, {
        source: 'group-command',
        projectId,
        correlationId: `group_add_${participantId}_${Date.now()}`
      });

      // If cascade occurred, publish additional event for cross-domain communication
      if (result.affectedEvents && result.affectedEvents.length > 0) {
        eventBus.publish('GROUP_PARTICIPANT_CASCADED_TO_EVENTS', {
          participantId,
          groupId,
          eventIds: result.affectedEvents,
          action: 'added'
        }, {
          source: 'group-cascade',
          projectId,
          correlationId: `group_cascade_${participantId}_${Date.now()}`
        });
      }

      return { ...result, command };

    } catch (error) {
      console.error('[Command] Failed to add participant to group:', error);

      const errorMessage = error.data?.message || 'Failed to add participant to group';

      // Publish failure event
      eventBus.publish(DomainEvents.PARTICIPANT_ADD_TO_GROUP_FAILED, {
        participantId,
        groupId,
        error: errorMessage
      }, {
        source: 'group-command',
        projectId
      });

      return rejectWithValue({ error: errorMessage, originalError: error });
    }
  }
);

/**
 * Remove participant from group
 * @param {Object} params - Command parameters
 * @param {string} params.groupId - ID of group to remove participant from
 * @param {string} params.participantId - ID of participant to remove
 * @param {string} params.projectId - Project ID for event metadata
 */
export const removeParticipantFromGroup = createAsyncThunk(
  'group/removeParticipant',
  async ({ groupId, participantId, projectId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'REMOVE_PARTICIPANT_FROM_GROUP',
        groupId,
        participantId,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Removing participant from group:', command);

      const result = await dispatch(projectApi.endpoints.removeParticipantFromGroup.initiate({
        groupId,
        participantId
      })).unwrap();

      // Publish domain event with cascade information
      eventBus.publish(DomainEvents.PARTICIPANT_REMOVED_FROM_GROUP, {
        participant: { id: participantId },
        group: { id: groupId },
        action: 'removed',
        cascadeInfo: {
          eventsToRemoveFrom: result.eventsToRemoveFrom || [],
          removedFromEventCount: result.eventsToRemoveFrom?.length || 0
        }
      }, {
        source: 'group-command',
        projectId,
        correlationId: `group_remove_${participantId}_${Date.now()}`
      });

      // If cascade occurred, publish additional event
      if (result.eventsToRemoveFrom && result.eventsToRemoveFrom.length > 0) {
        eventBus.publish('GROUP_PARTICIPANT_CASCADED_TO_EVENTS', {
          participantId,
          groupId,
          eventIds: result.eventsToRemoveFrom,
          action: 'removed'
        }, {
          source: 'group-cascade',
          projectId,
          correlationId: `group_cascade_remove_${participantId}_${Date.now()}`
        });
      }

      return { ...result, command };

    } catch (error) {
      console.error('[Command] Failed to remove participant from group:', error);

      const errorMessage = error.data?.message || 'Failed to remove participant from group';

      // Publish failure event
      eventBus.publish(DomainEvents.PARTICIPANT_REMOVE_FROM_GROUP_FAILED, {
        participantId,
        groupId,
        error: errorMessage
      }, {
        source: 'group-command',
        projectId
      });

      return rejectWithValue({ error: errorMessage, originalError: error });
    }
  }
);

/**
 * Move participant between groups (atomic operation)
 * @param {Object} params - Command parameters
 * @param {string} params.participantId - ID of participant to move
 * @param {string} params.fromGroupId - ID of current group (null if no current group)
 * @param {string} params.toGroupId - ID of target group (null to remove from all groups)
 * @param {string} params.projectId - Project ID for event metadata
 */
export const moveParticipantBetweenGroups = createAsyncThunk(
  'group/moveParticipant',
  async ({ participantId, fromGroupId, toGroupId, projectId }, { dispatch, rejectWithValue }) => {
    try {
      // Validate input
      if (!participantId) {
        const errorMessage = 'Invalid participant ID';

        // Publish validation error event
        eventBus.publish(DomainEvents.PARTICIPANT_MOVE_BETWEEN_GROUPS_FAILED, {
          participantId,
          error: errorMessage,
          reason: 'missing_participant_id'
        }, {
          source: 'group-command',
          projectId
        });

        return rejectWithValue({ error: errorMessage, originalError: new Error(errorMessage) });
      }

      const command = {
        type: 'MOVE_PARTICIPANT_BETWEEN_GROUPS',
        participantId,
        fromGroupId,
        toGroupId,
        projectId,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Moving participant between groups:', command);

      const result = await dispatch(projectApi.endpoints.moveParticipantToGroup.initiate({
        participantId,
        fromGroupId,
        toGroupId,
        projectId
      })).unwrap();

      // Publish domain event with cascade information
      eventBus.publish(DomainEvents.PARTICIPANT_MOVED_BETWEEN_GROUPS, {
        participant: { id: participantId },
        previousGroup: fromGroupId ? { id: fromGroupId } : null,
        newGroup: toGroupId ? { id: toGroupId } : null,
        cascadeInfo: {
          eventsToAddTo: result.eventsToAddTo || [],
          eventsToRemoveFrom: result.eventsToRemoveFrom || [],
          addedToEventCount: result.eventsToAddTo?.length || 0,
          removedFromEventCount: result.eventsToRemoveFrom?.length || 0
        }
      }, {
        source: 'group-command',
        projectId,
        correlationId: `group_move_${participantId}_${Date.now()}`
      });

      // If cascade occurred (either add or remove), publish cascade events
      if ((result.eventsToAddTo && result.eventsToAddTo.length > 0) ||
          (result.eventsToRemoveFrom && result.eventsToRemoveFrom.length > 0)) {

        // Publish add cascade
        if (result.eventsToAddTo && result.eventsToAddTo.length > 0) {
          eventBus.publish('GROUP_PARTICIPANT_CASCADED_TO_EVENTS', {
            participantId,
            groupId: toGroupId,
            eventIds: result.eventsToAddTo,
            action: 'added'
          }, {
            source: 'group-cascade',
            projectId,
            correlationId: `group_cascade_move_add_${participantId}_${Date.now()}`
          });
        }

        // Publish remove cascade
        if (result.eventsToRemoveFrom && result.eventsToRemoveFrom.length > 0) {
          eventBus.publish('GROUP_PARTICIPANT_CASCADED_TO_EVENTS', {
            participantId,
            groupId: fromGroupId,
            eventIds: result.eventsToRemoveFrom,
            action: 'removed'
          }, {
            source: 'group-cascade',
            projectId,
            correlationId: `group_cascade_move_remove_${participantId}_${Date.now()}`
          });
        }
      }

      return { ...result, command };

    } catch (error) {
      console.error('[Command] Failed to move participant between groups:', error);

      const errorMessage = error.data?.message || 'Failed to move participant between groups';

      // Publish failure event
      eventBus.publish(DomainEvents.PARTICIPANT_MOVE_BETWEEN_GROUPS_FAILED, {
        participantId,
        fromGroupId,
        toGroupId,
        error: errorMessage
      }, {
        source: 'group-command',
        projectId
      });

      return rejectWithValue({ error: errorMessage, originalError: error });
    }
  }
);

/**
 * Clear progress cache for improved performance
 * @param {Object} params - Command parameters
 * @param {string} params.projectId - Project to clear cache for
 */
export const clearProgressCache = createAsyncThunk(
  'group/clearProgressCache',
  async ({ projectId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'CLEAR_PROGRESS_CACHE',
        projectId,
        timestamp: new Date().toISOString()
      };

      console.log('[Command] Clearing progress cache:', command);

      const result = await dispatch(projectApi.endpoints.clearProgressCache.initiate(projectId)).unwrap();

      return { ...result, command };

    } catch (error) {
      console.error('[Command] Failed to clear progress cache:', error);

      const errorMessage = error.data?.message || 'Failed to clear progress cache';
      return rejectWithValue({ error: errorMessage, originalError: error });
    }
  }
);

// Export all group commands
export const groupCommands = {
  addGroup,
  updateGroup,
  removeGroup,
  addParticipantToGroup,
  removeParticipantFromGroup,
  moveParticipantBetweenGroups,
  clearProgressCache
};