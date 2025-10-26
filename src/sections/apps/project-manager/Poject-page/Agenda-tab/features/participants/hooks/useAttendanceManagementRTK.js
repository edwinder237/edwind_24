import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'store';
import { 
  useUpdateAttendanceStatusMutation,
  useAddEventParticipantMutation,
  useRemoveEventParticipantMutation,
  useMoveParticipantToGroupMutation
} from 'store/api/projectApi';
import { openSnackbar } from 'store/reducers/snackbar';

/**
 * RTK Query version of attendance management hook
 * Uses RTK Query mutations for optimistic updates and automatic cache management
 */
export const useAttendanceManagementRTK = (eventParticipants, selectedEvent, singleProject, enabled = true) => {
  const dispatch = useDispatch();
  const [participantStatuses, setParticipantStatuses] = useState({});
  const [updatingParticipant, setUpdatingParticipant] = useState(null);

  // RTK Query mutations - always call but may not use if disabled
  const [updateAttendanceStatus] = useUpdateAttendanceStatusMutation();
  const [addEventParticipant] = useAddEventParticipantMutation();
  const [removeEventParticipant] = useRemoveEventParticipantMutation();
  const [moveParticipantToGroup] = useMoveParticipantToGroupMutation();

  // Initialize participant statuses from eventParticipants
  useEffect(() => {
    if (eventParticipants?.length > 0) {
      const initialStatuses = {};
      eventParticipants.forEach(ep => {
        const participantId = ep.enrolleeId || ep.participant?.id;
        if (participantId) {
          initialStatuses[participantId] = ep.attendance_status || 'scheduled';
        }
      });
      setParticipantStatuses(initialStatuses);
    }
  }, [eventParticipants]);

  // Handle attendance status changes with RTK Query
  const handleStatusChange = useCallback(async (participantId, newStatus) => {
    if (updatingParticipant) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please wait for the current status change to complete',
        variant: 'alert',
        alert: { color: 'warning', variant: 'filled' }
      }));
      return;
    }

    setUpdatingParticipant(participantId);
    
    const eventParticipant = eventParticipants.find(ep => {
      const epParticipantId = ep.enrolleeId || ep.participant?.id || ep.id;
      return epParticipantId === participantId;
    });
    
    const participantName = eventParticipant?.participant ? 
      `${eventParticipant.participant.firstName || ''} ${eventParticipant.participant.lastName || ''}`.trim() || 
      `${eventParticipant.firstName || ''} ${eventParticipant.lastName || ''}`.trim() || 'Participant' :
      'Participant';
    
    try {
      if (eventParticipant && eventParticipant.isDirect === false) {
        // For group members, add as direct attendee first
        await addEventParticipant({
          eventId: selectedEvent.id,
          participantId,
          attendance_status: newStatus,
          projectId: singleProject?.id // Add projectId for checklist cache invalidation
        }).unwrap();
      } else {
        // For direct attendees, update status
        const enrolleeId = eventParticipant?.enrolleeId || eventParticipant?.id;
        if (!enrolleeId) {
          throw new Error('Could not find enrollee ID for participant');
        }
        
        await updateAttendanceStatus({ 
          eventId: selectedEvent.id, 
          participantId: enrolleeId, 
          attendance_status: newStatus 
        }).unwrap();
      }

      // Update local state (RTK Query handles cache updates automatically)
      setParticipantStatuses(prev => ({
        ...prev,
        [participantId]: newStatus
      }));

      // Dispatch custom event for Groups tab
      window.dispatchEvent(new CustomEvent('attendanceUpdated', {
        detail: { 
          projectId: selectedEvent.projectId || singleProject?.id,
          eventId: selectedEvent.id,
          participantId: participantId,
          newStatus: newStatus
        }
      }));
      
      dispatch(openSnackbar({
        open: true,
        message: `${participantName} marked as ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        variant: 'alert',
        alert: { color: 'success', variant: 'filled' }
      }));
    } catch (error) {
      console.error('Error updating attendance status:', error);
      dispatch(openSnackbar({
        open: true,
        message: `Failed to update ${participantName}'s attendance status`,
        variant: 'alert',
        alert: { color: 'error', variant: 'filled' }
      }));
    } finally {
      setUpdatingParticipant(null);
    }
  }, [
    dispatch, 
    eventParticipants, 
    selectedEvent, 
    singleProject, 
    updatingParticipant,
    updateAttendanceStatus,
    addEventParticipant
  ]);

  // Handle participant removal from event with RTK Query
  const handleRemoveFromEvent = useCallback(async (participantId, participant) => {
    if (!selectedEvent?.id) {
      console.error('No event ID available for participant removal');
      return;
    }

    const participantName = participant?.participant ? 
      `${participant.participant.firstName || ''} ${participant.participant.lastName || ''}`.trim() :
      `Participant ${participantId}`;

    try {
      await removeEventParticipant({ 
        eventId: selectedEvent.id, 
        participantId 
      }).unwrap();
      
      dispatch(openSnackbar({
        open: true,
        message: `${participantName} removed from event`,
        variant: 'alert',
        alert: { color: 'success', variant: 'filled' }
      }));
    } catch (error) {
      console.error('Error removing participant from event:', error);
      dispatch(openSnackbar({
        open: true,
        message: `Failed to remove ${participantName} from event`,
        variant: 'alert',
        alert: { color: 'error', variant: 'filled' }
      }));
    }
  }, [dispatch, selectedEvent, removeEventParticipant]);

  // Handle moving participant to different group with RTK Query
  const handleMoveToGroup = useCallback(async (participantId, participant, targetGroup) => {
    if (!targetGroup?.id || !singleProject?.id) {
      console.error('Missing target group or project for participant move');
      return;
    }

    const participantName = participant?.participant ? 
      `${participant.participant.firstName || ''} ${participant.participant.lastName || ''}`.trim() :
      `Participant ${participantId}`;

    try {
      const currentGroup = singleProject.groups?.find(group => 
        group.participants?.some(p => p.participantId === participantId)
      );

      await moveParticipantToGroup({
        participantId,
        fromGroupId: currentGroup?.id,
        toGroupId: targetGroup.id
      }).unwrap();

      dispatch(openSnackbar({
        open: true,
        message: currentGroup 
          ? `${participantName} moved from ${currentGroup.groupName} to ${targetGroup.groupName}` 
          : `${participantName} added to ${targetGroup.groupName}`,
        variant: 'alert',
        alert: { color: 'success', variant: 'filled' }
      }));
    } catch (error) {
      console.error('Error moving participant to group:', error);
      dispatch(openSnackbar({
        open: true,
        message: `Failed to move ${participantName} to ${targetGroup.groupName}`,
        variant: 'alert',
        alert: { color: 'error', variant: 'filled' }
      }));
    }
  }, [dispatch, singleProject, moveParticipantToGroup]);

  return {
    participantStatuses,
    updatingParticipant,
    handleStatusChange,
    handleRemoveFromEvent,
    handleMoveToGroup
  };
};