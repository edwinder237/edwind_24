/**
 * Modernized Groups CRUD Hook using RTK Query
 * 
 * This hook provides CRUD operations for groups using:
 * - RTK Query mutations for API calls
 * - Semantic commands for business logic
 * - Domain events for cross-component communication
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { 
  useAddGroupMutation,
  useUpdateGroupMutation,
  useRemoveGroupMutation,
  useAddParticipantToGroupMutation,
  useRemoveParticipantFromGroupMutation,
  useClearProgressCacheMutation
} from 'store/api/projectApi';
import { groupCommands } from 'store/commands/groupCommands';
import { openSnackbar } from 'store/reducers/snackbar';
import eventBus from 'store/events/EventBus';

export const useGroupsCRUDRTK = ({ data, participants, projectId, onRefresh }) => {
  const dispatch = useDispatch();
  
  // RTK Query mutations
  const [addGroupMutation] = useAddGroupMutation();
  const [updateGroupMutation] = useUpdateGroupMutation();
  const [removeGroupMutation] = useRemoveGroupMutation();
  const [addParticipantToGroupMutation] = useAddParticipantToGroupMutation();
  const [removeParticipantFromGroupMutation] = useRemoveParticipantFromGroupMutation();
  const [clearProgressCacheMutation] = useClearProgressCacheMutation();

  // Helper function for notifications
  const showNotification = useCallback((message, type = 'success') => {
    dispatch(openSnackbar({
      open: true,
      message,
      variant: 'alert',
      alert: { color: type },
      close: false
    }));
  }, [dispatch]);

  // Add group
  const handleAddGroup = useCallback(async (newGroup) => {
    try {
      // Publish domain event
      eventBus.publish('group.add.started', {
        projectId,
        groupData: {
          groupName: newGroup.groupName,
          description: newGroup.description
        },
        timestamp: new Date().toISOString()
      });

      // Use semantic command (which internally calls the RTK Query mutation)
      const result = await dispatch(groupCommands.addGroup({
        projectId,
        groupData: newGroup
      })).unwrap();

      // Extract group name for event
      const groupName = newGroup.groupName || 'Group';

      // Publish success event
      eventBus.publish('group.add.completed', {
        projectId,
        groupId: result.groupId,
        groupName,
        timestamp: new Date().toISOString()
      });

      // Refresh data if callback provided
      await onRefresh?.();
      
    } catch (error) {
      console.error('Failed to add group:', error);
      
      // Publish error event
      eventBus.publish('group.add.failed', {
        projectId,
        error: error.message,
        groupData: newGroup,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [projectId, dispatch, onRefresh]);

  // Update group
  const handleUpdateGroup = useCallback(async (groupId, updates) => {
    try {
      // Publish domain event
      eventBus.publish('group.update.started', {
        projectId,
        groupId,
        updates: Object.keys(updates),
        timestamp: new Date().toISOString()
      });

      // Use semantic command (which internally calls the RTK Query mutation)
      const result = await dispatch(groupCommands.updateGroup({
        groupId,
        updates,
        projectId
      })).unwrap();

      const groupName = updates.groupName || 'Group';

      // Publish success event
      eventBus.publish('group.update.completed', {
        projectId,
        groupId,
        groupName,
        timestamp: new Date().toISOString()
      });
      
      await onRefresh?.();
      
    } catch (error) {
      console.error('Failed to update group:', error);

      // Publish error event
      eventBus.publish('group.update.failed', {
        projectId,
        groupId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [projectId, dispatch, onRefresh]);

  // Remove group
  const handleRemoveGroup = useCallback(async (groupId) => {
    try {
      const groupToDelete = data.find((group) => group.id === groupId);
      const groupName = groupToDelete?.groupName || 'Group';

      // Publish domain event
      eventBus.publish('group.remove.started', {
        projectId,
        groupId,
        groupName,
        timestamp: new Date().toISOString()
      });

      // Use semantic command (which internally calls the RTK Query mutation)
      await dispatch(groupCommands.removeGroup({
        projectId,
        groupId,
        groupName
      })).unwrap();

      // Publish success event
      eventBus.publish('group.remove.completed', {
        projectId,
        groupId,
        groupName,
        timestamp: new Date().toISOString()
      });
      
      await onRefresh?.();
      
    } catch (error) {
      console.error('Failed to remove group:', error);

      // Publish error event
      eventBus.publish('group.remove.failed', {
        projectId,
        groupId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [data, projectId, dispatch, onRefresh]);

  // Add participant to group
  const handleAddParticipantToGroup = useCallback(async (groupId, participantId) => {
    try {
      // Publish domain event
      eventBus.publish('group.participant.add.started', {
        projectId,
        groupId,
        participantId,
        timestamp: new Date().toISOString()
      });

      // Use semantic command
      await dispatch(groupCommands.addParticipantToGroup({
        groupId,
        participantId
      })).unwrap();

      // Publish success event
      eventBus.publish('group.participant.add.completed', {
        projectId,
        groupId,
        participantId,
        timestamp: new Date().toISOString()
      });
      
      await onRefresh?.();
      
    } catch (error) {
      console.error('Failed to add participant to group:', error);

      // Publish error event
      eventBus.publish('group.participant.add.failed', {
        projectId,
        groupId,
        participantId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [projectId, dispatch, onRefresh]);

  // Remove participant from group
  const handleRemoveParticipantFromGroup = useCallback(async (groupId, participantId) => {
    try {
      // Publish domain event
      eventBus.publish('group.participant.remove.started', {
        projectId,
        groupId,
        participantId,
        timestamp: new Date().toISOString()
      });

      // Use semantic command
      await dispatch(groupCommands.removeParticipantFromGroup({
        groupId,
        participantId
      })).unwrap();

      // Publish success event
      eventBus.publish('group.participant.remove.completed', {
        projectId,
        groupId,
        participantId,
        timestamp: new Date().toISOString()
      });
      
      await onRefresh?.();
      
    } catch (error) {
      console.error('Failed to remove participant from group:', error);

      // Publish error event
      eventBus.publish('group.participant.remove.failed', {
        projectId,
        groupId,
        participantId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [projectId, dispatch, onRefresh]);

  // Clear progress cache
  const handleClearProgressCache = useCallback(async () => {
    try {
      // Publish domain event
      eventBus.publish('group.progress.cache.clear.started', {
        projectId,
        timestamp: new Date().toISOString()
      });

      // Use semantic command
      await dispatch(groupCommands.clearProgressCache({
        projectId
      })).unwrap();

      showNotification('Progress cache cleared successfully');

      // Publish success event
      eventBus.publish('group.progress.cache.clear.completed', {
        projectId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to clear progress cache:', error);

      // Publish error event
      eventBus.publish('group.progress.cache.clear.failed', {
        projectId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [projectId, dispatch, showNotification]);

  return {
    // CRUD operations
    handleAddGroup,
    handleUpdateGroup,
    handleRemoveGroup,
    
    // Group-participant management
    handleAddParticipantToGroup,
    handleRemoveParticipantFromGroup,
    
    // Utility operations
    handleClearProgressCache,
    
    // Mutation states (for loading indicators)
    mutations: {
      addGroup: addGroupMutation,
      updateGroup: updateGroupMutation,
      removeGroup: removeGroupMutation,
      addParticipantToGroup: addParticipantToGroupMutation,
      removeParticipantFromGroup: removeParticipantFromGroupMutation,
      clearProgressCache: clearProgressCacheMutation
    }
  };
};