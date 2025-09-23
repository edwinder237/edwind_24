import React, { useState } from 'react';
import { Select, MenuItem, FormControl, CircularProgress, Chip } from '@mui/material';
import { useSelector, useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';

const GroupDropdownCell = ({ value, row, onUpdate }) => {
  const [updating, setUpdating] = useState(false);
  
  const dispatch = useDispatch();
  const { singleProject } = useSelector((state) => state.projects);
  const projectParticipantId = row.original.id; // This is the project_participants.id
  const currentGroup = value || null;
  const currentGroupId = currentGroup?.group?.id || '';
  const currentGroupName = currentGroup?.group?.groupName || '';
  
  // Get available groups from project data
  const availableGroups = singleProject?.groups || [];

  const handleGroupChange = async (event) => {
    const newGroupId = event.target.value;
    
    if (!projectParticipantId) {
      dispatch(openSnackbar({
        open: true,
        message: 'Invalid participant ID',
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return;
    }

    setUpdating(true);
    
    try {
      // Step 1: If currently in a group, remove from current group
      if (currentGroupId) {
        const removeResponse = await fetch('/api/projects/remove-participant-from-group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            groupId: currentGroupId, 
            participantId: projectParticipantId 
          })
        });
        
        const removeData = await removeResponse.json();
        if (!removeData.success) {
          throw new Error(removeData.error || 'Failed to remove from current group');
        }
      }
      
      // Step 2: If a new group is selected (not "No Group"), add to new group
      if (newGroupId) {
        const addResponse = await fetch('/api/projects/add-participant-to-group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            groupId: newGroupId, 
            participantId: projectParticipantId 
          })
        });
        
        const addData = await addResponse.json();
        if (!addData.success) {
          throw new Error(addData.error || 'Failed to add to new group');
        }
      }
      
      // Refresh the data to show updated group assignment
      onUpdate?.();
      
      const message = newGroupId 
        ? 'Group assignment updated successfully' 
        : 'Participant removed from group successfully';
        
      dispatch(openSnackbar({
        open: true,
        message,
        variant: 'alert',
        alert: { color: 'success' }
      }));
      
    } catch (error) {
      console.error('Error updating group assignment:', error);
      
      // Check if this is a participant not found error - suggest refresh
      if (error.message && error.message.includes('Participant not found')) {
        dispatch(openSnackbar({
          open: true,
          message: 'Participant data is out of sync. Please refresh the page to reload current data.',
          variant: 'alert',
          alert: { color: 'warning' }
        }));
        
        // Automatically refresh the data
        setTimeout(() => {
          onUpdate?.();
        }, 1000);
      } else {
        dispatch(openSnackbar({
          open: true,
          message: `Failed to update group assignment: ${error.message}`,
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <FormControl size="small" fullWidth disabled={updating}>
      <Select
        value={currentGroupId}
        onChange={handleGroupChange}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) {
            return (
              <Chip
                color="error"
                label="No Group"
                size="small"
                variant="filled"
              />
            );
          }
          
          const selectedGroup = availableGroups.find(group => group.id === selected);
          if (selectedGroup) {
            const chipColor = selectedGroup.chipColor || "#1976d2";
            return (
              <Chip
                style={{ backgroundColor: chipColor, color: "#fff" }}
                label={selectedGroup.groupName}
                size="small"
                variant="filled"
              />
            );
          }
          
          return currentGroupName || 'Unknown Group';
        }}
        sx={{ 
          minWidth: 120,
          '& .MuiSelect-select': {
            padding: '4px 8px'
          }
        }}
      >
        <MenuItem value="">
          <Chip
            color="error"
            label="No Group"
            size="small"
            variant="filled"
          />
        </MenuItem>
        {availableGroups.map((group) => (
          <MenuItem key={group.id} value={group.id}>
            <Chip
              style={{ backgroundColor: group.chipColor || "#1976d2", color: "#fff" }}
              label={group.groupName}
              size="small"
              variant="filled"
            />
          </MenuItem>
        ))}
      </Select>
      {updating && (
        <CircularProgress 
          size={16} 
          sx={{ 
            position: 'absolute', 
            right: 24, 
            top: '50%', 
            transform: 'translateY(-50%)' 
          }} 
        />
      )}
    </FormControl>
  );
};

export default GroupDropdownCell;