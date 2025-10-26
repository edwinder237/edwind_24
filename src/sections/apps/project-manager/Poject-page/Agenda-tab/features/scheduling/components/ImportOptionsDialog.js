import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Button,
  Box,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  Chip,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  FileDownload as ImportIcon,
  Groups as GroupsIcon,
  Schedule as ScheduleIcon,
  Assignment as RoleIcon,
  PlaylistPlay as TrainingPlanIcon
} from '@mui/icons-material';
import MainCard from 'components/MainCard';
import { PopupTransition } from 'components/@extended/Transitions';

/**
 * ImportOptionsDialog component for configuring training plan import options
 * Features:
 * - Training plan selection from available plans
 * - Group selection (which groups to include)
 * - Project hours configuration (follow project hours or not)
 * - Role-based assignment options
 * - Progress tracking with job status polling
 * - Validation and error handling
 */
const ImportOptionsDialog = ({ 
  open, 
  onClose, 
  onImport, 
  projectId,
  projectGroups = [], 
  availableRoles = [],
  availableTrainingPlans = [],
  loading = false 
}) => {
  const theme = useTheme();
  
  // Form state
  const [selectedTrainingPlan, setSelectedTrainingPlan] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [followProjectHours, setFollowProjectHours] = useState(true);
  const [assignByRole, setAssignByRole] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [includeAllParticipants, setIncludeAllParticipants] = useState(false);
  const [preserveExistingEvents, setPreserveExistingEvents] = useState(true);
  
  // Progress tracking state
  const [importInProgress, setImportInProgress] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState({ processed: 0, total: 0, status: 'idle' });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTrainingPlan('');
      setSelectedGroups([]);
      setFollowProjectHours(true);
      setAssignByRole(false);
      setSelectedRoles([]);
      setIncludeAllParticipants(false);
      setPreserveExistingEvents(true);
      setImportInProgress(false);
      setJobId(null);
      setProgress({ processed: 0, total: 0, status: 'idle' });
    }
  }, [open]);

  // Progress polling effect
  useEffect(() => {
    let interval;
    if (jobId && importInProgress) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/projects/import-agenda?jobId=${jobId}`);
          const data = await response.json();
          
          setProgress({
            processed: data.processed || 0,
            total: data.total || 0,
            status: data.status || 'unknown',
            message: data.message,
            warnings: data.warnings || 0
          });
          
          if (data.status === 'completed' || data.status === 'failed') {
            setImportInProgress(false);
            clearInterval(interval);
            
            if (data.status === 'completed') {
              // Notify parent component of successful completion
              onImport({ success: true, events: data.events, warnings: data.warnings });
              onClose();
            } else {
              console.error('Import failed:', data.error);
            }
          }
        } catch (error) {
          console.error('Error polling job status:', error);
        }
      }, 1000); // Poll every second
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId, importInProgress, onImport, onClose]);

  // Handlers
  const handleGroupChange = (event) => {
    const value = event.target.value;
    setSelectedGroups(typeof value === 'string' ? value.split(',') : value);
  };

  const handleRoleChange = (event) => {
    const value = event.target.value;
    setSelectedRoles(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSubmit = async () => {
    if (!selectedTrainingPlan) return;
    
    const importOptions = {
      projectId: parseInt(projectId),
      trainingPlanId: parseInt(selectedTrainingPlan),
      selectedGroups: includeAllParticipants ? [] : selectedGroups,
      includeAllParticipants,
      followProjectHours,
      assignByRole,
      selectedRoles: assignByRole ? selectedRoles : [],
      preserveExistingEvents
    };
    
    try {
      setImportInProgress(true);
      
      const response = await fetch('/api/projects/import-agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importOptions)
      });
      
      const data = await response.json();
      
      if (data.success && data.jobId) {
        setJobId(data.jobId);
        setProgress({ processed: 0, total: 0, status: 'starting', message: 'Starting import...' });
      } else {
        console.error('Failed to start import:', data.message);
        setImportInProgress(false);
      }
    } catch (error) {
      console.error('Error starting import:', error);
      setImportInProgress(false);
    }
  };

  const isValid = selectedTrainingPlan && (includeAllParticipants || selectedGroups.length > 0);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={PopupTransition}
      sx={{ 
        '& .MuiDialog-paper': { 
          p: 0,
          borderRadius: 0 
        } 
      }}
    >
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <ImportIcon fontSize="small" />
            <Typography variant="h5">Import Training Plan Schedule</Typography>
          </Stack>
        }
        sx={{ 
          m: 0,
          borderRadius: 0,
          '& .MuiCardHeader-root': {
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 2
          }
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure how the training plan schedule should be imported to this project
        </Typography>
        
        <Grid container spacing={2}>
          {/* Training Plan Selection */}
          <Grid item xs={12}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <TrainingPlanIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Select Training Plan
                </Typography>
              </Stack>
              
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                  Choose which training plan schedule to import
                </FormLabel>
                <Select
                  value={selectedTrainingPlan}
                  onChange={(e) => setSelectedTrainingPlan(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">
                    <Typography color="text.secondary">Select a training plan...</Typography>
                  </MenuItem>
                  {availableTrainingPlans.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      <Box>
                        <Typography>{plan.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {plan.curriculumTitle} • {plan.totalItems} items • {plan.actualDays} days
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Group Selection */}
          <Grid item xs={12}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <GroupsIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Participant Groups
                </Typography>
              </Stack>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeAllParticipants}
                    onChange={(e) => {
                      setIncludeAllParticipants(e.target.checked);
                      if (e.target.checked) {
                        setSelectedGroups([]);
                      }
                    }}
                  />
                }
                label="Include all participants (ignore group selection)"
              />
            </FormGroup>

            {!includeAllParticipants && (
              <FormControl fullWidth sx={{ mt: 1.5 }}>
                <FormLabel sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                  Select groups to include in the schedule
                </FormLabel>
                <Select
                  multiple
                  value={selectedGroups}
                  onChange={handleGroupChange}
                  displayEmpty
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.length === 0 ? (
                        <Typography color="text.secondary">No groups selected</Typography>
                      ) : (
                        selected.map((groupId) => {
                          const group = projectGroups.find(g => g.id === groupId);
                          return (
                            <Chip 
                              key={groupId} 
                              label={group?.groupName || `Group ${groupId}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          );
                        })
                      )}
                    </Box>
                  )}
                >
                  {projectGroups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      <Checkbox checked={selectedGroups.indexOf(group.id) > -1} />
                      <Typography>{group.groupName}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Schedule Options */}
          <Grid item xs={12}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <ScheduleIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Schedule Configuration
                </Typography>
              </Stack>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={followProjectHours}
                    onChange={(e) => setFollowProjectHours(e.target.checked)}
                  />
                }
                label="Follow project working hours and calendar"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -0.5 }}>
                When enabled, imported events will respect the project's defined working hours
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={preserveExistingEvents}
                    onChange={(e) => setPreserveExistingEvents(e.target.checked)}
                  />
                }
                label="Preserve existing events (don't overwrite)"
                sx={{ mt: 1 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -0.5 }}>
                Keep current events and add new ones alongside them
              </Typography>
            </FormGroup>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Role Assignment */}
          <Grid item xs={12}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <RoleIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Role-Based Assignment
                </Typography>
              </Stack>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={assignByRole}
                    onChange={(e) => {
                      setAssignByRole(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedRoles([]);
                      }
                    }}
                  />
                }
                label="Assign events based on participant roles"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -0.5 }}>
                Only assign events to participants with specific roles
              </Typography>
            </FormGroup>

            {assignByRole && (
              <FormControl fullWidth sx={{ mt: 1.5 }}>
                <FormLabel sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                  Select roles to include in assignments
                </FormLabel>
                <Select
                  multiple
                  value={selectedRoles}
                  onChange={handleRoleChange}
                  displayEmpty
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.length === 0 ? (
                        <Typography color="text.secondary">No roles selected</Typography>
                      ) : (
                        selected.map((roleId) => {
                          const role = availableRoles.find(r => r.id === roleId);
                          return (
                            <Chip 
                              key={roleId} 
                              label={role?.title || `Role ${roleId}`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          );
                        })
                      )}
                    </Box>
                  )}
                >
                  {availableRoles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      <Checkbox checked={selectedRoles.indexOf(role.id) > -1} />
                      <Typography>{role.title}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            </Box>
          </Grid>

          {/* Progress Display */}
          {importInProgress && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {progress.message || 'Importing training plan...'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">
                    {progress.total > 0 ? 
                      `${progress.processed}/${progress.total} items processed` : 
                      'Initializing...'
                    }
                  </Typography>
                  {progress.warnings > 0 && (
                    <Chip 
                      label={`${progress.warnings} warnings`} 
                      size="small" 
                      color="warning" 
                      variant="outlined" 
                    />
                  )}
                </Box>
              </Alert>
            </Grid>
          )}

          {/* Validation Alert */}
          {!isValid && !importInProgress && (
            <Grid item xs={12}>
              <Alert severity="warning">
                {!selectedTrainingPlan ? 
                  'Please select a training plan to import' : 
                  'Please select at least one group or enable "Include all participants"'
                }
              </Alert>
            </Grid>
          )}

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Divider sx={{ mb: 1.5 }} />
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button 
                onClick={onClose} 
                disabled={importInProgress}
                variant="outlined"
              >
                {importInProgress ? 'Close' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!isValid || importInProgress}
                variant="contained"
                startIcon={importInProgress ? <CircularProgress size={16} /> : <ImportIcon />}
              >
                {importInProgress ? 'Importing...' : 'Import Schedule'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </MainCard>
    </Dialog>
  );
};

export default ImportOptionsDialog;