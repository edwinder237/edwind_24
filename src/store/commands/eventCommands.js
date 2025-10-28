/**
 * Event Semantic Commands
 * 
 * This module contains semantic commands for event management operations.
 * Commands represent user intentions and business operations rather than
 * technical implementation details.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';
import { openSnackbar } from '../reducers/snackbar';
import { eventAdded, eventUpdated, eventRemoved } from '../entities/eventsSlice';
// NOTE: fetchProjectAgenda import removed - RTK Query handles agenda updates via tag invalidation
// import { fetchProjectAgenda } from '../reducers/project/agenda';

// ==============================|| EVENT COMMANDS ||============================== //

/**
 * Create a new event
 * Business Intent: User wants to schedule a new training event
 */
export const createEvent = createAsyncThunk(
  'events/createEvent',
  async ({ projectId, eventData }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'CREATE_EVENT',
        projectId,
        event: {
          title: eventData.title,
          description: eventData.description,
          start: eventData.start,
          end: eventData.end,
          courseId: eventData.courseId,
          instructorId: eventData.instructorId,
          location: eventData.location
        },
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.createEvent.initiate({
        projectId,
        eventData
      })).unwrap();

      // Show success notification
      dispatch(openSnackbar({
        open: true,
        message: `Event "${eventData.title}" has been created successfully`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };
      
    } catch (error) {
      console.error('Failed to create event:', error);
      
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to create event',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      
      return rejectWithValue(error.message || 'Failed to create event');
    }
  }
);

/**
 * Update an existing event
 * Business Intent: User wants to modify event details
 */
export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ eventId, updates, projectId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'UPDATE_EVENT',
        eventId,
        updates: Object.keys(updates),
        projectId,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.updateEvent.initiate({
        eventId,
        updates,
        projectId
      })).unwrap();

      // Force invalidate RTK Query cache to trigger UI updates
      dispatch(projectApi.util.invalidateTags([
        { type: 'Event', id: eventId },
        { type: 'ProjectAgenda', id: projectId },
        { type: 'Project', id: projectId },
        'Participant',
        'Group'
      ]));

      // NOTE: Legacy fetchProjectAgenda call removed - RTK Query handles this via tag invalidation
      // Removing this prevents duplicate refetches that overwhelm Prisma connection pool

      const eventTitle = updates.title || 'Event';
      
      dispatch(openSnackbar({
        open: true,
        message: `${eventTitle} has been updated successfully`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };
      
    } catch (error) {
      console.error('Failed to update event:', error);
      
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to update event',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      
      return rejectWithValue(error.message || 'Failed to update event');
    }
  }
);

/**
 * Delete an event
 * Business Intent: User wants to remove an event from the schedule
 */
