import React, { useState, useEffect } from 'react';
import {
  Drawer,
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
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  Paper,
  Avatar,
  Skeleton
} from '@mui/material';
import {
  CloseOutlined,
  BookOutlined,
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'store';
import { getProjectCurriculums } from 'store/reducers/projects';

const CurriculumManageDrawer = ({ open, onClose, projectId }) => {
  const dispatch = useDispatch();
  const [availableCurriculums, setAvailableCurriculums] = useState([]);
  const [projectCurriculums, setProjectCurriculums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Don't render if projectId is not available
  if (!projectId) {
    return null;
  }

  // Fetch available curriculums (all curriculums, but we'll filter UI display)
  const fetchAvailableCurriculums = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/curriculums/fetchCurriculums');
      const data = await response.json();
      
      setAvailableCurriculums(data || []);
    } catch (error) {
      console.error('Error fetching curriculums:', error);
      showNotification('Failed to fetch curriculums', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch project curriculums
  const fetchProjectCurriculums = async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch('/api/projects/fetchProjectCurriculums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      const data = await response.json();
      setProjectCurriculums(data || []);
    } catch (error) {
      console.error('Error fetching project curriculums:', error);
      showNotification('Failed to fetch project curriculums', 'error');
    }
  };

  // Add curriculum to project
  const addCurriculumToProject = async (curriculumId) => {
    try {
      const response = await fetch('/api/projects/add-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: parseInt(projectId), 
          curriculumId: parseInt(curriculumId) 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Curriculum added successfully', 'success');
        fetchProjectCurriculums(); // Refresh project curriculums in drawer
        // Also refresh the main curriculum tab data via Redux
        dispatch(getProjectCurriculums(projectId));
      } else {
        showNotification(result.message || 'Failed to add curriculum', 'error');
      }
    } catch (error) {
      console.error('Error adding curriculum:', error);
      showNotification('Failed to add curriculum', 'error');
    }
  };

  // Remove curriculum from project
  const removeCurriculumFromProject = async (curriculumId) => {
    if (!projectId || !curriculumId) {
      showNotification('Project ID and Curriculum ID are required', 'error');
      return;
    }

    try {
      const response = await fetch('/api/projects/remove-curriculum', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: parseInt(projectId), 
          curriculumId: parseInt(curriculumId) 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Curriculum removed successfully', 'success');
        fetchProjectCurriculums(); // Refresh project curriculums in drawer
        // Also refresh the main curriculum tab data via Redux
        dispatch(getProjectCurriculums(projectId));
      } else {
        showNotification(result.message || 'Failed to remove curriculum', 'error');
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

  // Check if curriculum is already added to this specific project
  const isCurriculumAdded = (curriculumId) => {
    return projectCurriculums.some(pc => pc.curriculum.id === curriculumId);
  };

  // Filter curriculums based on search term
  const filteredCurriculums = availableCurriculums.filter(curriculum =>
    curriculum.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curriculum.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (open && projectId) {
      fetchAvailableCurriculums();
      fetchProjectCurriculums();
    }
  }, [open, projectId]);

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            height: '80vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <BookOutlined />
              </Avatar>
              <Typography variant="h5" fontWeight="bold">
                Manage Curriculums
              </Typography>
            </Stack>
            <IconButton onClick={onClose} size="large">
              <CloseOutlined />
            </IconButton>
          </Stack>

          <Divider sx={{ mb: 3 }} />

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
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Grid container spacing={3} sx={{ height: '100%' }}>
              {/* Available Curriculums */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlusOutlined />
                    All Curriculums ({filteredCurriculums.length})
                  </Typography>
                  
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {loading ? (
                      <Stack spacing={2}>
                        {[1, 2, 3].map((item) => (
                          <Skeleton key={item} variant="rectangular" height={120} />
                        ))}
                      </Stack>
                    ) : filteredCurriculums.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          {searchTerm ? 'No curriculums match your search' : 'No curriculums available to add'}
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={2}>
                        {filteredCurriculums.map((curriculum) => {
                          const isAdded = isCurriculumAdded(curriculum.id);
                          
                          return (
                            <Card 
                              key={curriculum.id} 
                              sx={{ 
                                opacity: isAdded ? 0.5 : 1,
                                border: isAdded ? '1px solid #4caf50' : '1px solid #e0e0e0'
                              }}
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
                                        label={`${curriculum.courseCount || 0} courses`}
                                        color="primary"
                                        variant="outlined"
                                      />
                                      {curriculum.totalDuration && (
                                        <Chip 
                                          size="small" 
                                          label={`${curriculum.totalDuration} hours`}
                                          color="secondary"
                                          variant="outlined"
                                        />
                                      )}
                                    </Stack>
                                  </Box>
                                  
                                  <Stack spacing={1}>
                                    {isAdded ? (
                                      <Chip 
                                        icon={<CheckCircleOutlined />}
                                        label="Added"
                                        color="success"
                                        size="small"
                                      />
                                    ) : (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<PlusOutlined />}
                                        onClick={() => addCurriculumToProject(curriculum.id)}
                                      >
                                        Add
                                      </Button>
                                    )}
                                  </Stack>
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

              {/* Project Curriculums */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlined />
                    Project Curriculums ({projectCurriculums.length})
                  </Typography>
                  
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {projectCurriculums.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          No curriculums added to this project yet
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={2}>
                        {projectCurriculums.map((projectCurriculum) => {
                          const curriculum = projectCurriculum.curriculum;
                          const courseCount = curriculum.curriculum_courses?.length || 0;
                          
                          return (
                            <Card 
                              key={curriculum.id} 
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
                                        label={`${courseCount} courses`}
                                        color="primary"
                                        variant="outlined"
                                      />
                                      <Chip 
                                        size="small" 
                                        label="Active"
                                        color="success"
                                      />
                                    </Stack>
                                  </Box>
                                  
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => removeCurriculumFromProject(curriculum.id)}
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
          </Box>
        </Box>
      </Drawer>

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

export default CurriculumManageDrawer;