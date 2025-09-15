import React, { useState } from 'react';
import { Select, MenuItem, FormControl, CircularProgress } from '@mui/material';
import { useSelector, useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';

const RoleDropdownCell = ({ value, row, onUpdate }) => {
  const [updating, setUpdating] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  
  const dispatch = useDispatch();
  const { singleProject } = useSelector((state) => state.projects);
  const participantId = row.original.participant?.id;
  const currentRoleTitle = value?.title || 'No Role';
  const selectedRole = value?.id || '';

  // Fetch available roles when dropdown is opened
  const fetchAvailableRoles = async () => {
    if (rolesLoaded || rolesLoading) return;
    
    setRolesLoading(true);
    try {
      const response = await fetch(`/api/projects/available-roles?projectId=${singleProject?.id}`);
      const data = await response.json();
      
      if (data.success && data.roles) {
        setAvailableRoles(data.roles);
        setRolesLoaded(true);
      } else {
        console.error('Failed to fetch available roles:', data.error);
        setAvailableRoles([]);
      }
    } catch (error) {
      console.error('Error fetching available roles:', error);
      setAvailableRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  const handleRoleChange = async (event) => {
    const newRoleId = event.target.value;
    if (!participantId) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/projects/update-participant-role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, roleId: newRoleId || null })
      });

      const data = await response.json();
      
      if (data.success) {
        onUpdate?.();
        dispatch(openSnackbar({
          open: true,
          message: 'Role updated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else {
        dispatch(openSnackbar({
          open: true,
          message: `Failed to update role: ${data.error}`,
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: 'Error updating role',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <FormControl size="small" fullWidth disabled={updating}>
      <Select
        value={selectedRole}
        onChange={handleRoleChange}
        onOpen={fetchAvailableRoles}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) return <em>No Role</em>;
          if (rolesLoaded) {
            return availableRoles.find(role => role.id === selected)?.title || currentRoleTitle;
          }
          return currentRoleTitle;
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