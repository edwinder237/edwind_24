/**
 * Modernized Events CRUD Hook using RTK Query
 * 
 * This hook provides CRUD operations for events using:
 * - RTK Query mutations for API calls
 * - Semantic commands for business logic
 * - Domain events for cross-component communication
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { 
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useUpdateAttendanceStatusMutation,
  useAddEventParticipantMutation,
  useRemoveEventParticipantMutation,
  useAddEventGroupMutation,
  useImportCurriculumScheduleMutation,
  useAddEventParticipantsAndGroupsMutation
} from 'store/api/projectApi';
import { eventCommands } from 'store/commands/eventCommands';
import { openSnackbar } from 'store/reducers/snackbar';
import eventBus from 'store/events/EventBus';

export const useEventsCRUDRTK = ({ data, participants, groups, projectId, onRefresh }) => {
  const dispatch = useDispatch();
  
  // RTK Query mutations
  const [createEventMutation] = useCreateEventMutation();
  const [updateEventMutation] = useUpdateEventMutation();
  const [deleteEventMutation] = useDeleteEventMutation();
  const [updateAttendanceMutation] = useUpdateAttendanceStatusMutation();
  const [addParticipantMutation] = useAddEventParticipantMutation();
  const [removeParticipantMutation] = useRemoveEventParticipantMutation();
  const [addGroupMutation] = useAddEventGroupMutation();
  const [importScheduleMutation] = useImportCurriculumScheduleMutation();
  const [addMultipleMutation] = useAddEventParticipantsAndGroupsMutation();

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

  // Create event
  const handleCreateEvent = useCallback(async (eventData) => {
    try {
      // Publish domain event
      eventBus.publish('event.create.started', {
        projectId,
        eventData: {
          title: eventData.title,
          start: eventData.start,
          end: eventData.end
        },
        timestamp: new Date().toISOString()
      });

      // Use semantic command (which internally calls the RTK Query mutation)
      const result = await dispatch(eventCommands.createEvent({
        projectId,
        eventData
      })).unwrap();

      // Extract event title for event
      const eventTitle = eventData.title || 'Event';

      // Publish success event
      eventBus.publish('event.create.completed', {
        projectId,
        eventId: result.eventId,
        eventTitle,
        timestamp: new Date().toISOString()
      });

      // Refresh data if callback provided
      await onRefresh?.();
      
      return result;
      
    } catch (error) {
      console.error('Failed to create event:', error);
      
      // Publish error event
      eventBus.publish('event.create.failed', {
        projectId,
        error: error.message,
        eventData,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [projectId, dispatch, onRefresh]);

  // Update event
  const handleUpdateEvent = useCallback(async (eventId, updates) => {
    try {
      // Publish domain event
      eventBus.publish('event.update.started', {
        projectId,
        eventId,
        updates: Object.keys(updates),
        timestamp: new Date().toISOString()
      });

      // Use semantic command (which internally calls the RTK Query mutation)
      const result = await dispatch(eventCommands.updateEvent({
        eventId,
        updates,
        projectId
      })).unwrap();

      const eventTitle = updates.title || 'Event';

      // Publish success event
      eventBus.publish('event.update.completed', {
        projectId,
        eventId,
        eventTitle,
        timestamp: new Date().toISOString()
      });
      
      await onRefresh?.();
      
      return result;
      
    } catch (error) {
      console.error('Failed to update event:', error);

      // Publish error event
      eventBus.publish('event.update.failed', {
        projectId,
        eventId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [projectId, dispatch, onRefresh]);

  // Delete event
  const handleDeleteEvent = useCallback(async (eventId) => {
    try {
      const eventToDelete = data.find((event) => event.id === eventId);
      const eventTitle = eventToDelete?.title || 'Event';

      // Publish domain event
      eventBus.publish('event.delete.started', {
        projectId,
        eventId,
        eventTitle,
        timestamp: new Date().toISOString()
      });

      // Use semantic command (which internally calls the RTK Query mutation)
      await dispatch(eventCommands.deleteEvent({
        projectId,
        eventId,
        eventTitle
      })).unwrap();

      // Publish success event
      eventBus.publish('event.delete.completed', {
        projectId,
        eventId,
        eventTitle,
        timestamp: new Date().toISOString()
      });
      
      await onRefresh?.();
      
    } catch (error) {
      console.error('Failed to delete event:', error);

      // Publish error event
      eventBus.publish('event.delete.failed', {
        projectId,
        eventId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [data, projectId, dispatch, onRefresh]);

  // Update attendance status
  const handleUpdateAttendance = useCallback(async (eventId, participantId, attendanceStatus) => {
    try {
      // Publish domain event
      eventBus.publish('event.attendance.update.started', {
        projectId,
        eventId,
        participantId,
        attendanceStatus,
        timestamp: new Date().toISOString()
      });

      // Use semantic command
      await dispatch(eventCommands.updateAttendanceStatus({
        eventId,
        participantId,
        attendanceStatus
      })).unwrap();

      // Publish success event
      eventBus.publish('event.attendance.update.completed', {
        projectId,
        eventId,
        participantId,
        attendanceStatus,
        timestamp: new Date().toISOString()
      });
      
      await onRefresh?.();
      
    } catch (error) {
      console.error('Failed to update attendance:', error);

      // Publish error event
      eventBus.publish('event.attendance.update.failed', {
        projectId,
        eventId,
        participantId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [projectId, dispatch, onRefresh]);

  // Add participant to event
  const handleAddParticipantToEvent = useCallback(async (eventId, participantId, attendanceStatus = 'scheduled') => {
    try {
      // Publish domain event
      eventBus.publish('event.participant.add.started', {
        projectId,
        eventId,
        participantId,
        attendanceStatus,
        timestamp: new Date().toISOString()
      });

      // Use semantic command
      await dispatch(eventCommands.addParticipantToEvent({
        eventId,
        participantId,
        attendanceStatus
      })).unwrap();

      // Publish success event
      eventBus.publish('event.participant.add.completed', {
        projectId,
        eventId,
        participantId,
        timestamp: new Date().toISOString()
      });
      
      await onRefresh?.();
      
    } catch (error) {
      console.error('Failed to add participant to event:', error);

      // Publish error event
      eventBus.publish('event.participant.add.failed', {
        projectId,
        eventId,
        participantId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [projectId, dispatch, onRefresh]);

  // Remove participant from event
  const handleRemoveParticipantFromEvent = useCallback(async (eventId, participantId) => {
    try {
      // Publish domain event
      eventBus.publish('event.participant.remove.started', {
        projectId,
        eventId,
        participantId,
        timestamp: new Date().toISOString()
      });

      // Use semantic command
      await dispatch(eventCommands.removeParticipantFromEvent({
        eventId,
        participantId
      })).unwrap();

      // Publish success event
      eventBus.publish('event.participant.remove.completed', {
        projectId,
        eventId,
        participantId,
        timestamp: new Date().toISOString()
      });
      
      await onRefresh?.();
      
    } catch (error) {
      console.error('Failed to remove participant from event:', error);

      // Publish error event
      eventBus.publish('event.participant.remove.failed', {
        projectId,
        eventId,
        participantId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [projectId, dispatch, onRefresh]);

  // Add group to event
  const handleAddGroupToEvent = useCallback(async (eventId, groupId) => {
    try {
      // Publish domain event
      eventBus.publish('event.group.add.started', {
        projectId,
        eventId,
        groupId,
        timestamp: new Date().toISOString()
      });

      // Use semantic command
      await dispatch(eventCommands.addGroupToEvent({
        eventId,
        groupId
      })).unwrap();

      // Publish success event
      eventBus.publish('event.group.add.completed', {
        projectId,
        eventId,
        groupId,
        timestamp: new Date().toISOString()
      });
      
      await onRefresh?.();
      
    } catch (error) {
      console.error('Failed to add group to event:', error);

      // Publish error event
      eventBus.publish('event.group.add.failed', {
        projectId,
        eventId,
        groupId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [projectId, dispatch, onRefresh]);

  // Add multiple participants/groups to event
  const handleAddMultipleToEvent = useCallback(async (eventId, { participants = [], groups = [] }) => {
    try {
      // Publish domain event
      eventBus.publish('event.multiple.add.started', {
        projectId,
        eventId,
        participantCount: participants.length,
        groupCount: groups.length,
        timestamp: new Date().toISOString()
      });

      // Use semantic command
      await dispatch(eventCommands.addMultipleToEvent({
        eventId,
        participants,
        groups
      })).unwrap();

      // Publish success event
      eventBus.publish('event.multiple.add.completed', {
        projectId,
        eventId,
        participantCount: participants.length,
        groupCount: groups.length,
        timestamp: new Date().toISOString()
      });
      
      await onRefresh?.();
      
    } catch (error) {
      console.error('Failed to add multiple to event:', error);

      // Publish error event
      eventBus.publish('event.multiple.add.failed', {
        projectId,
        eventId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [projectId, dispatch, onRefresh]);

  // Import curriculum schedule
  const handleImportCurriculumSchedule = useCallback(async (curriculumId, scheduleData) => {
    try {
      // Publish domain event
      eventBus.publish('event.import.schedule.started', {
        projectId,
        curriculumId,
        timestamp: new Date().toISOString()
      });

      // Use semantic command
      const result = await dispatch(eventCommands.importCurriculumSchedule({
        projectId,
        curriculumId,
        scheduleData
      })).unwrap();

      // Publish success event
      eventBus.publish('event.import.schedule.completed', {
        projectId,
        curriculumId,
        eventCount: result.events?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      await onRefresh?.();
      
      return result;
      
    } catch (error) {
      console.error('Failed to import curriculum schedule:', error);

      // Publish error event
      eventBus.publish('event.import.schedule.failed', {
        projectId,
        curriculumId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [projectId, dispatch, onRefresh]);

  return {
    // Event CRUD operations
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    
    // Attendance management
    handleUpdateAttendance,
    
    // Participant management
    handleAddParticipantToEvent,
    handleRemoveParticipantFromEvent,
    
    // Group management
    handleAddGroupToEvent,
    
    // Bulk operations
    handleAddMultipleToEvent,
    
    // Import operations
    handleImportCurriculumSchedule,
    
    // Mutation states (for loading indicators)
    mutations: {
      createEvent: createEventMutation,
      updateEvent: updateEventMutation,
      deleteEvent: deleteEventMutation,
      updateAttendance: updateAttendanceMutation,
      addParticipant: addParticipantMutation,
      removeParticipant: removeParticipantMutation,
      addGroup: addGroupMutation,
      importSchedule: importScheduleMutation,
      addMultiple: addMultipleMutation
    }
  };
};