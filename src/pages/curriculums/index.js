import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Alert,
  Skeleton,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Fab,
  Breadcrumbs,
  Link,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText as MuiListItemText
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  Support as SupportIcon,
  Business as BusinessIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  ContentCopy as CopyIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/reducers/snackbar';
import MainCard from 'components/MainCard';
import Layout from 'layout';

const CurriculumsPage = () => {
  const dispatch = useDispatch();
  const [curriculums, setCurriculums] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    selectedCourses: []
  });

  // Fetch all curriculums
  const fetchCurriculums = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/curriculums/fetchCurriculums');
      const data = await response.json();
      
      setCurriculums(data || []);
    } catch (error) {
      console.error('Error fetching curriculums:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to fetch curriculums',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses/fetchCourses');
      const data = await response.json();
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Create curriculum
  const handleCreateCurriculum = async () => {
    if (!formData.title.trim()) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please enter a curriculum title',
        variant: 'alert',
        alert: { color: 'warning' }
      }));
      return;
    }

    try {
      setActionLoading(true);
      
      // Create curriculum first
      const response = await fetch('/api/curriculums/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Add courses to curriculum if any selected
        if (formData.selectedCourses.length > 0) {
          await Promise.all(
            formData.selectedCourses.map(courseId =>
              fetch('/api/curriculums/add-course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  curriculumId: result.curriculum.id,
                  courseId
                })
              })
            )
          );
        }
        
        dispatch(openSnackbar({
          open: true,
          message: 'Curriculum created successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        setCreateDialogOpen(false);
        setFormData({ title: '', description: '', selectedCourses: [] });
        fetchCurriculums();
      } else {
        throw new Error(result.message || 'Failed to create curriculum');
      }
    } catch (error) {
      console.error('Error creating curriculum:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to create curriculum',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setActionLoading(false);
    }
  };

  // Update curriculum
  const handleUpdateCurriculum = async () => {
    if (!formData.title.trim()) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please enter a curriculum title',
        variant: 'alert',
        alert: { color: 'warning' }
      }));
      return;
    }

    try {
      setActionLoading(true);
      
      // Update curriculum basic info first
      const response = await fetch('/api/curriculums/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCurriculum.id,
          title: formData.title,
          description: formData.description
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Handle course changes
        const currentCourseIds = selectedCurriculum.curriculum_courses?.map(cc => cc.courseId) || [];
        const newCourseIds = formData.selectedCourses;
        
        // Find courses to remove
        const coursesToRemove = currentCourseIds.filter(id => !newCourseIds.includes(id));
        // Find courses to add
        const coursesToAdd = newCourseIds.filter(id => !currentCourseIds.includes(id));
        
        // Remove courses
        await Promise.all(
          coursesToRemove.map(courseId =>
            fetch('/api/curriculums/remove-course', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                curriculumId: selectedCurriculum.id,
                courseId
              })
            })
          )
        );
        
        // Add courses
        await Promise.all(
          coursesToAdd.map(courseId =>
            fetch('/api/curriculums/add-course', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                curriculumId: selectedCurriculum.id,
                courseId
              })
            })
          )
        );
        
        dispatch(openSnackbar({
          open: true,
          message: 'Curriculum updated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        setEditDialogOpen(false);
        setSelectedCurriculum(null);
        setFormData({ title: '', description: '', selectedCourses: [] });
        fetchCurriculums();
      } else {
        throw new Error(result.message || 'Failed to update curriculum');
      }
    } catch (error) {
      console.error('Error updating curriculum:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to update curriculum',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setActionLoading(false);
    }
  };

  // Duplicate curriculum
  const handleDuplicateCurriculum = async (curriculum) => {
    try {
      setDuplicatingId(curriculum.id);
      const response = await fetch('/api/curriculums/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: curriculum.id })
      });
      
      const result = await response.json();
      
      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Curriculum duplicated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        setMenuAnchor(null);
        setSelectedCurriculum(null);
        fetchCurriculums();
      } else {
        throw new Error(result.message || 'Failed to duplicate curriculum');
      }
    } catch (error) {
      console.error('Error duplicating curriculum:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to duplicate curriculum',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setDuplicatingId(null);
    }
  };

  // Delete curriculum
  const handleDeleteCurriculum = async () => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/curriculums/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCurriculum.id })
      });
      
      const result = await response.json();
      
      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Curriculum deleted successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        setDeleteDialogOpen(false);
        setSelectedCurriculum(null);
        fetchCurriculums();
      } else {
        throw new Error(result.message || 'Failed to delete curriculum');
      }
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to delete curriculum',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setActionLoading(false);
    }
  };

  // Open create dialog
  const handleOpenCreateDialog = () => {
    setFormData({ title: '', description: '', selectedCourses: [] });
    setCreateDialogOpen(true);
  };

  // Open edit dialog
  const handleOpenEditDialog = (curriculum) => {
    setSelectedCurriculum(curriculum);
    setFormData({
      title: curriculum.title,
      description: curriculum.description || '',
      selectedCourses: curriculum.curriculum_courses?.map(cc => cc.courseId) || []
    });
    setEditDialogOpen(true);
    setMenuAnchor(null);
  };

  // Open delete dialog
  const handleOpenDeleteDialog = (curriculum) => {
    setSelectedCurriculum(curriculum);
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
  };

  // Handle menu click
  const handleMenuClick = (event, curriculum) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedCurriculum(curriculum);
  };

  // Close menu
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedCurriculum(null);
  };

  // Handle form input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    fetchCurriculums();
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} md={6} lg={4} key={item}>
                <Skeleton variant="rectangular" height={200} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" href="/">
            Home
          </Link>
          <Typography color="text.primary">Curriculums</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Curriculums
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage learning curriculums and their support activities
            </Typography>
          </Box>
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            size="large"
          >
            Create Curriculum
          </Button>
        </Stack>

        {/* Curriculums Grid */}
        {curriculums.length === 0 ? (
          <MainCard>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <MenuBookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Curriculums Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first curriculum to get started with organized learning paths.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                size="large"
              >
                Create First Curriculum
              </Button>
            </Box>
          </MainCard>
        ) : (
          <Grid container spacing={3}>
            {curriculums.map((curriculum) => (
              <Grid item xs={12} md={6} lg={4} key={curriculum.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => theme.shadows[8]
                    }
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <MenuBookIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {curriculum.title}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, curriculum)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Stack>
                        {curriculum.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {curriculum.description}
                          </Typography>
                        )}
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                      <Chip
                        icon={<SchoolIcon />}
                        label={`${curriculum.courseCount || 0} Courses`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        icon={<SupportIcon />}
                        label={`${curriculum.supportActivitiesCount || 0} Support`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                      <Chip
                        icon={<BusinessIcon />}
                        label={`${curriculum.projectCount || 0} Projects`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>

                    <Typography variant="caption" color="text.secondary">
                      Created {new Date(curriculum.createdAt).toLocaleDateString()}
                      {curriculum.updatedAt && (
                        <span> • Updated {new Date(curriculum.updatedAt).toLocaleDateString()}</span>
                      )}
                    </Typography>
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Stack direction="row" spacing={1} width="100%">
                      <NextLink href={`/curriculums/edit/${curriculum.id}`} passHref>
                        <Button
                          startIcon={<EditIcon />}
                          size="small"
                          variant="contained"
                          sx={{ flex: 1 }}
                        >
                          Edit & Manage
                        </Button>
                      </NextLink>
                      
                      <Tooltip title="Duplicate Curriculum">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateCurriculum(curriculum);
                          }}
                          disabled={duplicatingId === curriculum.id}
                          sx={{ 
                            border: 1, 
                            borderColor: 'divider',
                            '&:hover': {
                              backgroundColor: 'primary.main',
                              color: 'white',
                              borderColor: 'primary.main'
                            }
                          }}
                        >
                          {duplicatingId === curriculum.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <CopyIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { minWidth: 200 }
          }}
        >
          <MenuItem onClick={() => handleOpenEditDialog(selectedCurriculum)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Details</ListItemText>
          </MenuItem>
          
          <MenuItem 
            component={NextLink}
            href={`/curriculums/edit/${selectedCurriculum?.id}`}
            onClick={handleMenuClose}
          >
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View & Manage</ListItemText>
          </MenuItem>
          
          <MenuItem 
            onClick={() => handleDuplicateCurriculum(selectedCurriculum)}
            disabled={duplicatingId === selectedCurriculum?.id}
          >
            <ListItemIcon>
              {duplicatingId === selectedCurriculum?.id ? (
                <CircularProgress size={16} />
              ) : (
                <CopyIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem 
            onClick={() => handleOpenDeleteDialog(selectedCurriculum)}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Create Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              maxWidth: '500px',
              width: '100%'
            }
          }}
        >
          <MainCard
            title="Create New Curriculum"
            secondary={
              <IconButton onClick={() => setCreateDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            }
            content={false}
          >
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Curriculum Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  placeholder="e.g., Full Stack Web Development"
                />
                
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the curriculum objectives and learning outcomes..."
                />

                <FormControl fullWidth>
                  <InputLabel>Select Courses</InputLabel>
                  <Select
                    multiple
                    value={formData.selectedCourses}
                    onChange={(e) => handleInputChange('selectedCourses', e.target.value)}
                    input={<OutlinedInput label="Select Courses" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const course = courses.find(c => c.id === value);
                          return (
                            <Chip 
                              key={value} 
                              label={course?.title || `Course ${value}`} 
                              size="small" 
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        <Checkbox checked={formData.selectedCourses.indexOf(course.id) > -1} />
                        <MuiListItemText 
                          primary={course.title}
                          secondary={`${course.level} • ${course.courseCategory}`}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button 
                    onClick={() => setCreateDialogOpen(false)}
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCurriculum}
                    variant="contained"
                    startIcon={actionLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={actionLoading || !formData.title.trim()}
                  >
                    Create Curriculum
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </MainCard>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              maxWidth: '500px',
              width: '100%'
            }
          }}
        >
          <MainCard
            title="Edit Curriculum"
            secondary={
              <IconButton onClick={() => setEditDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            }
            content={false}
          >
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Curriculum Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
                
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the curriculum objectives and learning outcomes..."
                />

                <FormControl fullWidth>
                  <InputLabel>Select Courses</InputLabel>
                  <Select
                    multiple
                    value={formData.selectedCourses}
                    onChange={(e) => handleInputChange('selectedCourses', e.target.value)}
                    input={<OutlinedInput label="Select Courses" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const course = courses.find(c => c.id === value);
                          return (
                            <Chip 
                              key={value} 
                              label={course?.title || `Course ${value}`} 
                              size="small" 
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        <Checkbox checked={formData.selectedCourses.indexOf(course.id) > -1} />
                        <MuiListItemText 
                          primary={course.title}
                          secondary={`${course.level} • ${course.courseCategory}`}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button 
                    onClick={() => setEditDialogOpen(false)}
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateCurriculum}
                    variant="contained"
                    startIcon={actionLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={actionLoading || !formData.title.trim()}
                  >
                    Update Curriculum
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </MainCard>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
        >
          <DialogTitle>
            <Typography variant="h6" color="error">
              Delete Curriculum
            </Typography>
          </DialogTitle>
          
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to delete "{selectedCurriculum?.title}"?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone. All associated support activities will also be deleted.
              {selectedCurriculum?.projectCount > 0 && (
                <span style={{ color: 'orange', fontWeight: 'bold' }}>
                  <br />Warning: This curriculum is currently used in {selectedCurriculum.projectCount} project(s).
                </span>
              )}
            </Typography>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteCurriculum}
              variant="contained"
              color="error"
              startIcon={actionLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
              disabled={actionLoading}
            >
              Delete Curriculum
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

CurriculumsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default CurriculumsPage;