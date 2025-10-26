import { createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../api/projectApi';
import { openSnackbar } from '../reducers/snackbar';
import {
  attendanceRecordAdded,
  attendanceRecordUpdated,
  attendanceBatchUpdated
} from '../entities/attendanceSlice';

/**
 * Semantic Commands for Attendance Management
 * 
 * These commands express user intentions rather than technical operations.
 * They provide a more natural API that matches how users think about their actions.
 */

// ==============================|| ATTENDANCE COMMANDS ||============================== //

/**
 * Mark a participant as present for an event
 * @param {Object} participant - The participant to mark present
 * @param {Object} event - The event they're attending
 * @param {string} actualStatus - Optional: 'present', 'late', etc.
 */
export const markParticipantPresent = createAsyncThunk(
  'attendance/markPresent',
  async ({ participant, event, actualStatus = 'present' }, { dispatch, rejectWithValue }) => {
    try {
      // Build the command context
      const command = {
        type: 'MARK_PARTICIPANT_PRESENT',
        participant: {
          id: participant.id,
          name: participant.participant ? 
            `${participant.participant.firstName} ${participant.participant.lastName}`.trim() :
            `${participant.firstName} ${participant.lastName}`.trim(),
          role: participant.participant?.role?.title || participant.role?.title
        },
        event: {
          id: event.id,
          title: event.title,
          start: event.start
        },
        status: actualStatus,
        timestamp: new Date().toISOString(),
        reason: 'User marked participant as present'
      };

      // Execute the technical operation
      const result = await dispatch(
        projectApi.endpoints.updateAttendanceStatus.initiate({
          eventId: event.id,
          participantId: participant.enrolleeId || participant.id,
          attendance_status: actualStatus
        })
      ).unwrap();

      // Update the attendance entity store
      dispatch(attendanceRecordUpdated({
        eventId: event.id,
        participantId: participant.enrolleeId || participant.id,
        status: actualStatus,
        updatedAt: new Date().toISOString(),
        notes: `Marked ${actualStatus} by instructor`
      }));

      // Success notification with context
      dispatch(openSnackbar({
        open: true,
        message: `${command.participant.name} marked as ${actualStatus} for ${command.event.title}`,
        variant: 'alert',
        alert: { color: 'success', variant: 'filled' }
      }));

      return { command, result };

    } catch (error) {
      const errorMessage = `Failed to mark ${participant.participant?.firstName || 'participant'} as present`;
      
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error', variant: 'filled' }
      }));

      return rejectWithValue({ error: errorMessage, originalError: error });
    }
  }
);

/**
 * Mark a participant as absent for an event
 * @param {Object} participant - The participant to mark absent
 * @param {Object} event - The event they're missing
 * @param {string} reason - Optional reason for absence
 */
export const markParticipantAbsent = createAsyncThunk(
  'attendance/markAbsent',
  async ({ participant, event, reason }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'MARK_PARTICIPANT_ABSENT',
        participant: {
          id: participant.id,
          name: participant.participant ? 
            `${participant.participant.firstName} ${participant.participant.lastName}`.trim() :
            `${participant.firstName} ${participant.lastName}`.trim()
        },
        event: {
          id: event.id,
          title: event.title
        },
        reason: reason || 'Marked absent by instructor',
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(
        projectApi.endpoints.updateAttendanceStatus.initiate({
          eventId: event.id,
          participantId: participant.enrolleeId || participant.id,
          attendance_status: 'absent'
        })
      ).unwrap();

      // Update the attendance entity store
      dispatch(attendanceRecordUpdated({
        eventId: event.id,
        participantId: participant.enrolleeId || participant.id,
        status: 'absent',
        updatedAt: new Date().toISOString(),
        notes: reason
      }));

      dispatch(openSnackbar({
        open: true,
        message: `${command.participant.name} marked as absent from ${command.event.title}`,
        variant: 'alert',
        alert: { color: 'warning', variant: 'filled' }
      }));

      return { command, result };

    } catch (error) {
      return rejectWithValue({ error: 'Failed to mark participant as absent', originalError: error });
    }
  }
);

/**
 * Record a participant's late arrival
 * @param {Object} participant - The participant who arrived late
 * @param {Object} event - The event they're late for
 * @param {number} minutesLate - How many minutes late they were
 */
