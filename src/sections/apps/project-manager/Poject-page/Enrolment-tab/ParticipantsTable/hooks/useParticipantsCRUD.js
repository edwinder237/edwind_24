import { useCallback } from 'react';
import { useDispatch } from 'store';
import { 
  addParticipant,
  addManyParticipants,
  removeParticipant,
  removeManyParticipant
} from 'store/reducers/projects';
import { openSnackbar } from 'store/reducers/snackbar';

/**
 * Custom hook for participant CRUD operations
 */
export const useParticipantsCRUD = ({
  data,
  groups,
  projectId,
  index,
  onRefresh
}) => {
  const dispatch = useDispatch();

  // Add single participant
  const handleAddParticipant = useCallback(async (newParticipant) => {
    try {
      await dispatch(addParticipant(data, newParticipant, groups, index || 0, projectId));
      
      const participantName = newParticipant.participant 
        ? `${newParticipant.participant.firstName} ${newParticipant.participant.lastName}`
        : `${newParticipant.firstName} ${newParticipant.lastName}`;
      
      dispatch(openSnackbar({
        open: true,
        message: `${participantName} has been successfully added to the project!`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));
      
      await onRefresh?.();
    } catch (err) {
      console.error('Failed to add participant:', err);
      
      let errorMessage = 'Failed to add participant. Please try again.';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.error === "Email already exists") {
        errorMessage = `A participant with this email already exists. Please use a different email address.`;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      
      throw err;
    }
  }, [data, groups, projectId, index, dispatch, onRefresh]);

  // Add multiple participants
  const handleAddMany = useCallback(async (newParticipants) => {
    try {
      const participantCount = newParticipants.length;
      await dispatch(addManyParticipants(projectId, newParticipants, data));
      
      dispatch(openSnackbar({
        open: true,
        message: `${participantCount} participant${participantCount > 1 ? 's' : ''} added successfully.`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));
      
      await onRefresh?.();
    } catch (err) {
      console.error('Failed to add multiple participants:', err);
      
      let errorMessage = 'Failed to add participants. Please try again.';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
      
      throw err;
    }
  }, [data, projectId, dispatch, onRefresh]);

  // Update participant
  const handleUpdate = useCallback(async (enrollee) => {
    try {
      const payload = {
        participantId: enrollee.id,
        updates: enrollee
      };
      
      const response = await fetch('/api/participants/updateParticipant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update participant');
      }
      
      const participantName = enrollee.firstName && enrollee.lastName 
        ? `${enrollee.firstName} ${enrollee.lastName}`
        : 'Participant';
        
      dispatch(openSnackbar({
        open: true,
        message: `${participantName} updated successfully.`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));
      
      await onRefresh?.();
    } catch (err) {
      console.error('Failed to update participant:', err);
      
      let errorMessage = 'Failed to update participant. Please try again.';
      if (err.message && err.message.includes('Email already exists')) {
        errorMessage = 'Email already exists. Please use a different email address.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
    }
  }, [dispatch, onRefresh]);

  // Remove single participant
  const handleRemove = useCallback(async (selectedId) => {
    try {
      const updatedParticipants = [...data];
      const participantToRemove = updatedParticipants.find(p => p?.id === selectedId);
      const participantName = participantToRemove?.participant 
        ? `${participantToRemove.participant.firstName} ${participantToRemove.participant.lastName}`
        : 'Participant';
      
      const participantIndex = updatedParticipants.findIndex(p => p?.id === selectedId);
      
      if (participantIndex !== -1) {
        updatedParticipants.splice(participantIndex, 1);
        await dispatch(removeParticipant(updatedParticipants, projectId, selectedId));
        
        dispatch(openSnackbar({
          open: true,
          message: `${participantName} removed successfully.`,
          variant: 'alert',
          alert: { color: 'success' },
          close: false
        }));
        
        await onRefresh?.();
      } else {
        dispatch(openSnackbar({
          open: true,
          message: 'Participant not found.',
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        }));
      }
    } catch (err) {
      console.error('Error removing participant:', err);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to remove participant. Please try again.',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
    }
  }, [data, projectId, dispatch, onRefresh]);

  // Remove multiple participants
  const handleRemoveMany = useCallback(async (selectedIds) => {
    try {
      const participantCount = selectedIds.length;
      const updatedParticipants = data.filter(p => !selectedIds.includes(p.id));
      
      await dispatch(removeManyParticipant(updatedParticipants, selectedIds));
      
      dispatch(openSnackbar({
        open: true,
        message: `${participantCount} participant${participantCount > 1 ? 's' : ''} removed successfully.`,
        variant: 'alert',
        alert: { color: 'success' },
        close: false
      }));
      
      await onRefresh?.();
    } catch (err) {
      console.error('Error removing participants:', err);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to remove participants. Please try again.',
        variant: 'alert',
        alert: { color: 'error' },
        close: false
      }));
    }
  }, [data, dispatch, onRefresh]);

  return {
    handleAddParticipant,
    handleAddMany,
    handleUpdate,
    handleRemove,
    handleRemoveMany
  };
};