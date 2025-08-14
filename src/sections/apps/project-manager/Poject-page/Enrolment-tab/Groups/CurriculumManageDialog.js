import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Stack,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  InputAdornment,
  Paper,
  Avatar,
  Skeleton,
  CircularProgress
} from '@mui/material';
import {
  CloseOutlined,
  BookOutlined,
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'store';
import { getGroupsDetails } from 'store/reducers/projects';

const CurriculumManageDialog = ({ open, onClose, group, onRefresh }) => {
  const dispatch = useDispatch();
  const { singleProject } = useSelector((state) => state.projects);
  
  const [availableCurriculums, setAvailableCurriculums] = useState([]);
  const [assignedCurriculums, setAssignedCurriculums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Centralized refresh function using Redux
  const refreshGroupsData = async () => {
    if (singleProject?.id) {
      try {
        console.log('Refreshing groups data via Redux after curriculum change...');
        await dispatch(getGroupsDetails(singleProject.id));
        onRefresh && onRefresh(); // Also call parent refresh if provided
        console.log('Groups data refreshed successfully');
      } catch (error) {
        console.error('Error refreshing groups data:', error);
      }
    }
  };

  // Fetch available curriculums for this group
  const fetchAvailableCurriculums = async () => {
    if (!group?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/fetch-available-curriculums?groupId=${group.id}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableCurriculums(data.availableCurriculums || []);
      } else {
        showNotification('Failed to fetch available curriculums', 'error');
      }
    } catch (error) {
      console.error('Error fetching available curriculums:', error);
      showNotification('Failed to fetch available curriculums', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch curriculums already assigned to this group
  const fetchAssignedCurriculums = async () => {
    if (!group?.id) return;
    
    try {
      const response = await fetch(`/api/groups/fetch-group-curriculums?groupId=${group.id}`);
      const data = await response.json();
      
      if (data.success) {
        setAssignedCurriculums(data.curriculums || []);
      } else {
        showNotification('Failed to fetch assigned curriculums', 'error');
      }
    } catch (error) {
      console.error('Error fetching assigned curriculums:', error);
      showNotification('Failed to fetch assigned curriculums', 'error');
    }
  };

  // Assign curriculum to group
  const assignCurriculumToGroup = async (curriculumId) => {
    try {
      const response = await fetch('/api/groups/assign-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          groupId: group.id, 
          curriculumId,
          assignedBy: 'user' // You might want to get this from user context
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Curriculum assigned successfully', 'success');
        // First refresh local dialog data
        await Promise.all([
          fetchAvailableCurriculums(),
          fetchAssignedCurriculums()
        ]);
        // Then refresh groups data with progress recalculation
        console.log('Curriculum added successfully, refreshing groups data...');
        await refreshGroupsData();
      } else {
        showNotification(result.error || 'Failed to assign curriculum', 'error');
      }
    } catch (error) {
      console.error('Error assigning curriculum:', error);
      showNotification('Failed to assign curriculum', 'error');
    }
  };

  // Remove curriculum from group
  const removeCurriculumFromGroup = async (curriculumId) => {
    try {
      const response = await fetch('/api/groups/remove-curriculum', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          groupId: group.id, 
          curriculumId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Curriculum removed successfully', 'success');
        // First refresh local dialog data
        await Promise.all([
          fetchAvailableCurriculums(),
          fetchAssignedCurriculums()
        ]);
        // Then refresh groups data with progress recalculation
        console.log('Curriculum removed successfully, refreshing groups data...');
        await refreshGroupsData();
      } else {
        showNotification(result.error || 'Failed to remove curriculum', 'error');
      }
    } catch (error) {
      console.error('Error removing curriculum:', error);
      showNotification('Failed to remove curriculum', 'error');
    }
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  const closeNotification = () => {
    setNotification({ open: false, message: '', severity: 'success' });
  };

  // Filter curriculums based on search term
  const filteredAvailableCurriculums = availableCurriculums.filter(curriculum =>
    curriculum.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curriculum.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (open && group?.id) {
      fetchAvailableCurriculums();
      fetchAssignedCurriculums();
    }
  }, [open, group?.id]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <TeamOutlined />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Manage Group Curriculums
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {group?.groupName} - Assign curriculums to this group
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={onClose} size="large">
              <CloseOutlined />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          {/* Search */}
          <TextField
            fullWidth
            placeholder="Search curriculums..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          {/* Content */}
          <Grid container spacing={3} sx={{ height: 'calc(100% - 80px)' }}>
            {/* Available Curriculums */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlusOutlined />
                  Available Curriculums ({filteredAvailableCurriculums.length})
                </Typography>
                
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {loading ? (
                    <Stack spacing={2}>
                      {[1, 2, 3].map((item) => (
                        <Skeleton key={item} variant="rectangular" height={120} />
                      ))}
                    </Stack>
                  ) : filteredAvailableCurriculums.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        {searchTerm ? 'No curriculums match your search' : 'No curriculums available to assign'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Add curriculums to the project first to assign them to groups
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {filteredAvailableCurriculums.map((curriculum) => (
                        <Card key={curriculum.id} sx={{ border: '1px solid #e0e0e0' }}>
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {curriculum.title}
                                </Typography>
                                {curriculum.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {curriculum.description}
                                  </Typography>
                                )}
                                <Chip 
                                  size="small" 
                                  label="Available"
                                  color="primary"
                                  variant="outlined"
                                  sx={{ mt: 1 }}
                                />
                              </Box>
                              
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<PlusOutlined />}
                                onClick={() => assignCurriculumToGroup(curriculum.id)}
                              >
                                Assign
                              </Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Assigned Curriculums */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleOutlined />
                  Assigned Curriculums ({assignedCurriculums.length})
                </Typography>
                
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {assignedCurriculums.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        No curriculums assigned to this group yet
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {assignedCurriculums.map((assignment) => {
                        const curriculum = assignment.curriculum;
                        
                        return (
                          <Card 
                            key={assignment.assignmentId} 
                            sx={{ border: '1px solid #4caf50' }}
                          >
                            <CardContent>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {curriculum.title}
                                  </Typography>
                                  {curriculum.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                      {curriculum.description}
                                    </Typography>
                                  )}
                                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                    <Chip 
                                      size="small" 
                                      label={`${curriculum.courseCount} courses`}
                                      color="primary"
                                      variant="outlined"
                                    />
                                    <Chip 
                                      size="small" 
                                      label="Active"
                                      color="success"
                                    />
                                  </Stack>
                                  {assignment.assignedAt && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                      Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                                    </Typography>
                                  )}
                                </Box>
                                
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeCurriculumFromGroup(curriculum.id)}
                                >
                                  <DeleteOutlined />
                                </IconButton>
                              </Stack>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Close
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
    </>
  );
};

export default CurriculumManageDialog;