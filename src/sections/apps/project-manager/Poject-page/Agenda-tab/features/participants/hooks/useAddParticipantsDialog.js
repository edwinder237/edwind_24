import { useState, useCallback } from 'react';
import { useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { addMultipleToEvent } from 'store/commands/eventCommands';

/**
 * Custom hook for managing the add participants dialog
 * Handles dialog state, participant/group selection, and bulk operations
 */
export const useAddParticipantsDialog = (selectedEvent, singleProject) => {
  const dispatch = useDispatch();
  
  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Apply selections to event
  const applySelections = useCallback(async () => {
    if (selectedGroups.length === 0 && selectedParticipants.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
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