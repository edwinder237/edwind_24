import { useState, useCallback } from 'react';
import { useDispatch } from 'store';
import { addMultipleToEvent, removeParticipantFromEvent } from 'store/commands/eventCommands';

/**
 * RTK Query version of add participants dialog hook
 * Now uses semantic commands for consistency with the architecture
 */
export const useAddParticipantsDialogRTK = (selectedEvent, singleProject, enabled = true) => {
  const dispatch = useDispatch();
  
  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dialog controls
  const openDialog = useCallback(() => setIsOpen(true), []);
  
  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setSelectedGroups([]);
    setSelectedParticipants([]);
    setActiveTab(0);
    setSearchTerm('');
  }, []);

  // Selection handlers
  const toggleGroupSelection = useCallback((group) => {
    setSelectedGroups(prev => {
      const isSelected = prev.some(g => g.id === group.id);
      return isSelected 
        ? prev.filter(g => g.id !== group.id)
        : [...prev, group];
    });
  }, []);

  const toggleParticipantSelection = useCallback((participant) => {
    setSelectedParticipants(prev => {
      const isSelected = prev.some(p => p.id === participant.id);
      return isSelected 
        ? prev.filter(p => p.id !== participant.id)
        : [...prev, participant];
    });
  }, []);

  // Bulk selection handlers
  const selectAllGroups = useCallback((groups) => {
    setSelectedGroups(groups);
  }, []);

  const deselectAllGroups = useCallback(() => {
    setSelectedGroups([]);
  }, []);

  const selectAllParticipants = useCallback((participants) => {
    setSelectedParticipants(participants);
  }, []);

  const deselectAllParticipants = useCallback(() => {
    setSelectedParticipants([]);
  }, []);

  // Apply selections to event using semantic command
  // Accepts optional action ('add' or 'move') and courseEvents for move functionality
  const applySelections = useCallback(async (action = 'add', participantsWithSessions = [], courseEvents = []) => {
    if (selectedGroups.length === 0 && selectedParticipants.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      // If action is 'move', first remove participants from their current sessions
      if (action === 'move' && participantsWithSessions.length > 0) {
        // Get all events these participants are currently in (for this course)
        for (const participant of participantsWithSessions) {
          // Find events this participant is in from the courseEvents passed from dialog
          const participantCurrentEvents = courseEvents.filter(event =>
            event.event_attendees?.some(attendee => attendee.enrolleeId === participant.id)
          );

          // Remove from each current event
          for (const event of participantCurrentEvents) {
            try {
              await dispatch(removeParticipantFromEvent({
                eventId: event.id,
                participantId: participant.id
              })).unwrap();
            } catch (error) {
              console.error(`Error removing participant ${participant.id} from event ${event.id}:`, error);
              // Continue with other removals even if one fails
            }
          }
        }
      }

      // Use semantic command for adding multiple participants and groups
      await dispatch(addMultipleToEvent({
        eventId: selectedEvent.id,
        participants: selectedParticipants,
        groups: selectedGroups,
        projectId: singleProject?.id
      }));

      closeDialog();
    } catch (error) {
      console.error('Error applying selections:', error);
      // Error notification is handled by the semantic command
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, selectedEvent, selectedParticipants, selectedGroups, singleProject, closeDialog]);

  return {
    // State
    isOpen,
    selectedGroups,
    selectedParticipants,
    isLoading,
    activeTab,
    searchTerm,
    
    // Actions
    openDialog,
    closeDialog,
    toggleGroupSelection,
    toggleParticipantSelection,
    selectAllGroups,
    deselectAllGroups,
    selectAllParticipants,
    deselectAllParticipants,
    applySelections,
    setActiveTab,
    setSearchTerm
  };
};