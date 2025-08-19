import React, { useState, useEffect } from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Box,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import { useSelector, useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';

/**
 * RoleDropdownCell component for changing participant roles in the table
 * Features:
 * - Receives available roles as props (no individual API calls)
 * - Updates participant role via API
 * - Shows loading states during operations
 * - Handles errors gracefully
 * - Triggers data refresh after successful update
 */
const RoleDropdownCell = ({ value, row, onUpdate, availableRoles = [], rolesLoading = false }) => {
  const [selectedRole, setSelectedRole] = useState(value?.id || '');
  const [updating, setUpdating] = useState(false);
  
  const dispatch = useDispatch();
  const participantId = row.original.participant?.id;

  // Handle role change
  const handleRoleChange = async (event) => {
    const newRoleId = event.target.value;
    
    if (!participantId) {
      console.error('Participant ID not found');
      return;
    }

    setUpdating(true);
    
    try {
      const response = await fetch('/api/projects/update-participant-role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          roleId: newRoleId || null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedRole(newRoleId);
        // Trigger data refresh to update the table
        if (onUpdate) {
          onUpdate();
        }
        
        // Show success message
        dispatch(openSnackbar({
          open: true,
          message: 'Participant role updated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
      } else {
        console.error('Failed to update role:', data.error);
        // Reset to previous value on error
        setSelectedRole(value?.id || '');
        
        // Show error message
        dispatch(openSnackbar({
          open: true,
          message: `Failed to update role: ${data.error}`,
          variant: 'alert',
          alert: { color: 'error' }
        }));
      }
    } catch (error) {
      console.error('Error updating role:', error);
      // Reset to previous value on error
      setSelectedRole(value?.id || '');
      
      // Show error message
      dispatch(openSnackbar({
        open: true,
        message: 'Error updating participant role',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setUpdating(false);
    }
  };

  // Loading state
  if (rolesLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="caption">Loading...</Typography>
      </Box>
    );
  }

  return (
    <FormControl size="small" fullWidth disabled={updating}>
      <Select
        value={selectedRole}
        onChange={handleRoleChange}
        displayEmpty
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
        {availableRoles.map((role) => (
          <MenuItem key={role.id} value={role.id}>
            {role.title}
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

export default RoleDropdownCell;