export const recordLateArrival = createAsyncThunk(
  'attendance/recordLateArrival',
  async ({ participant, event, minutesLate }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'RECORD_LATE_ARRIVAL',
        participant: {
          id: participant.id,
          name: participant.participant ? 
            `${participant.participant.firstName} ${participant.participant.lastName}`.trim() :
            `${participant.firstName} ${participant.lastName}`.trim()
        },
        event: {
          id: event.id,
          title: event.title
        },
        minutesLate,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(
        projectApi.endpoints.updateAttendanceStatus.initiate({
          eventId: event.id,
          participantId: participant.enrolleeId || participant.id,
          attendance_status: 'late'
        })
      ).unwrap();

      // Update the attendance entity store
      const notes = minutesLate ? `Arrived ${minutesLate} minutes late` : 'Late arrival';
      dispatch(attendanceRecordUpdated({
        eventId: event.id,
        participantId: participant.enrolleeId || participant.id,
        status: 'late',
        updatedAt: new Date().toISOString(),
        notes
      }));

      const lateMessage = minutesLate ?
        `${command.participant.name} arrived ${minutesLate} minutes late` :
        `${command.participant.name} marked as late arrival`;

      dispatch(openSnackbar({
        open: true,
        message: lateMessage,
        variant: 'alert',
        alert: { color: 'warning', variant: 'filled' }
      }));

      return { command, result };

    } catch (error) {
      return rejectWithValue({ error: 'Failed to record late arrival', originalError: error });
    }
  }
);

// ==============================|| ENROLLMENT COMMANDS ||============================== //

/**
 * Enroll a participant in an event
 * @param {Object} participant - The participant to enroll
 * @param {Object} event - The event to enroll them in
 * @param {string} enrollmentType - 'individual' or 'group'
 */
export const enrollParticipantInEvent = createAsyncThunk(
  'enrollment/enrollParticipant',
  async ({ participant, event, enrollmentType = 'individual' }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'ENROLL_PARTICIPANT_IN_EVENT',
        participant: {
          id: participant.id,
          name: participant.participant ? 
            `${participant.participant.firstName} ${participant.participant.lastName}`.trim() :
            `${participant.firstName} ${participant.lastName}`.trim(),
          role: participant.participant?.role?.title || participant.role?.title
        },
        event: {
          id: event.id,
          title: event.title,
          start: event.start
        },
        enrollmentType,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(
        projectApi.endpoints.addEventParticipant.initiate({
          eventId: event.id,
          participantId: participant.id,
          attendance_status: 'scheduled',
          projectId: event.projectId // Add projectId for checklist cache invalidation
        })
      ).unwrap();

      // Add attendance record to entity store
      dispatch(attendanceRecordAdded({
        eventId: event.id,
        participantId: participant.id,
        status: 'scheduled',
        updatedAt: new Date().toISOString(),
        notes: `Enrolled via ${enrollmentType} enrollment`
      }));

      dispatch(openSnackbar({
        open: true,
        message: `${command.participant.name} enrolled in ${command.event.title}`,
        variant: 'alert',
        alert: { color: 'success', variant: 'filled' }
      }));

      return { command, result };

    } catch (error) {
      return rejectWithValue({ error: 'Failed to enroll participant in event', originalError: error });
    }
  }
);

/**
 * Remove a participant from an event
 * @param {Object} participant - The participant to remove
 * @param {Object} event - The event to remove them from
 * @param {string} reason - Reason for removal
 */
export const removeParticipantFromEvent = createAsyncThunk(
  'enrollment/removeParticipant',
  async ({ participant, event, reason = 'Removed by instructor' }, { dispatch, rejectWithValue }) => {
    try {
      // Determine the correct participant ID to use
      // Priority: enrolleeId > id (if it's a number) > participantId (UUID)
      let participantIdToSend;
      if (participant.enrolleeId) {
        participantIdToSend = participant.enrolleeId;
      } else if (participant.id && typeof participant.id === 'number') {
        participantIdToSend = participant.id;
      } else if (participant.participant?.participantId) {
        participantIdToSend = participant.participant.participantId;
      } else if (participant.participantId) {
        participantIdToSend = participant.participantId;
      } else {
        participantIdToSend = participant.id;
      }

      const command = {
        type: 'REMOVE_PARTICIPANT_FROM_EVENT',
        participant: {
          id: participant.id,
          name: participant.participant ?
            `${participant.participant.firstName} ${participant.participant.lastName}`.trim() :
            `${participant.firstName} ${participant.lastName}`.trim()
        },
        event: {
          id: event.id,
          title: event.title
        },
        reason,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(
        projectApi.endpoints.removeEventParticipant.initiate({
          eventId: event.id,
          participantId: participantIdToSend,
          projectId: event.projectId // Add projectId for checklist cache invalidation
        })
      ).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: `${command.participant.name} removed from ${command.event.title}`,
        variant: 'alert',
        alert: { color: 'info', variant: 'filled' }
      }));

      return { command, result };

    } catch (error) {
      return rejectWithValue({ error: 'Failed to remove participant from event', originalError: error });
    }
  }
);

// ==============================|| GROUP COMMANDS ||============================== //

/**
 * Move a participant to a different group
 * @param {Object} participant - The participant to move
 * @param {Object} fromGroup - Current group (can be null)
 * @param {Object} toGroup - Target group
 */