export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async ({ eventId, eventTitle, projectId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'DELETE_EVENT',
        eventId,
        eventTitle,
        projectId,
        timestamp: new Date().toISOString()
      };

      await dispatch(projectApi.endpoints.deleteEvent.initiate({
        eventId,
        projectId
      })).unwrap();

      // Force invalidate RTK Query cache to trigger UI updates
      // IMPORTANT: Only invalidate specific tags - don't use global tags
      // Global 'Participant'/'Group'/'Project' tags trigger expensive parallel refetches
      // that overwhelm Prisma connection pool when deletes happen in quick succession
      dispatch(projectApi.util.invalidateTags([
        { type: 'Event', id: eventId },
        { type: 'ProjectAgenda', id: projectId }
        // Removed global tags: 'Project', 'Participant', 'Group'
        // These caused fetchParticipantsDetails, fetchProjectSettings, checklist-progress
        // to run in parallel with agenda refetch, overwhelming database
      ]));

      // NOTE: Legacy fetchProjectAgenda call removed - RTK Query handles this via tag invalidation
      // Removing this prevents duplicate refetches that overwhelm Prisma connection pool

      dispatch(openSnackbar({
        open: true,
        message: `${eventTitle || 'Event'} has been deleted successfully`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { eventId, command };
      
    } catch (error) {
      console.error('Failed to delete event:', error);
      
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to delete event',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      
      return rejectWithValue(error.message || 'Failed to delete event');
    }
  }
);

/**
 * Update event attendance status
 * Business Intent: User wants to mark participant attendance
 */
export const updateAttendanceStatus = createAsyncThunk(
  'events/updateAttendanceStatus',
  async ({ eventId, participantId, attendanceStatus }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'UPDATE_ATTENDANCE_STATUS',
        eventId,
        participantId,
        attendanceStatus,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.updateAttendanceStatus.initiate({
        eventId,
        participantId,
        attendance_status: attendanceStatus
      })).unwrap();

      // Show success notification
      const statusText = {
        present: 'marked as present',
        absent: 'marked as absent',
        late: 'marked as late',
        scheduled: 'marked as scheduled'
      }[attendanceStatus] || 'attendance updated';

      dispatch(openSnackbar({
        open: true,
        message: `Participant ${statusText}`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };
      
    } catch (error) {
      console.error('Failed to update attendance:', error);
      
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to update attendance',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      
      return rejectWithValue(error.message || 'Failed to update attendance');
    }
  }
);

/**
 * Add participant to event
 * Business Intent: User wants to enroll a participant in an event
 */
export const addParticipantToEvent = createAsyncThunk(
  'events/addParticipantToEvent',
  async ({ eventId, participantId, attendanceStatus = 'scheduled' }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'ADD_PARTICIPANT_TO_EVENT',
        eventId,
        participantId,
        attendanceStatus,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.addEventParticipant.initiate({
        eventId,
        participantId,
        attendance_status: attendanceStatus
      })).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: 'Participant added to event successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };
      
    } catch (error) {
      console.error('Failed to add participant to event:', error);
      
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to add participant to event',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      
      return rejectWithValue(error.message || 'Failed to add participant to event');
    }
  }
);

/**
 * Remove participant from event
 * Business Intent: User wants to remove a participant from an event
 */
export const removeParticipantFromEvent = createAsyncThunk(
  'events/removeParticipantFromEvent',
  async ({ eventId, participantId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'REMOVE_PARTICIPANT_FROM_EVENT',
        eventId,
        participantId,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.removeEventParticipant.initiate({
        eventId,
        participantId
      })).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: 'Participant removed from event successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };
      
    } catch (error) {
      console.error('Failed to remove participant from event:', error);
      
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to remove participant from event',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      
      return rejectWithValue(error.message || 'Failed to remove participant from event');
    }
  }
);

/**
 * Add group to event
 * Business Intent: User wants to enroll an entire group in an event
 */
export const addGroupToEvent = createAsyncThunk(
  'events/addGroupToEvent',
  async ({ eventId, groupId, projectId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'ADD_GROUP_TO_EVENT',
        eventId,
        groupId,
        projectId,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.addEventGroup.initiate({
        eventId,
        groupId,
        projectId
      })).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: 'Group added to event successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };
      
    } catch (error) {
      console.error('Failed to add group to event:', error);
      
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to add group to event',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      
      return rejectWithValue(error.message || 'Failed to add group to event');
    }
  }
);

/**
 * Move participant between events
 * Business Intent: User wants to transfer a participant from one event to another
 */
