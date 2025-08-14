import React, { useState, useEffect } from 'react';
import axios from 'utils/axios';
import { useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
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
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper
} from '@mui/material';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  TeamOutlined,
  DownOutlined
} from '@ant-design/icons';

const UnifiedRoleAssignmentManager = ({ courseId, modules = [] }) => {
  const dispatch = useDispatch();
  const [courseAssignments, setCourseAssignments] = useState([]);
  const [moduleAssignments, setModuleAssignments] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseSelectedRoles, setCourseSelectedRoles] = useState(new Set());
  const [courseRoleRequirements, setCourseRoleRequirements] = useState(new Map());
  const [moduleSelectedRoles, setModuleSelectedRoles] = useState({});
  const [moduleRoleRequirements, setModuleRoleRequirements] = useState({});
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedModules, setExpandedModules] = useState(new Set());

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load course assignments
      const courseResponse = await axios.get(`/api/courses/manage-role-assignments?courseId=${courseId}`);
      setCourseAssignments(courseResponse.data.assignments);
      setAvailableRoles(courseResponse.data.availableRoles);
      
      // Load module assignments for each module
      const moduleAssignmentsData = {};
      const moduleSelectedRolesData = {};
      const moduleRoleRequirementsData = {};
      
      for (const module of modules) {
        try {
          const moduleResponse = await axios.get(`/api/courses/manage-module-role-assignments?moduleId=${module.id}`);
          moduleAssignmentsData[module.id] = moduleResponse.data.assignments;
          
          // Initialize module state
          const assignedRoleIds = new Set(moduleResponse.data.assignments.map(a => a.roleId));
          const requirements = new Map();
          
          moduleResponse.data.assignments.forEach(assignment => {
            requirements.set(assignment.roleId, assignment.isRequired);
          });
          
          courseResponse.data.availableRoles.forEach(role => {
            if (!requirements.has(role.id)) {
              requirements.set(role.id, true);
            }
          });
          
          moduleSelectedRolesData[module.id] = assignedRoleIds;
          moduleRoleRequirementsData[module.id] = requirements;
        } catch (error) {
          console.error(`Error loading assignments for module ${module.id}:`, error);
          moduleAssignmentsData[module.id] = [];
          moduleSelectedRolesData[module.id] = new Set();
          moduleRoleRequirementsData[module.id] = new Map();
        }
      }
      
      setModuleAssignments(moduleAssignmentsData);
      setModuleSelectedRoles(moduleSelectedRolesData);
      setModuleRoleRequirements(moduleRoleRequirementsData);
      
      // Initialize course state
      const courseAssignedRoleIds = new Set(courseResponse.data.assignments.map(a => a.roleId));
      const courseRequirements = new Map();
      
      courseResponse.data.assignments.forEach(assignment => {
        courseRequirements.set(assignment.roleId, assignment.isRequired);
      });
      
      courseResponse.data.availableRoles.forEach(role => {
        if (!courseRequirements.has(role.id)) {
          courseRequirements.set(role.id, true);
        }
      });
      
      setCourseSelectedRoles(courseAssignedRoleIds);
      setCourseRoleRequirements(courseRequirements);
      setHasChanges(false);
      
    } catch (error) {
      console.error('Error loading role assignments:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to load role assignments',
        variant: 'alert',
        alert: {
          color: 'error'
        }
      }));
      setError('Failed to load role assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseRoleToggle = (roleId) => {
    const newSelectedRoles = new Set(courseSelectedRoles);
    if (newSelectedRoles.has(roleId)) {
      newSelectedRoles.delete(roleId);
    } else {
      newSelectedRoles.add(roleId);
    }
    setCourseSelectedRoles(newSelectedRoles);
    setHasChanges(true);
  };

  const handleCourseRequirementToggle = (roleId) => {
    const newRequirements = new Map(courseRoleRequirements);
    newRequirements.set(roleId, !newRequirements.get(roleId));
    setCourseRoleRequirements(newRequirements);
    setHasChanges(true);
  };

  const handleModuleRoleToggle = (moduleId, roleId) => {
    const newModuleSelectedRoles = { ...moduleSelectedRoles };
    const moduleRoles = new Set(newModuleSelectedRoles[moduleId] || new Set());
    
    if (moduleRoles.has(roleId)) {
      moduleRoles.delete(roleId);
    } else {
      moduleRoles.add(roleId);
    }
    
    newModuleSelectedRoles[moduleId] = moduleRoles;
    setModuleSelectedRoles(newModuleSelectedRoles);
    setHasChanges(true);
  };

  const handleModuleRequirementToggle = (moduleId, roleId) => {
    const newModuleRoleRequirements = { ...moduleRoleRequirements };
    const moduleRequirements = new Map(newModuleRoleRequirements[moduleId] || new Map());
    moduleRequirements.set(roleId, !moduleRequirements.get(roleId));
    newModuleRoleRequirements[moduleId] = moduleRequirements;
    setModuleRoleRequirements(newModuleRoleRequirements);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setError('');
      const promises = [];
      
      // Handle course assignments
      const currentCourseAssignedRoles = new Set(courseAssignments.map(a => a.roleId));
      const coursesToAdd = Array.from(courseSelectedRoles).filter(roleId => !currentCourseAssignedRoles.has(roleId));
      const coursesToRemove = Array.from(currentCourseAssignedRoles).filter(roleId => !courseSelectedRoles.has(roleId));
      const coursesToUpdate = courseAssignments.filter(assignment => 
        courseSelectedRoles.has(assignment.roleId) && 
        assignment.isRequired !== courseRoleRequirements.get(assignment.roleId)
      );
      
      // Course operations
      coursesToAdd.forEach(roleId => {
        promises.push(
          axios.post('/api/courses/manage-role-assignments', {
            courseId: courseId,
            roleId: roleId,
            isRequired: courseRoleRequirements.get(roleId)
          })
        );
      });
      
      coursesToRemove.forEach(roleId => {
        const assignment = courseAssignments.find(a => a.roleId === roleId);
        if (assignment) {
          promises.push(axios.delete(`/api/courses/manage-role-assignments?id=${assignment.id}`));
        }
      });
      
      coursesToUpdate.forEach(assignment => {
        promises.push(
          axios.put('/api/courses/manage-role-assignments', {
            id: assignment.id,
            isRequired: courseRoleRequirements.get(assignment.roleId)
          })
        );
      });
      
      // Handle module assignments
      for (const module of modules) {
        const currentModuleAssignedRoles = new Set((moduleAssignments[module.id] || []).map(a => a.roleId));
        const moduleSelected = moduleSelectedRoles[module.id] || new Set();
        const moduleRequirements = moduleRoleRequirements[module.id] || new Map();
        
        const modulesToAdd = Array.from(moduleSelected).filter(roleId => !currentModuleAssignedRoles.has(roleId));
        const modulesToRemove = Array.from(currentModuleAssignedRoles).filter(roleId => !moduleSelected.has(roleId));
        const modulesToUpdate = (moduleAssignments[module.id] || []).filter(assignment => 
          moduleSelected.has(assignment.roleId) && 
          assignment.isRequired !== moduleRequirements.get(assignment.roleId)
        );
        
        modulesToAdd.forEach(roleId => {
          promises.push(
            axios.post('/api/courses/manage-module-role-assignments', {
              moduleId: module.id,
              roleId: roleId,
              isRequired: moduleRequirements.get(roleId)
            })
          );
        });
        
        modulesToRemove.forEach(roleId => {
          const assignment = (moduleAssignments[module.id] || []).find(a => a.roleId === roleId);
          if (assignment) {
            promises.push(axios.delete(`/api/courses/manage-module-role-assignments?id=${assignment.id}`));
          }
        });
        
        modulesToUpdate.forEach(assignment => {
          promises.push(
            axios.put('/api/courses/manage-module-role-assignments', {
              id: assignment.id,
              isRequired: moduleRequirements.get(assignment.roleId)
            })
          );
        });
      }
      
      await Promise.all(promises);
      await loadData();
      
      // Success message
      dispatch(openSnackbar({
        open: true,
        message: 'Role assignments saved successfully',
        variant: 'alert',
        alert: {
          color: 'success'
        }
      }));
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to save role assignments';
      setError(errorMessage);
      dispatch(openSnackbar({
        open: true,
        message: errorMessage,
        variant: 'alert',
        alert: {
          color: 'error'
        }
      }));
    }
  };

  const handleDiscard = () => {
    loadData(); // Reload original data
    dispatch(openSnackbar({
      open: true,
      message: 'Changes discarded successfully',
      variant: 'alert',
      alert: {
        color: 'info'
      }
    }));
  };

  const toggleModuleExpansion = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const renderRoleList = (selectedRoles, roleRequirements, onRoleToggle, onRequirementToggle, prefix = '') => (
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
                onChange={() => onRoleToggle(role.id)}
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
                  onChange={() => onRequirementToggle(role.id)}
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
  );

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
                  Role Assignments
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage course and module access for participant roles
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
                Save All Changes
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

          {/* Course Level Assignments */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Course Access
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select which participant roles should have access to this course.
            </Typography>
            
            {renderRoleList(
              courseSelectedRoles,
              courseRoleRequirements,
              handleCourseRoleToggle,
              handleCourseRequirementToggle
            )}
          </Box>

          {/* Module Level Assignments */}
          {modules && modules.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Module-Specific Access
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Override course-level access for specific modules. These settings provide granular control over who can access individual modules.
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[...modules]
                  .sort((a, b) => (a.moduleOrder || 0) - (b.moduleOrder || 0))
                  .map((module, index) => (
                    <Paper key={module.id} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 2,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'grey.50' }
                        }}
                        onClick={() => toggleModuleExpansion(module.id)}
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            Module {index + 1}: {module.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            {(moduleSelectedRoles[module.id] || new Set()).size === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                No roles assigned
                              </Typography>
                            ) : (
                              <>
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                  Assigned to:
                                </Typography>
                                {Array.from(moduleSelectedRoles[module.id] || new Set()).map(roleId => {
                                  const role = availableRoles.find(r => r.id === roleId);
                                  const requirements = moduleRoleRequirements[module.id] || new Map();
                                  const isRequired = requirements.get(roleId);
                                  
                                  return role ? (
                                    <Chip
                                      key={roleId}
                                      label={role.title}
                                      size="small"
                                      color={isRequired ? 'success' : 'info'}
                                      variant="outlined"
                                      sx={{ 
                                        fontSize: '0.75rem',
                                        height: 24
                                      }}
                                    />
                                  ) : null;
                                })}
                              </>
                            )}
                          </Box>
                        </Box>
                        <IconButton size="small">
                          <DownOutlined 
                            style={{ 
                              fontSize: 16,
                              transform: expandedModules.has(module.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }} 
                          />
                        </IconButton>
                      </Box>
                      
                      {expandedModules.has(module.id) && (
                        <Box sx={{ p: 3, pt: 0, borderTop: '1px solid', borderColor: 'grey.100' }}>
                          {renderRoleList(
                            moduleSelectedRoles[module.id] || new Set(),
                            moduleRoleRequirements[module.id] || new Map(),
                            (roleId) => handleModuleRoleToggle(module.id, roleId),
                            (roleId) => handleModuleRequirementToggle(module.id, roleId)
                          )}
                        </Box>
                      )}
                    </Paper>
                  ))
                }
              </Box>
            </Box>
          )}

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
                You have made changes to role assignments. Click "Save All Changes" to apply all modifications or "Discard" to revert to the original state.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UnifiedRoleAssignmentManager;