import React, { useState } from 'react';
import { Select, MenuItem, FormControl, CircularProgress, Chip } from '@mui/material';
import { useSelector, useDispatch } from 'store';
import { selectAllGroups } from 'store/entities/groupsSlice';
import { groupCommands } from 'store/commands';

const GroupDropdownCell = ({ value, row }) => {
  const [updating, setUpdating] = useState(false);

  const dispatch = useDispatch();
  const projectId = useSelector(state => state.projectSettings?.projectId);
  const projectParticipantId = row.original.id; // This is the project_participants.id
  const currentGroup = value || null;
  const currentGroupId = currentGroup?.group?.id ? String(currentGroup.group.id) : '';
  const currentGroupName = currentGroup?.group?.groupName || '';

  // Get available groups from normalized entities store (CQRS pattern)
  const availableGroups = useSelector(selectAllGroups);

  // Validate that currentGroupId exists in availableGroups to avoid MUI warning
  const isValidGroupId = currentGroupId && availableGroups.some(group => String(group.id) === currentGroupId);
  const selectValue = isValidGroupId ? currentGroupId : '';

  const handleGroupChange = async (event) => {
    const newGroupId = event.target.value;

    setUpdating(true);

    try {
      // Use single atomic command for moving between groups (CQRS pattern)
      // Command handles validation, execution, and event publishing
      await dispatch(groupCommands.moveParticipantBetweenGroups({
        participantId: projectParticipantId,
        fromGroupId: currentGroupId || null,
        toGroupId: newGroupId || null,
        projectId
      }));

      // Command automatically:
      // 1. Validates input
      // 2. Executes the move in a single database operation
      // 3. Publishes PARTICIPANT_MOVED_BETWEEN_GROUPS event
      // 4. Invalidates cache once (not twice!)
      // 5. Triggers single refetch for smooth UX

    } catch (error) {
      console.error('Error updating group assignment:', error);
      // Error event already published by command
    } finally {
      setUpdating(false);
    }
  };

  return (
    <FormControl size="small" fullWidth disabled={updating}>
      <Select
        value={selectValue}
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

          const selectedGroup = availableGroups.find(group => String(group.id) === selected);
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
          <MenuItem key={group.id} value={String(group.id)}>
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