export const moveParticipantBetweenEvents = createAsyncThunk(
  'events/moveParticipantBetweenEvents',
  async ({ participantId, fromEventId, toEventId, projectId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'MOVE_PARTICIPANT_BETWEEN_EVENTS',
        participantId,
        fromEventId,
        toEventId,
        projectId,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.moveParticipantBetweenEvents.initiate({
        participantId,
        fromEventId,
        toEventId,
        projectId
      })).unwrap();

      // Force invalidate RTK Query cache to trigger UI updates
      dispatch(projectApi.util.invalidateTags([
        { type: 'Event', id: fromEventId },
        { type: 'Event', id: toEventId },
        { type: 'ProjectAgenda', id: projectId },
        'Participant',
        'Group'
      ]));

      // NOTE: Legacy fetchProjectAgenda call removed - RTK Query handles this via tag invalidation
      // Removing this prevents duplicate refetches that overwhelm Prisma connection pool

      const fromEventTitle = result.eventTitles?.from || 'source event';
      const toEventTitle = result.eventTitles?.to || 'target event';
      
      dispatch(openSnackbar({
        open: true,
        message: `Participant moved from "${fromEventTitle}" to "${toEventTitle}" successfully`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };
      
    } catch (error) {
      console.error('Failed to move participant between events:', error);
      
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to move participant between events',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      
      return rejectWithValue(error.message || 'Failed to move participant between events');
    }
  }
);

/**
 * Bulk add participants and groups to event
 * Business Intent: User wants to efficiently enroll multiple participants/groups
 */
export const addMultipleToEvent = createAsyncThunk(
  'events/addMultipleToEvent',
  async ({ eventId, participants = [], groups = [], projectId }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'ADD_MULTIPLE_TO_EVENT',
        eventId,
        participantCount: participants.length,
        groupCount: groups.length,
        projectId,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.addEventParticipantsAndGroups.initiate({
        eventId,
        participants,
        groups
      })).unwrap();

      // Force invalidate RTK Query cache to trigger UI updates
      dispatch(projectApi.util.invalidateTags([
        { type: 'Event', id: eventId },
        { type: 'ProjectAgenda', id: projectId },
        'Participant',
        'Group'
      ]));

      // NOTE: Legacy fetchProjectAgenda call removed - RTK Query handles this via tag invalidation
      // Removing this prevents duplicate refetches that overwhelm Prisma connection pool

      const totalCount = participants.length + groups.length;
      dispatch(openSnackbar({
        open: true,
        message: `${totalCount} participants/groups added to event successfully`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };
      
    } catch (error) {
      console.error('Failed to add multiple to event:', error);
      
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to add participants/groups to event',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      
      return rejectWithValue(error.message || 'Failed to add participants/groups to event');
    }
  }
);

/**
 * Duplicate an event
 * Business Intent: User wants to copy an existing event with similar details
 */
export const duplicateEvent = createAsyncThunk(
  'events/duplicateEvent',
  async ({ originalEventId, projectId, duplicateData = {} }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'DUPLICATE_EVENT',
        originalEventId,
        projectId,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.duplicateEvent.initiate({
        originalEventId,
        projectId,
        duplicateData
      })).unwrap();

      // Force invalidate RTK Query cache to trigger UI updates
      dispatch(projectApi.util.invalidateTags([
        { type: 'ProjectAgenda', id: projectId },
        { type: 'Project', id: projectId },
        'Event',
        'Participant',
        'Group'
      ]));

      // NOTE: Legacy fetchProjectAgenda call removed - RTK Query handles this via tag invalidation
      // Removing this prevents duplicate refetches that overwhelm Prisma connection pool

      dispatch(openSnackbar({
        open: true,
        message: 'Event duplicated successfully',
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };
      
    } catch (error) {
      console.error('Failed to duplicate event:', error);
      
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to duplicate event',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      
      return rejectWithValue(error.message || 'Failed to duplicate event');
    }
  }
);

/**
 * Import curriculum schedule
 * Business Intent: User wants to create multiple events from a curriculum
 */
export const importCurriculumSchedule = createAsyncThunk(
  'events/importCurriculumSchedule',
  async ({ projectId, curriculumId, scheduleData }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'IMPORT_CURRICULUM_SCHEDULE',
        projectId,
        curriculumId,
        scheduleData,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(projectApi.endpoints.importCurriculumSchedule.initiate({
        projectId,
        curriculumId,
        scheduleData
      })).unwrap();

      const eventCount = result.events?.length || 0;
      dispatch(openSnackbar({
        open: true,
        message: `${eventCount} events imported from curriculum successfully`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));

      return { ...result, command };
      
    } catch (error) {
      console.error('Failed to import curriculum schedule:', error);
      
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to import curriculum schedule',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      
      return rejectWithValue(error.message || 'Failed to import curriculum schedule');
    }
  }
);

// Export all commands as a group for convenience
export const eventCommands = {
  createEvent,
  updateEvent,
  deleteEvent,
  duplicateEvent,
  updateAttendanceStatus,
  addParticipantToEvent,
  removeParticipantFromEvent,
  moveParticipantBetweenEvents,
  addGroupToEvent,
  addMultipleToEvent,
  importCurriculumSchedule
};