export const moveParticipantToGroup = createAsyncThunk(
  'groups/moveParticipant',
  async ({ participant, fromGroup, toGroup }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'MOVE_PARTICIPANT_TO_GROUP',
        participant: {
          id: participant.id,
          name: participant.participant ? 
            `${participant.participant.firstName} ${participant.participant.lastName}`.trim() :
            `${participant.firstName} ${participant.lastName}`.trim()
        },
        fromGroup: fromGroup ? {
          id: fromGroup.id,
          name: fromGroup.groupName
        } : null,
        toGroup: {
          id: toGroup.id,
          name: toGroup.groupName
        },
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(
        projectApi.endpoints.moveParticipantToGroup.initiate({
          participantId: participant.id,
          fromGroupId: fromGroup?.id,
          toGroupId: toGroup.id
        })
      ).unwrap();

      const message = fromGroup 
        ? `${command.participant.name} moved from ${command.fromGroup.name} to ${command.toGroup.name}`
        : `${command.participant.name} added to ${command.toGroup.name}`;

      dispatch(openSnackbar({
        open: true,
        message,
        variant: 'alert',
        alert: { color: 'success', variant: 'filled' }
      }));

      return { command, result };

    } catch (error) {
      return rejectWithValue({ error: 'Failed to move participant to group', originalError: error });
    }
  }
);

/**
 * Enroll an entire group in an event
 * @param {Object} group - The group to enroll
 * @param {Object} event - The event to enroll them in
 */
export const enrollGroupInEvent = createAsyncThunk(
  'enrollment/enrollGroup',
  async ({ group, event }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'ENROLL_GROUP_IN_EVENT',
        group: {
          id: group.id,
          name: group.groupName,
          participantCount: group.participants?.length || 0
        },
        event: {
          id: event.id,
          title: event.title
        },
        timestamp: new Date().toISOString()
      };

      // Use the bulk operation for better performance
      const result = await dispatch(
        projectApi.endpoints.addEventParticipantsAndGroups.initiate({
          eventId: event.id,
          participants: [],
          groups: [group],
          projectId: event.projectId // Add projectId for checklist cache invalidation
        })
      ).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: `${command.group.name} (${command.group.participantCount} participants) enrolled in ${command.event.title}`,
        variant: 'alert',
        alert: { color: 'success', variant: 'filled' }
      }));

      return { command, result };

    } catch (error) {
      return rejectWithValue({ error: 'Failed to enroll group in event', originalError: error });
    }
  }
);

// ==============================|| BULK COMMANDS ||============================== //

/**
 * Enroll multiple participants and groups in an event
 * @param {Array} participants - Array of participants to enroll
 * @param {Array} groups - Array of groups to enroll
 * @param {Object} event - The event to enroll them in
 */
export const enrollMultipleInEvent = createAsyncThunk(
  'enrollment/enrollMultiple',
  async ({ participants = [], groups = [], event }, { dispatch, rejectWithValue }) => {
    try {
      const command = {
        type: 'ENROLL_MULTIPLE_IN_EVENT',
        participants: participants.map(p => ({
          id: p.id,
          name: p.participant ? 
            `${p.participant.firstName} ${p.participant.lastName}`.trim() :
            `${p.firstName} ${p.lastName}`.trim()
        })),
        groups: groups.map(g => ({
          id: g.id,
          name: g.groupName,
          participantCount: g.participants?.length || 0
        })),
        event: {
          id: event.id,
          title: event.title
        },
        totalCount: participants.length + groups.length,
        timestamp: new Date().toISOString()
      };

      const result = await dispatch(
        projectApi.endpoints.addEventParticipantsAndGroups.initiate({
          eventId: event.id,
          participants,
          groups,
          projectId: event.projectId // Add projectId for checklist cache invalidation
        })
      ).unwrap();

      const { addedParticipants = [], addedGroups = [], errors = [] } = result;
      const successCount = addedParticipants.length + addedGroups.length;

      if (successCount > 0 && errors.length === 0) {
        dispatch(openSnackbar({
          open: true,
          message: `Successfully enrolled ${successCount} ${successCount === 1 ? 'item' : 'items'} in ${command.event.title}`,
          variant: 'alert',
          alert: { color: 'success', variant: 'filled' }
        }));
      } else if (successCount > 0 && errors.length > 0) {
        dispatch(openSnackbar({
          open: true,
          message: `Enrolled ${successCount} items, ${errors.length} had errors`,
          variant: 'alert',
          alert: { color: 'warning', variant: 'filled' }
        }));
      }

      return { command, result };

    } catch (error) {
      return rejectWithValue({ error: 'Failed to enroll multiple items in event', originalError: error });
    }
  }
);

// ==============================|| EXPORTS ||============================== //

export const attendanceCommands = {
  markParticipantPresent,
  markParticipantAbsent,
  recordLateArrival,
  enrollParticipantInEvent,
  removeParticipantFromEvent,
  moveParticipantToGroup,
  enrollGroupInEvent,
  enrollMultipleInEvent
};