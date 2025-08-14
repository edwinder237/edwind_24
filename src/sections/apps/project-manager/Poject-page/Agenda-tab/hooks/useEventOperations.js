import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { getSingleProject } from 'store/reducers/projects';
import EventAPI from '../services/eventAPI';

export const useEventOperations = (projectId) => {
  const dispatch = useDispatch();

  const refreshProject = useCallback(() => {
    if (projectId) {
      dispatch(getSingleProject(projectId));
    }
  }, [dispatch, projectId]);

  const createEvent = useCallback(async (eventData) => {
    try {
      const result = await EventAPI.createEvent({
        ...eventData,
        projectId
      });
      
      if (result.success) {
        refreshProject();
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }, [projectId, refreshProject]);

  const updateEvent = useCallback(async (eventId, updates) => {
    try {
      const result = await EventAPI.updateEvent(eventId, updates);
      
      if (result.success) {
        refreshProject();
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }, [refreshProject]);

  const deleteEvent = useCallback(async (eventId) => {
    try {
      const result = await EventAPI.deleteEvent(eventId);
      
      if (result.success) {
        refreshProject();
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }, [refreshProject]);

  const addEventParticipant = useCallback(async (eventId, participantId) => {
    try {
      const result = await EventAPI.addEventParticipant(eventId, participantId);
      
      if (result.success) {
        refreshProject();
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to add participant');
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }, [refreshProject]);

  const removeEventParticipant = useCallback(async (eventId, participantId) => {
    try {
      const result = await EventAPI.removeEventParticipant(eventId, participantId);
      
      if (result.success) {
        refreshProject();
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to remove participant');
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }, [refreshProject]);

  const addEventGroup = useCallback(async (eventId, groupId) => {
    try {
      const result = await EventAPI.addEventGroup(eventId, groupId);
      
      if (result.success) {
        refreshProject();
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to add group');
      }
    } catch (error) {
      console.error('Error adding group:', error);
      throw error;
    }
  }, [refreshProject]);

  const updateAttendanceStatus = useCallback(async (eventId, participantId, status) => {
    try {
      const result = await EventAPI.updateAttendanceStatus(eventId, participantId, status);
      
      if (result.success) {
        refreshProject();
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  }, [refreshProject]);

  const importCurriculumSchedule = useCallback(async () => {
    try {
      const result = await EventAPI.importCurriculumSchedule(projectId);
      
      if (result.success) {
        refreshProject();
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to import curriculum');
      }
    } catch (error) {
      console.error('Error importing curriculum:', error);
      throw error;
    }
  }, [projectId, refreshProject]);

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    addEventParticipant,
    removeEventParticipant,
    addEventGroup,
    updateAttendanceStatus,
    importCurriculumSchedule,
    refreshProject
  };
};