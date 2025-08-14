import React, { useState, useEffect } from 'react';
import axios from 'utils/axios';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Checkbox,
  Alert,
  CircularProgress,
  Divider,
  FormGroup
} from '@mui/material';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons';

const RoleAssignmentManager = ({ 
  entityId, 
  entityType, // 'course' or 'module'
  title = "Role Assignments"
}) => {
  const [assignments, setAssignments] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState(new Set());
  const [roleRequirements, setRoleRequirements] = useState(new Map());
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const apiEndpoint = entityType === 'course' 
    ? '/api/courses/manage-role-assignments'
    : '/api/courses/manage-module-role-assignments';

  const entityParam = entityType === 'course' ? 'courseId' : 'moduleId';

  useEffect(() => {
    loadData();
  }, [entityId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiEndpoint}?${entityParam}=${entityId}`);
      setAssignments(response.data.assignments);
      setAvailableRoles(response.data.availableRoles);
      
      // Initialize selectedRoles and roleRequirements based on current assignments
      const assignedRoleIds = new Set(response.data.assignments.map(a => a.roleId));
      const requirements = new Map();
      
      response.data.assignments.forEach(assignment => {
        requirements.set(assignment.roleId, assignment.isRequired);
      });
      
      // Set default requirements for unassigned roles
      response.data.availableRoles.forEach(role => {
        if (!requirements.has(role.id)) {
          requirements.set(role.id, true); // Default to required
        }
      });
      
      setSelectedRoles(assignedRoleIds);
      setRoleRequirements(requirements);
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading role assignments:', error);
      setError('Failed to load role assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (roleId) => {
    const newSelectedRoles = new Set(selectedRoles);
    if (newSelectedRoles.has(roleId)) {
      newSelectedRoles.delete(roleId);
    } else {
      newSelectedRoles.add(roleId);
    }
    setSelectedRoles(newSelectedRoles);
    setHasChanges(true);
  };

  const handleRequirementToggle = (roleId) => {
    const newRequirements = new Map(roleRequirements);
    newRequirements.set(roleId, !newRequirements.get(roleId));
    setRoleRequirements(newRequirements);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setError('');
      
      // Get current assignments
      const currentAssignedRoles = new Set(assignments.map(a => a.roleId));
      const newSelectedRoles = selectedRoles;
      
      // Find roles to add
      const rolesToAdd = Array.from(newSelectedRoles).filter(roleId => !currentAssignedRoles.has(roleId));
      
      // Find roles to remove
      const rolesToRemove = Array.from(currentAssignedRoles).filter(roleId => !newSelectedRoles.has(roleId));
      
      // Find roles to update (requirement changed)
      const rolesToUpdate = assignments.filter(assignment => 
        newSelectedRoles.has(assignment.roleId) && 
        assignment.isRequired !== roleRequirements.get(assignment.roleId)
      );
      
      // Execute all operations
      const promises = [];
      
      // Add new roles
      rolesToAdd.forEach(roleId => {
        promises.push(
          axios.post(apiEndpoint, {
            [entityParam]: entityId,
            roleId: roleId,
            isRequired: roleRequirements.get(roleId)
          })
        );
      });
      
      // Remove roles
      rolesToRemove.forEach(roleId => {
        const assignment = assignments.find(a => a.roleId === roleId);
        if (assignment) {
          promises.push(axios.delete(`${apiEndpoint}?id=${assignment.id}`));
        }
      });
      
      // Update roles
      rolesToUpdate.forEach(assignment => {
        promises.push(
          axios.put(apiEndpoint, {
            id: assignment.id,
            isRequired: roleRequirements.get(assignment.roleId)
          })
        );
      });
      
      await Promise.all(promises);
      await loadData(); // This will reset hasChanges to false
      
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save role assignments');
    }
  };

  const handleDiscard = () => {
    // Reset to original state
    const assignedRoleIds = new Set(assignments.map(a => a.roleId));
    const requirements = new Map();
    
    assignments.forEach(assignment => {
      requirements.set(assignment.roleId, assignment.isRequired);
    });
    
    // Set default requirements for unassigned roles
    availableRoles.forEach(role => {
      if (!requirements.has(role.id)) {
        requirements.set(role.id, true);
      }
    });
    
    setSelectedRoles(assignedRoleIds);
    setRoleRequirements(requirements);
    setHasChanges(false);
    setError('');
  };

  const getAvailableRolesForAdd = () => {
    const assignedRoleIds = assignments.map(a => a.roleId);
    return availableRoles.filter(role => !assignedRoleIds.includes(role.id));
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  backgroundColor: 'primary.main',
                  color: 'white'
                }}
              >
                <TeamOutlined style={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage participant role access for this {entityType}
                </Typography>
              </Box>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              {hasChanges && (
                <Chip 
                  label="Unsaved changes" 
                  size="small" 
                  color="warning" 
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              )}
              <Button
                variant="outlined"
                onClick={handleDiscard}
                disabled={!hasChanges}
                sx={{ 
                  minWidth: 100,
                  fontWeight: 500
                }}
              >
                Discard
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!hasChanges}
                sx={{ 
                  minWidth: 120,
                  fontWeight: 500,
                  boxShadow: hasChanges ? 2 : 1
                }}
              >
                Save Changes
              </Button>
            </Box>
          }
          sx={{ pb: 1 }}
        />
        <Divider />
        <CardContent sx={{ pt: 2 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                '& .MuiAlert-message': { fontWeight: 500 }
              }} 
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {availableRoles.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              backgroundColor: 'grey.50',
              border: '2px dashed',
              borderColor: 'grey.200'
            }}>
              <Box sx={{ 
                display: 'inline-flex',
                p: 2,
                backgroundColor: 'grey.100',
                mb: 2
              }}>
                <UserOutlined style={{ fontSize: 32, color: '#999' }} />
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                No participant roles available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create participant roles in your organization settings first
              </Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ 
                mb: 3,
                p: 2.5,
                backgroundColor: 'primary.50',
                border: '1px solid',
                borderColor: 'primary.100'
              }}>
                <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500, mb: 0.5 }}>
                  📋 Instructions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select participant roles that should have access to this {entityType}. Use the switches to mark assignments as required or optional.
                </Typography>
              </Box>
              
              <Box sx={{ 
                bgcolor: 'background.paper', 
                border: '1px solid', 
                borderColor: 'grey.200',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                {availableRoles.map((role, index) => (
                  <React.Fragment key={role.id}>
                    <ListItem 
                      sx={{ 
                        py: 3,
                        px: 3,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: selectedRoles.has(role.id) ? 'primary.50' : 'grey.50'
                        },
                        backgroundColor: selectedRoles.has(role.id) ? 'primary.25' : 'transparent'
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 48 }}>
                        <Checkbox
                          checked={selectedRoles.has(role.id)}
                          onChange={() => handleRoleToggle(role.id)}
                          color="primary"
                          sx={{ 
                            '& .MuiSvgIcon-root': { 
                              fontSize: 24
                            },
                            '&:hover': {
                              backgroundColor: 'transparent'
                            },
                            '& .MuiTouchRipple-root': {
                              display: 'none'
                            }
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                              {role.title}
                            </Typography>
                            {selectedRoles.has(role.id) && (
                              <Chip
                                label={roleRequirements.get(role.id) ? 'Required' : 'Optional'}
                                size="small"
                                color={roleRequirements.get(role.id) ? 'success' : 'info'}
                                variant="filled"
                                sx={{ 
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  height: 24
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {role.description || 'No description available'}
                          </Typography>
                        }
                        sx={{ mr: 3 }}
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          gap: 0.5,
                          minWidth: 80
                        }}>
                          <Switch
                            checked={roleRequirements.get(role.id) || false}
                            onChange={() => handleRequirementToggle(role.id)}
                            color="primary"
                            disabled={!selectedRoles.has(role.id)}
                            sx={{
                              '& .MuiSwitch-track': {
                                backgroundColor: !selectedRoles.has(role.id) ? 'grey.300' : undefined
                              }
                            }}
                          />
                          <Typography 
                            variant="caption" 
                            color={!selectedRoles.has(role.id) ? 'text.disabled' : 'text.secondary'}
                            sx={{ fontWeight: 500, textAlign: 'center' }}
                          >
                            {roleRequirements.get(role.id) ? 'Required' : 'Optional'}
                          </Typography>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < availableRoles.length - 1 && (
                      <Divider sx={{ borderColor: 'grey.200' }} />
                    )}
                  </React.Fragment>
                ))}
              </Box>

              {hasChanges && (
                <Alert 
                  severity="info" 
                  sx={{ 
                    mt: 3,
                    backgroundColor: 'info.50',
                    border: '1px solid',
                    borderColor: 'info.200',
                    '& .MuiAlert-message': { fontWeight: 500 }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    Unsaved Changes Detected
                  </Typography>
                  <Typography variant="body2">
                    Click "Save Changes" to apply your modifications or "Discard" to revert to the original state.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RoleAssignmentManager;