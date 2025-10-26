import { useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { attendanceCommands } from 'store/commands';
import { selectEventAttendance, selectAttendanceLoading } from 'store/entities/attendanceSlice';

/**
 * CQRS-based Attendance Management Hook
 *
 * Modernized version that uses:
 * - Semantic commands instead of direct Redux actions
 * - Attendance entity store for state
 * - Memoized selectors for performance
 *
 * Maintains backward compatibility with existing components
 */
export const useAttendanceManagementCQRS = (eventParticipants, selectedEvent, singleProject) => {
  const dispatch = useDispatch();

  // Track which participant is currently being updated (for UI loading states)
  const [updatingParticipant, setUpdatingParticipant] = useState(null);

  // Get attendance records for this event from entity store
  const eventAttendance = useSelector(state =>
    selectedEvent?.id ? selectEventAttendance(state, selectedEvent.id) : []
  );

  // Get loading state from entity store
  const isLoading = useSelector(selectAttendanceLoading);

  // Build participant statuses from entity store + eventParticipants
  // Priority: Entity Store > eventParticipants prop
  const participantStatuses = useMemo(() => {
    const statuses = {};

    // First, populate from eventParticipants (fallback)
    eventParticipants?.forEach(ep => {
      const participantId = ep.enrolleeId || ep.participant?.id || ep.id;
      if (participantId) {
        statuses[participantId] = ep.attendance_status || 'scheduled';
      }
    });

    // Then, override with entity store data (source of truth)
    eventAttendance?.forEach(record => {
      statuses[record.participantId] = record.status || 'scheduled';
    });

    return statuses;
  }, [eventParticipants, eventAttendance]);

  /**
   * Handle attendance status changes
   * Uses semantic commands instead of direct API calls
   */
  const handleStatusChange = useCallback(async (participantId, newStatus) => {
    // Prevent concurrent updates
    if (updatingParticipant) {
      console.warn('[useAttendanceManagementCQRS] Update already in progress');
      return;
    }

    setUpdatingParticipant(participantId);

    try {
      // Find the participant data
      const eventParticipant = eventParticipants?.find(ep => {
        const epParticipantId = ep.enrolleeId || ep.participant?.id || ep.id;
        return epParticipantId === participantId;
      });

      if (!eventParticipant) {
        throw new Error('Participant not found in event');
      }

      // Check if this is a group member (not direct attendee)
      if (eventParticipant.isDirect === false) {
        // For group members, enroll them individually first
        await dispatch(attendanceCommands.enrollParticipantInEvent({
          participant: {
            id: participantId,
            firstName: eventParticipant.participant?.firstName || eventParticipant.firstName,
            lastName: eventParticipant.participant?.lastName || eventParticipant.lastName,
            role: eventParticipant.participant?.role || eventParticipant.role
          },
          event: {
            id: selectedEvent.id,
            title: selectedEvent.title,
            start: selectedEvent.start,
            projectId: selectedEvent.projectId || singleProject?.id
          },
          enrollmentType: 'group'
        })).unwrap();

        // Now update their status if different from 'scheduled'
        if (newStatus !== 'scheduled') {
          await dispatch(selectAttendanceCommand(newStatus)({
            participant: eventParticipant,
            event: selectedEvent,
            actualStatus: newStatus
          })).unwrap();
        }
      } else {
        // For direct attendees, just update their status
        await dispatch(selectAttendanceCommand(newStatus)({
          participant: {
            ...eventParticipant,
            enrolleeId: eventParticipant.enrolleeId || eventParticipant.id
          },
          event: selectedEvent,
          actualStatus: newStatus
        })).unwrap();
      }

      // Dispatch custom event for backward compatibility with Groups tab
      window.dispatchEvent(new CustomEvent('attendanceUpdated', {
        detail: {
          projectId: selectedEvent.projectId || singleProject?.id,
          eventId: selectedEvent.id,
          participantId: participantId,
          newStatus: newStatus
        }
      }));

      console.log(`[useAttendanceManagementCQRS] Attendance updated:`, {
        participantId,
        eventId: selectedEvent.id,
        status: newStatus
      });

    } catch (error) {
      console.error('[useAttendanceManagementCQRS] Error updating attendance:', error);
      // Commands handle error notifications, so we don't need to dispatch snackbar here
    } finally {
      setUpdatingParticipant(null);
    }
  }, [dispatch, eventParticipants, selectedEvent, singleProject, updatingParticipant]);

  /**
   * Handle removing participant from event
   * Uses removeParticipantFromEvent command
   */
  const handleRemoveFromEvent = useCallback(async (participantId, participant) => {
    if (!selectedEvent?.id) {
      console.error('[useAttendanceManagementCQRS] No event ID for removal');
      return;
    }

    try {
      await dispatch(attendanceCommands.removeParticipantFromEvent({
        participant: {
          id: participantId,
          enrolleeId: participant?.enrolleeId,
          participantId: participant?.participantId,
          firstName: participant?.participant?.firstName || participant?.firstName,
          lastName: participant?.participant?.lastName || participant?.lastName,
          participant: participant?.participant
        },
        event: {
          id: selectedEvent.id,
          title: selectedEvent.title,
          projectId: selectedEvent.projectId || singleProject?.id
        },
        reason: 'Removed by instructor'
      })).unwrap();

      console.log(`[useAttendanceManagementCQRS] Participant removed:`, {
        participantId,
        eventId: selectedEvent.id
      });

    } catch (error) {
      console.error('[useAttendanceManagementCQRS] Error removing participant:', error);
      // Command handles error notification
    }
  }, [dispatch, selectedEvent, singleProject]);

  /**
   * Handle moving participant to different group
   * Uses moveParticipantToGroup command
   */
  const handleMoveToGroup = useCallback(async (participantId, participant, targetGroup) => {
    if (!targetGroup?.id || !singleProject?.id) {
      console.error('[useAttendanceManagementCQRS] Missing target group or project');
      return;
    }

    try {
      // Find current group
      const currentGroup = singleProject.groups?.find(group =>
        group.participants?.some(p => p.participantId === participantId)
      );

      await dispatch(attendanceCommands.moveParticipantToGroup({
        participant: {
          id: participantId,
          firstName: participant?.participant?.firstName || participant?.firstName,
          lastName: participant?.participant?.lastName || participant?.lastName,
          participant: participant?.participant
        },
        fromGroup: currentGroup ? {
          id: currentGroup.id,
          groupName: currentGroup.groupName
        } : null,
        toGroup: {
          id: targetGroup.id,
          groupName: targetGroup.groupName
        }
      })).unwrap();

      console.log(`[useAttendanceManagementCQRS] Participant moved:`, {
        participantId,
        fromGroup: currentGroup?.groupName,
        toGroup: targetGroup.groupName
      });

    } catch (error) {
      console.error('[useAttendanceManagementCQRS] Error moving participant:', error);
      // Command handles error notification
    }
  }, [dispatch, singleProject]);

  return {
    participantStatuses,
    updatingParticipant,
    isLoading,
    handleStatusChange,
    handleRemoveFromEvent,
    handleMoveToGroup
  };
};

/**
 * Helper: Select the appropriate command based on status
 */
function selectAttendanceCommand(status) {
  switch (status) {
    case 'present':
      return attendanceCommands.markParticipantPresent;
    case 'absent':
      return attendanceCommands.markParticipantAbsent;
    case 'late':
      return attendanceCommands.recordLateArrival;
    default:
      return attendanceCommands.markParticipantPresent;
  }
}

// Export as default for easy replacement
export default useAttendanceManagementCQRS;
