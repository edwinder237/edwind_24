import { useState, useEffect } from 'react';
import { useCommands } from 'store/commands/commandDispatcher';

/**
 * Semantic Commands version of attendance management hook
 * Uses intent-based commands instead of technical CRUD operations
 * 
 * This approach provides:
 * - More expressive API that matches user intentions
 * - Better error messages with context
 * - Automatic command logging and auditing
 * - Event emission for cross-cutting concerns
 */
export const useAttendanceManagementCommands = (eventParticipants, selectedEvent, singleProject) => {
  const [participantStatuses, setParticipantStatuses] = useState({});
  const [updatingParticipant, setUpdatingParticipant] = useState(null);

  // Get semantic commands
  const commands = useCommands();

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

  /**
   * Handle attendance status changes using semantic commands
   * The command name reflects the user's intention rather than the technical operation
   */
  const handleStatusChange = async (participantId, newStatus) => {
    if (updatingParticipant) {
      return; // Prevent multiple simultaneous operations
    }

    setUpdatingParticipant(participantId);
    
    const eventParticipant = eventParticipants.find(ep => {
      const epParticipantId = ep.enrolleeId || ep.participant?.id || ep.id;
      return epParticipantId === participantId;
    });

    if (!eventParticipant || !selectedEvent) {
      setUpdatingParticipant(null);
      return;
    }

    try {
      // Use semantic commands based on the intended action
      switch (newStatus) {
        case 'present':
          await commands.markPresent(eventParticipant, selectedEvent);
          break;

        case 'absent':
          await commands.markAbsent(eventParticipant, selectedEvent, 'Marked by instructor');
          break;

        case 'late':
          await commands.recordLateArrival(eventParticipant, selectedEvent);
          break;

        case 'scheduled':
          // For scheduled, we use the technical command since it's more of a reset
          await commands.markPresent(eventParticipant, selectedEvent, 'scheduled');
          break;

        case 'not_needed':
          // Mark as not needed for this event
          await commands.markPresent(eventParticipant, selectedEvent, 'not_needed');
          break;

        default:
          throw new Error(`Unknown attendance status: ${newStatus}`);
      }

      // Update local state optimistically
      setParticipantStatuses(prev => ({
        ...prev,
        [participantId]: newStatus
      }));

      // Emit custom event for other components
      window.dispatchEvent(new CustomEvent('attendanceUpdated', {
        detail: { 
          projectId: selectedEvent.projectId || singleProject?.id,
          eventId: selectedEvent.id,
          participantId: participantId,
          newStatus: newStatus,
          commandUsed: true
        }
      }));

    } catch (error) {
      console.error('Command failed:', error);
      // Error handling is done in the command layer
    } finally {
      setUpdatingParticipant(null);
    }
  };

  /**
   * Remove participant from event using semantic command
   */
  const handleRemoveFromEvent = async (participantId, participant) => {
    if (!selectedEvent?.id) {
      console.error('No event ID available for participant removal');
      return;
    }

    try {
      await commands.removeParticipant(
        participant,
        selectedEvent,
        'Removed by instructor via UI'
      );
    } catch (error) {
      console.error('Failed to remove participant:', error);
    }
  };

  /**
   * Move participant to different group using semantic command
   */
  const handleMoveToGroup = async (participantId, participant, targetGroup) => {
    if (!targetGroup?.id || !singleProject?.id) {
      console.error('Missing target group or project for participant move');
      return;
    }

    try {
      // Find current group
      const currentGroup = singleProject.groups?.find(group => 
        group.participants?.some(p => p.participantId === participantId)
      );

      await commands.moveToGroup(participant, currentGroup, targetGroup);
    } catch (error) {
      console.error('Failed to move participant to group:', error);
    }
  };

  /**
   * Enroll participant in event using semantic command
   */
  const handleEnrollParticipant = async (participant) => {
    if (!selectedEvent?.id) {
      console.error('No event ID available for enrollment');
      return;
    }

    try {
      await commands.enrollParticipant(participant, selectedEvent, 'individual');
    } catch (error) {
      console.error('Failed to enroll participant:', error);
    }
  };

  /**
   * Bulk enrollment using semantic command
   */
  const handleBulkEnrollment = async (participants = [], groups = []) => {
    if (!selectedEvent?.id) {
      console.error('No event ID available for bulk enrollment');
      return;
    }

    try {
      await commands.enrollMultiple(participants, groups, selectedEvent);
    } catch (error) {
      console.error('Failed to perform bulk enrollment:', error);
    }
  };

  /**
   * Quick actions - common operations made simple
   */
  const quickActions = {
    markAllPresent: async () => {
      const promises = eventParticipants.map(participant => 
        commands.markPresent(participant, selectedEvent)
      );
      await Promise.allSettled(promises);
    },

    markSelectedAbsent: async (selectedParticipantIds, reason = 'Bulk absence marking') => {
      const participants = eventParticipants.filter(p => 
        selectedParticipantIds.includes(p.enrolleeId || p.id)
      );
      const promises = participants.map(participant => 
        commands.markAbsent(participant, selectedEvent, reason)
      );
      await Promise.allSettled(promises);
    },

    enrollEntireGroup: async (group) => {
      await commands.enrollGroup(group, selectedEvent);
    }
  };

  return {
    // State
    participantStatuses,
    updatingParticipant,
    
    // Primary actions (semantic)
    handleStatusChange,
    handleRemoveFromEvent,
    handleMoveToGroup,
    handleEnrollParticipant,
    handleBulkEnrollment,
    
    // Quick actions
    quickActions,
    
    // Direct command access
    commands
  };
};