import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'store';
import axios from 'utils/axios';
import { openSnackbar } from 'store/reducers/snackbar';
import { getSingleProject, getGroupsDetails } from 'store/reducers/projects';

/**
 * Custom hook for managing participant group movements
 * Handles adding, removing, and moving participants between groups
 * 
 * @returns {Object} Hook methods and state
 */
const useParticipantGroupMove = () => {
  const dispatch = useDispatch();
  const { groups, singleProject } = useSelector((state) => state.projects);
  const [loading, setLoading] = useState(false);
  const [movingParticipants, setMovingParticipants] = useState(new Set());

  /**
   * Find all groups that a participant belongs to
   * @param {number} participantId - The project_participants.id
   * @returns {Array} Array of groups the participant belongs to
   */
  const getParticipantGroups = useCallback((participantId) => {
    if (!groups || !participantId) return [];
    
    return groups.filter(group => 
      group.participants?.some(p => 
        p.participantId === participantId || 
        p.participant?.id === participantId
      )
    );
  }, [groups]);

  /**
   * Remove participant from a specific group
   * @param {number} groupId - The group ID to remove from
   * @param {number} participantId - The project_participants.id
   * @returns {Promise<boolean>} Success status
   */
  const removeFromGroup = useCallback(async (groupId, participantId) => {
    try {
      const response = await axios.post('/api/projects/remove-participant-from-group', {
        groupId,
        participantId
      });
      return response.data.success;
    } catch (error) {
      console.error(`Failed to remove participant ${participantId} from group ${groupId}:`, error);
      return false;
    }
  }, []);

  /**
   * Add participant to a specific group
   * @param {number} groupId - The group ID to add to
   * @param {number} participantId - The project_participants.id
   * @param {number} projectId - The project ID
   * @returns {Promise<boolean>} Success status
   */
  const addToGroup = useCallback(async (groupId, participantId, projectId = null) => {
    try {
      const response = await axios.post('/api/projects/add-participant-to-group', {
        projectId: projectId || singleProject?.id,
        groupId,
        participantId
      });
      return response.data.success;
    } catch (error) {
      console.error(`Failed to add participant ${participantId} to group ${groupId}:`, error);
      throw error;
    }
  }, [singleProject?.id]);

  /**
   * Remove participant from all groups they belong to
   * @param {number} participantId - The project_participants.id
   * @returns {Promise<number>} Number of groups removed from
   */
  const removeFromAllGroups = useCallback(async (participantId) => {
    const participantGroups = getParticipantGroups(participantId);
    let removedCount = 0;

    for (const group of participantGroups) {
      const success = await removeFromGroup(group.id, participantId);
      if (success) removedCount++;
    }

    return removedCount;
  }, [getParticipantGroups, removeFromGroup]);

  /**
   * Sync event attendees after participant group changes
   * @param {number} participantId - The project_participants.id
   * @param {Array} oldGroupIds - Array of old group IDs
   * @param {number|null} newGroupId - The new group ID
   * @returns {Promise<Object>} Result object with sync status
   */
  const syncEventAttendees = useCallback(async (participantId, oldGroupIds, newGroupId) => {
    try {
      const response = await axios.post('/api/projects/sync-event-attendees', {
        participantId,
        oldGroupIds,
        newGroupId
      });

      return {
        success: true,
        updatesApplied: response.data.updatesApplied,
        errors: response.data.errors
      };
    } catch (error) {
      console.error('Failed to sync event attendees:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to sync event attendees'
      };
    }
  }, []);

  /**
   * Move participant from current group(s) to a new group
   * @param {number} participantId - The project_participants.id
   * @param {number|null} targetGroupId - The target group ID (null to just remove)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result object with success status and message
   */
  const moveParticipant = useCallback(async (participantId, targetGroupId, options = {}) => {
    const {
      removeFromAll = true, // Remove from all current groups before adding
      currentGroupId = null, // Specific group to remove from (if not removing from all)
      projectId = null,
      showNotification = true,
      syncEvents = true // New option to control event sync
    } = options;

    if (!participantId) {
      return { success: false, error: 'Invalid participant ID' };
    }

    setLoading(true);
    setMovingParticipants(prev => new Set(prev).add(participantId));

    try {
      let removedFromGroups = [];
      let removedGroupIds = [];
      
      // Step 1: Get current groups before removing (needed for event sync)
      if (removeFromAll) {
        const participantGroups = getParticipantGroups(participantId);
        removedGroupIds = participantGroups.map(g => g.id);
      } else if (currentGroupId) {
        removedGroupIds = [currentGroupId];
      }
      
      // Step 2: Remove from current groups
      if (removeFromAll) {
        const participantGroups = getParticipantGroups(participantId);
        for (const group of participantGroups) {
          const success = await removeFromGroup(group.id, participantId);
          if (success) removedFromGroups.push(group.groupName);
        }
      } else if (currentGroupId) {
        const success = await removeFromGroup(currentGroupId, participantId);
        if (success) {
          const group = groups?.find(g => g.id === currentGroupId);
          if (group) removedFromGroups.push(group.groupName);
        }
      }

      // Step 3: Add to new group if specified
      if (targetGroupId) {
        await addToGroup(targetGroupId, participantId, projectId);
      }

      // Step 4: Sync event attendees if enabled
      if (syncEvents && (removedGroupIds.length > 0 || targetGroupId)) {
        const syncResult = await syncEventAttendees(participantId, removedGroupIds, targetGroupId);
        
        if (!syncResult.success) {
          console.warn('Event sync failed but group move succeeded:', syncResult.error);
        }
      }
      
      // Step 5: Show success message
      if (targetGroupId) {
        const targetGroup = groups?.find(g => g.id === targetGroupId);
        const message = removedFromGroups.length > 0
          ? `Participant moved from ${removedFromGroups.join(', ')} to ${targetGroup?.groupName || 'new group'}`
          : `Participant added to ${targetGroup?.groupName || 'group'}`;

        if (showNotification) {
          dispatch(openSnackbar({
            open: true,
            message,
            variant: 'alert',
            alert: { color: 'success' }
          }));
        }

        return { success: true, message };
      } else {
        // Just removed from groups
        const message = removedFromGroups.length > 0
          ? `Participant removed from ${removedFromGroups.join(', ')}`
          : 'Participant removed from group';

        if (showNotification) {
          dispatch(openSnackbar({
            open: true,
            message,
            variant: 'alert',
            alert: { color: 'success' }
          }));
        }

        return { success: true, message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update participant group';
      
      if (showNotification) {
        dispatch(openSnackbar({
          open: true,
          message: errorMessage,
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
      setMovingParticipants(prev => {
        const newSet = new Set(prev);
        newSet.delete(participantId);
        return newSet;
      });
    }
  }, [groups, getParticipantGroups, removeFromGroup, addToGroup, dispatch]);

  /**
   * Move multiple participants to a group
   * @param {Array} participantIds - Array of project_participants.ids
   * @param {number|null} targetGroupId - The target group ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result object with counts and errors
   */
  const moveMultipleParticipants = useCallback(async (participantIds, targetGroupId, options = {}) => {
    const {
      removeFromAll = true,
      projectId = null,
      showNotification = true
    } = options;

    if (!participantIds || participantIds.length === 0) {
      return { success: false, error: 'No participants selected' };
    }

    setLoading(true);
    const results = { successful: 0, failed: 0, errors: [] };

    for (const participantId of participantIds) {
      const result = await moveParticipant(participantId, targetGroupId, {
        ...options,
        showNotification: false // We'll show a summary notification instead
      });

      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push({ participantId, error: result.error });
      }
    }

    if (showNotification) {
      if (results.successful > 0) {
        const targetGroup = groups?.find(g => g.id === targetGroupId);
        const message = targetGroupId
          ? `${results.successful} participant(s) moved to ${targetGroup?.groupName || 'group'}`
          : `${results.successful} participant(s) removed from groups`;

        dispatch(openSnackbar({
          open: true,
          message,
          variant: 'alert',
          alert: { color: 'success' }
        }));
      }

      if (results.failed > 0) {
        dispatch(openSnackbar({
          open: true,
          message: `Failed to move ${results.failed} participant(s)`,
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }
    }

    setLoading(false);
    return results;
  }, [groups, moveParticipant, dispatch]);

  /**
   * Refresh project and groups data
   * @param {boolean} fullRefresh - Whether to refresh full project or just groups
   */
  const refreshData = useCallback(async (fullRefresh = false) => {
    if (singleProject?.id) {
      if (fullRefresh) {
        await Promise.all([
          dispatch(getSingleProject(singleProject.id)),
          dispatch(getGroupsDetails(singleProject.id))
        ]);
      } else {
        // Only refresh groups data for better performance
        await dispatch(getGroupsDetails(singleProject.id));
      }
    }
  }, [dispatch, singleProject?.id]);

  /**
   * Check if a participant is currently being moved
   * @param {number} participantId - The project_participants.id
   * @returns {boolean} Whether the participant is being moved
   */
  const isMoving = useCallback((participantId) => {
    return movingParticipants.has(participantId);
  }, [movingParticipants]);

  return {
    // State
    loading,
    movingParticipants: Array.from(movingParticipants),
    
    // Methods
    moveParticipant,
    moveMultipleParticipants,
    removeFromGroup,
    addToGroup,
    removeFromAllGroups,
    getParticipantGroups,
    syncEventAttendees,
    refreshData,
    isMoving,
    
    // Data
    groups,
    singleProject
  };
};

export default useParticipantGroupMove;