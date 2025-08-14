import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Skeleton,
  Alert,
  Button,
  Collapse,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  BookOutlined,
  DeleteOutlined,
  DownOutlined,
  RightOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'store';
import { 
  getGroupsDetails,
  toggleCurriculumExpansion,
  removeCurriculumFromExpansion
} from 'store/reducers/projects';

const GroupCurriculumWidget = ({ groupId, onManageCurriculums, refreshTrigger }) => {
  const dispatch = useDispatch();
  const { expandedCurriculums, singleProject } = useSelector((state) => state.projects);
  
  // Local state for detailed curriculum data (with courses, events, etc.)
  const [curriculums, setCurriculums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for curriculum removal
  const [confirmDialog, setConfirmDialog] = useState({ open: false, curriculum: null });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [removing, setRemoving] = useState(false);
  
  // Get expanded curriculums for this group from Redux (for persistence)
  const groupExpandedCurriculums = expandedCurriculums[groupId] || [];

  // Fetch detailed curriculum data with courses and events
  const fetchGroupCurriculums = async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/groups/fetch-group-curriculums?groupId=${groupId}`);
      const data = await response.json();
      
      if (data.success) {
        const newCurriculums = data.curriculums || [];
        setCurriculums(newCurriculums);
        
        // Clean up expansion state - remove any curriculum IDs that no longer exist
        if (groupExpandedCurriculums.length > 0) {
          const existingCurriculumIds = new Set(newCurriculums.map(assignment => assignment.curriculum.id));
          groupExpandedCurriculums.forEach(curriculumId => {
            if (!existingCurriculumIds.has(curriculumId)) {
              dispatch(removeCurriculumFromExpansion({ groupId, curriculumId }));
            }
          });
        }
      } else {
        setError('Failed to fetch curriculums');
      }
    } catch (error) {
      console.error('Error fetching group curriculums:', error);
      setError('Failed to fetch curriculums');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCurriculumExpansion = (curriculumId) => {
    dispatch(toggleCurriculumExpansion({ groupId, curriculumId }));
  };

  // Refresh groups data after curriculum changes
  const refreshGroupsData = async () => {
    if (singleProject?.id) {
      try {
        console.log('Refreshing groups data after curriculum removal...');
        await dispatch(getGroupsDetails(singleProject.id));
        console.log('Groups data refreshed successfully');
      } catch (error) {
        console.error('Error refreshing groups data:', error);
      }
    }
  };

  // Show notification
  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  // Close notification
  const closeNotification = () => {
    setNotification({ open: false, message: '', severity: 'success' });
  };

  // Handle remove curriculum confirmation
  const handleRemoveCurriculum = (curriculum) => {
    setConfirmDialog({ open: true, curriculum });
  };

  // Close confirmation dialog
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ open: false, curriculum: null });
  };

  // Remove curriculum from group
  const removeCurriculumFromGroup = async () => {
    if (!confirmDialog.curriculum) return;

    try {
      setRemoving(true);
      const response = await fetch('/api/groups/remove-curriculum', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          groupId: groupId, 
          curriculumId: confirmDialog.curriculum.id
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Curriculum removed successfully', 'success');
        
        // Remove from Redux expansion state
        dispatch(removeCurriculumFromExpansion({ 
          groupId, 
          curriculumId: confirmDialog.curriculum.id 
        }));
        
        // Refresh local curriculum data
        await fetchGroupCurriculums();
        
        // Also refresh groups data for the status indicators
        setTimeout(async () => {
          await refreshGroupsData();
        }, 500);
      } else {
        showNotification(result.error || 'Failed to remove curriculum', 'error');
      }
    } catch (error) {
      console.error('Error removing curriculum:', error);
      showNotification('Failed to remove curriculum', 'error');
    } finally {
      setRemoving(false);
      handleCloseConfirmDialog();
    }
  };

  // Fetch data on component mount and groupId change
  useEffect(() => {
    if (groupId) {
      fetchGroupCurriculums();
    }
  }, [groupId]);

  // Refresh when external trigger changes (e.g., from CurriculumManageDialog)
  useEffect(() => {
    if (groupId && refreshTrigger) {
      fetchGroupCurriculums();
    }
  }, [refreshTrigger]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Stack spacing={1}>
          {[1, 2].map((item) => (
            <Skeleton key={item} variant="rectangular" height={60} />
          ))}
        </Stack>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error" 
          action={
            <Button size="small" onClick={fetchGroupCurriculums}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Empty state
  if (curriculums.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <InfoCircleOutlined style={{ fontSize: '32px', color: '#ccc', marginBottom: 8 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          No curriculums assigned
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Click "Add course" to assign curriculums to this group
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <List dense disablePadding>
        {curriculums.map((assignment) => {
          const curriculum = assignment.curriculum;
          const isExpanded = groupExpandedCurriculums.includes(curriculum.id);
          
          return (
            <React.Fragment key={assignment.assignmentId}>
              <ListItem
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleCurriculumExpansion(curriculum.id)}
                      >
                        {isExpanded ? <DownOutlined /> : <RightOutlined />}
                      </IconButton>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {curriculum.title}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={`${curriculum.courseCount} courses`}
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                  }
                  secondary={
                    curriculum.description && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ ml: 4, display: 'block', mt: 0.5 }}
                      >
                        {curriculum.description}
                      </Typography>
                    )
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveCurriculum(curriculum)}
                    disabled={removing}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'error.lighter' 
                      }
                    }}
                  >
                    <DeleteOutlined />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ ml: 2, mr: 1, mb: 1 }}>
                  <Card variant="outlined" sx={{ backgroundColor: 'grey.50' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOutlined />
                        Courses ({curriculum.courseCount})
                      </Typography>
                      
                      {curriculum.courses && curriculum.courses.length > 0 ? (
                        <Stack spacing={0.5}>
                          {curriculum.courses.map((course) => (
                            <Box
                              key={course.id}
                              sx={{
                                p: 1,
                                backgroundColor: 'background.paper',
                                borderRadius: 0.5,
                                border: '1px solid',
                                borderColor: 'divider'
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {course.title}
                                  </Typography>
                                  {course.isCompleted && (
                                    <CheckCircleOutlined 
                                      style={{ 
                                        color: '#4caf50', 
                                        fontSize: '16px' 
                                      }} 
                                    />
                                  )}
                                </Stack>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <Chip 
                                    size="small" 
                                    label={`${course.eventCount || 0} events`}
                                    color="secondary"
                                    variant="outlined"
                                  />
                                  {course.totalParticipants > 0 && (
                                    <Chip 
                                      size="small" 
                                      label={`${course.completedParticipants}/${course.totalParticipants} completed`}
                                      color={course.isCompleted ? "success" : "default"}
                                      variant="outlined"
                                    />
                                  )}
                                </Stack>
                              </Stack>
                              {course.summary && (
                                <Typography variant="caption" color="text.secondary">
                                  {course.summary}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No courses in this curriculum
                        </Typography>
                      )}
                      
                      {assignment.assignedAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              </Collapse>
            </React.Fragment>
          );
        })}
      </List>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirmDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Remove Curriculum
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove "{confirmDialog.curriculum?.title}" from this group?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. The curriculum will no longer be associated with this group.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>
            Cancel
          </Button>
          <Button
            onClick={removeCurriculumFromGroup}
            color="error"
            variant="contained"
            disabled={removing}
          >
            {removing ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={closeNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GroupCurriculumWidget;