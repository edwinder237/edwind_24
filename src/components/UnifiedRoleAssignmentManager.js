import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'utils/axios';
import { useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';

// Global cache and request deduplication with enhanced tracking
class APICache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.requestCount = new Map(); // Track how many times each URL is requested
    this.instances = new Set(); // Track component instances
  }

  registerInstance(id) {
    this.instances.add(id);
    console.log('🔗 Registered instance:', id, 'Total instances:', this.instances.size);
  }

  unregisterInstance(id) {
    this.instances.delete(id);
    console.log('🔗 Unregistered instance:', id, 'Total instances:', this.instances.size);
  }

  async get(url) {
    // Track request count
    const count = this.requestCount.get(url) || 0;
    this.requestCount.set(url, count + 1);
    
    if (count > 0) {
      console.log(`⚠️  DUPLICATE REQUEST #${count + 1} for:`, url);
    }

    // Check if request is already pending
    if (this.pendingRequests.has(url)) {
      console.log('🔄 Returning pending request:', url);
      return this.pendingRequests.get(url);
    }

    // Check cache with longer duration
    if (this.cache.has(url)) {
      const cached = this.cache.get(url);
      if (Date.now() - cached.timestamp < 30000) { // Increased to 30 second cache
        console.log('✅ Cache hit:', url);
        return cached.data;
      }
      this.cache.delete(url);
    }

    console.log('🌐 Making new API request:', url);
    // Make request and cache promise
    const promise = axios.get(url).then(response => {
      this.cache.set(url, {
        data: response,
        timestamp: Date.now()
      });
      this.pendingRequests.delete(url);
      return response;
    }).catch(error => {
      this.pendingRequests.delete(url);
      throw error;
    });

    this.pendingRequests.set(url, promise);
    return promise;
  }

  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
    this.requestCount.clear();
  }

  clearCourse(courseId) {
    // Clear course-specific cache entries including bulk endpoint
    for (const [url] of this.cache) {
      if (url.includes(`courseId=${courseId}`) || url.includes(`moduleId=`) || url.includes('bulk-role-assignments')) {
        this.cache.delete(url);
      }
    }
    // Clear request counts for this course
    for (const [url] of this.requestCount) {
      if (url.includes(`courseId=${courseId}`) || url.includes(`moduleId=`) || url.includes('bulk-role-assignments')) {
        this.requestCount.delete(url);
      }
    }
  }

  getStats() {
    console.log('📊 API Cache Stats:');
    console.log('  - Cache entries:', this.cache.size);
    console.log('  - Pending requests:', this.pendingRequests.size);
    console.log('  - Active instances:', this.instances.size);
    console.log('  - Request counts:', Object.fromEntries(this.requestCount));
  }
}

const apiCache = new APICache();
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

