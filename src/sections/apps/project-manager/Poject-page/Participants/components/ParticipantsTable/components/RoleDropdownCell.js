import React, { useState } from 'react';
import { Select, MenuItem, FormControl, CircularProgress } from '@mui/material';
import { useSelector, useDispatch } from 'store';
import { useGetAvailableRolesQuery } from 'store/api/projectApi';
import { participantCommands } from 'store/commands';

const RoleDropdownCell = ({ value, row }) => {
  const [updating, setUpdating] = useState(false);

  const dispatch = useDispatch();
  const projectId = useSelector(state => state.projectSettings?.projectId);

  // Use participant.id (the nested participant's actual ID) for the API call
  const participantId = row.original.participant?.id;
  const currentRoleTitle = value?.title || 'No Role';
  const selectedRole = value?.id || '';

  // RTK Query hook - fetch available roles with caching (QUERY)
  const { data: availableRoles = [], isLoading: rolesLoading } = useGetAvailableRolesQuery(projectId, {
    skip: !projectId
  });

  // Validate that selectedRole exists in availableRoles to avoid MUI warning
  const isValidRole = selectedRole && availableRoles.some(role => role.id === selectedRole);
  const selectValue = isValidRole ? selectedRole : '';

  const handleRoleChange = async (event) => {
    const newRoleId = event.target.value;

    setUpdating(true);

    try {
      // Find the role object from available roles
      const roleObject = newRoleId ? availableRoles.find(r => r.id === parseInt(newRoleId)) : null;

      // Use COMMAND for mutation (CQRS pattern)
      // Command handles validation, execution, and event publishing
      await dispatch(participantCommands.updateParticipant({
        participantId,
        updates: { role: roleObject },
        projectId
      }));

      // Command automatically:
      // 1. Validates input
      // 2. Updates participant role
      // 3. Publishes PARTICIPANT_UPDATED and PARTICIPANT_ROLE_UPDATED events
      // 4. Invalidates cache and triggers refetch

    } catch (error) {
      console.error('Error updating role:', error);
      // Error event already published by command
    } finally {
      setUpdating(false);
    }
  };

  return (
    <FormControl size="small" fullWidth disabled={updating}>
      <Select
        value={selectValue}
        onChange={handleRoleChange}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) return <em>No Role</em>;
          return availableRoles.find(role => role.id === selected)?.title || currentRoleTitle;
        }}
        sx={{ 
          minWidth: 120,
          '& .MuiSelect-select': {
            padding: '4px 8px'
          }
        }}
      >
        <MenuItem value="">
          <em>No Role</em>
        </MenuItem>
        {rolesLoading ? (
          <MenuItem disabled>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            Loading roles...
          </MenuItem>
        ) : (
          availableRoles.map((role) => (
            <MenuItem key={role.id} value={role.id}>
              {role.title}
            </MenuItem>
          ))
        )}
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

export default RoleDropdownCell;