const UnifiedRoleAssignmentManager = ({ courseId, modules = [], onRefresh }) => {
  const dispatch = useDispatch();
  const instanceId = useRef(`role-mgr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
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
  const loadingRef = useRef(false);
  const dataLoadedRef = useRef(false);
  const lastLoadTime = useRef(0);

  // Register this component instance
  useEffect(() => {
    apiCache.registerInstance(instanceId.current);
    return () => {
      apiCache.unregisterInstance(instanceId.current);
    };
  }, []);

  const loadData = useCallback(async () => {
    // Prevent multiple simultaneous calls and too frequent calls (min 2 seconds between calls)
    const now = Date.now();
    if (loadingRef.current || !courseId || (now - lastLoadTime.current < 2000)) {
      console.log('⚡ loadData blocked:', { loading: loadingRef.current, courseId, timeSinceLastLoad: now - lastLoadTime.current });
      return;
    }
    
    try {
      console.log('🚀 Starting BULK loadData for course:', courseId, 'modules:', modules.length);
      loadingRef.current = true;
      lastLoadTime.current = now;
      setLoading(true);
      
      let courseAssignments, availableRoles, moduleAssignmentsData, moduleSelectedRolesData, moduleRoleRequirementsData;
      
      try {
        // 🎯 MAJOR OPTIMIZATION: Use new bulk endpoint to get ALL data in one request
        const bulkResponse = await apiCache.get(`/api/courses/bulk-role-assignments?courseId=${courseId}`);
        const { course, modules: moduleData, availableRoles: roles } = bulkResponse.data;
        
        console.log('✨ Bulk API response received:', {
          courseAssignments: course.assignments.length,
          moduleCount: moduleData.length,
          availableRoles: roles.length,
          totalQueries: bulkResponse.data.totalQueries
        });
        
        // Set course data
        courseAssignments = course.assignments;
        availableRoles = roles;
        
        // Process module data from bulk response
        moduleAssignmentsData = {};
        moduleSelectedRolesData = {};
        moduleRoleRequirementsData = {};
        
        moduleData.forEach((module) => {
          moduleAssignmentsData[module.id] = module.assignments;
          
          // Initialize module state - start with all course-assigned roles checked by default
          const assignedRoleIds = new Set();
          const requirements = new Map();
          
          // Set all course roles as assigned by default
          course.assignments.forEach(assignment => {
            const role = roles.find(r => r.id === assignment.roleId);
            if (role) {
              assignedRoleIds.add(role.id);
              // Use existing module assignment requirement if it exists, otherwise inherit from course
              const existingModuleAssignment = module.assignments.find(a => a.roleId === role.id);
              requirements.set(role.id, existingModuleAssignment ? existingModuleAssignment.isRequired : assignment.isRequired);
            }
          });
          
          moduleSelectedRolesData[module.id] = assignedRoleIds;
          moduleRoleRequirementsData[module.id] = requirements;
        });
        
      } catch (bulkError) {
        console.warn('⚠️ Bulk endpoint failed, falling back to individual requests:', bulkError.message);
        
        // FALLBACK: Use original individual requests
        const courseResponse = await apiCache.get(`/api/courses/manage-role-assignments?courseId=${courseId}`);
        courseAssignments = courseResponse.data.assignments;
        availableRoles = courseResponse.data.availableRoles;
        
        // Load module assignments in parallel
        const modulePromises = modules.map(async (module) => {
          try {
            const moduleResponse = await apiCache.get(`/api/courses/manage-module-role-assignments?moduleId=${module.id}`);
            return { moduleId: module.id, response: moduleResponse, error: null };
          } catch (error) {
            console.error(`Error loading assignments for module ${module.id}:`, error);
            return { moduleId: module.id, response: null, error };
          }
        });
        
        const moduleResults = await Promise.all(modulePromises);
        
        // Process fallback results
        moduleAssignmentsData = {};
        moduleSelectedRolesData = {};
        moduleRoleRequirementsData = {};
        
        moduleResults.forEach(({ moduleId, response, error }) => {
          if (response) {
            moduleAssignmentsData[moduleId] = response.data.assignments;
            
            const assignedRoleIds = new Set();
            const requirements = new Map();
            
            courseAssignments.forEach(assignment => {
              const role = availableRoles.find(r => r.id === assignment.roleId);
              if (role) {
                assignedRoleIds.add(role.id);
                const existingModuleAssignment = response.data.assignments.find(a => a.roleId === role.id);
                requirements.set(role.id, existingModuleAssignment ? existingModuleAssignment.isRequired : assignment.isRequired);
              }
            });
            
            moduleSelectedRolesData[moduleId] = assignedRoleIds;
            moduleRoleRequirementsData[moduleId] = requirements;
          } else {
            moduleAssignmentsData[moduleId] = [];
            
            const assignedRoleIds = new Set();
            const requirements = new Map();
            
            courseAssignments.forEach(assignment => {
              const role = availableRoles.find(r => r.id === assignment.roleId);
              if (role) {
                assignedRoleIds.add(role.id);
                requirements.set(role.id, assignment.isRequired);
              }
            });
            
            moduleSelectedRolesData[moduleId] = assignedRoleIds;
            moduleRoleRequirementsData[moduleId] = requirements;
          }
        });
      }
      
      // Apply the data regardless of which method was used
      setCourseAssignments(courseAssignments);
      setAvailableRoles(availableRoles);
      
      setModuleAssignments(moduleAssignmentsData);
      setModuleSelectedRoles(moduleSelectedRolesData);
      setModuleRoleRequirements(moduleRoleRequirementsData);
      
      // Initialize course state
      const courseAssignedRoleIds = new Set(courseAssignments.map(a => a.roleId));
      const courseRequirements = new Map();
      
      courseAssignments.forEach(assignment => {
        courseRequirements.set(assignment.roleId, assignment.isRequired);
      });
      
      availableRoles.forEach(role => {
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
      loadingRef.current = false;
      dataLoadedRef.current = true;
    }
  }, [courseId]);

  useEffect(() => {
    // Reset loading state when courseId changes
    dataLoadedRef.current = false;
    loadingRef.current = false;
    
    if (courseId) {
      loadData();
    }
  }, [courseId, loadData]);

  // Method to force refresh data (can be called externally)
  const refreshData = useCallback(() => {
    dataLoadedRef.current = false;
    loadingRef.current = false;
    lastLoadTime.current = 0; // Reset time limit
    apiCache.clearCourse(courseId); // Clear course-specific cache
    loadData();
  }, [loadData, courseId]);

  // Expose refresh method to parent component
  useEffect(() => {
    if (onRefresh) {
      onRefresh(refreshData);
    }
  }, [onRefresh, refreshData]);

  // Cleanup cache on unmount and log stats periodically
  useEffect(() => {
    const statsInterval = setInterval(() => {
      apiCache.getStats();
    }, 10000); // Log stats every 10 seconds

    return () => {
      clearInterval(statsInterval);
      apiCache.clearCourse(courseId);
    };
  }, [courseId]);

  const handleCourseRoleToggle = (roleId) => {
    const newSelectedRoles = new Set(courseSelectedRoles);
    const isRemoving = newSelectedRoles.has(roleId);
    
    if (isRemoving) {
      newSelectedRoles.delete(roleId);
      
      // If removing role from course, also remove it from all modules
      const newModuleSelectedRoles = { ...moduleSelectedRoles };
      const newModuleRequirements = { ...moduleRoleRequirements };
      
      modules.forEach(module => {
        if (newModuleSelectedRoles[module.id]) {
          newModuleSelectedRoles[module.id] = new Set(newModuleSelectedRoles[module.id]);
          newModuleSelectedRoles[module.id].delete(roleId);
        }
        
        if (newModuleRequirements[module.id]) {
          const updatedRequirements = new Map(newModuleRequirements[module.id]);
          updatedRequirements.delete(roleId);
          newModuleRequirements[module.id] = updatedRequirements;
        }
      });
      
      setModuleSelectedRoles(newModuleSelectedRoles);
      setModuleRoleRequirements(newModuleRequirements);
    } else {
      newSelectedRoles.add(roleId);
      
      // If adding role to course, add it to all modules by default
      const newModuleSelectedRoles = { ...moduleSelectedRoles };
      const newModuleRequirements = { ...moduleRoleRequirements };
      const courseRequirement = courseRoleRequirements.get(roleId) ?? true;
      
      modules.forEach(module => {
        if (newModuleSelectedRoles[module.id]) {
          newModuleSelectedRoles[module.id] = new Set(newModuleSelectedRoles[module.id]);
          newModuleSelectedRoles[module.id].add(roleId);
        } else {
          newModuleSelectedRoles[module.id] = new Set([roleId]);
        }
        
        if (newModuleRequirements[module.id]) {
          const updatedRequirements = new Map(newModuleRequirements[module.id]);
          updatedRequirements.set(roleId, courseRequirement);
          newModuleRequirements[module.id] = updatedRequirements;
        } else {
          newModuleRequirements[module.id] = new Map([[roleId, courseRequirement]]);
        }
      });
      
      setModuleSelectedRoles(newModuleSelectedRoles);
      setModuleRoleRequirements(newModuleRequirements);
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

  // Get roles that are assigned to the course (for module access filtering)
  const getCourseAssignedRoles = useMemo(() => {
    const assignedRoleIds = new Set(courseAssignments.map(a => a.roleId));
    return availableRoles.filter(role => assignedRoleIds.has(role.id));
  }, [courseAssignments, availableRoles]);

  const renderRoleList = (selectedRoles, roleRequirements, onRoleToggle, onRequirementToggle, prefix = '', rolesToShow = null) => (
    <List 
      sx={{ 
        bgcolor: 'background.paper', 
        border: '1px solid', 
        borderColor: 'grey.200',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: 0,
        '& .MuiListItem-root': {
          borderRadius: 0
        }
      }}
      disablePadding
    >
      {(rolesToShow || availableRoles).map((role, index) => (
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
            disableGutters
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
    </List>
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
              handleCourseRequirementToggle,
              '',
              getCourseAssignedRoles
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
                            (roleId) => handleModuleRequirementToggle(module.id, roleId),
                            '',
                            getCourseAssignedRoles
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