import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Stack,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar,
  Divider
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/reducers/snackbar';
import { getProjectCurriculums } from 'store/reducers/projects';
import MainCard from 'components/MainCard';

const ProjectCurriculumCard = ({ projectId }) => {
  const dispatch = useDispatch();
  const [projectCurriculums, setProjectCurriculums] = useState([]);
  const [availableCurriculums, setAvailableCurriculums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);

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
    }
  };

  // Fetch available curriculums
  const fetchAvailableCurriculums = async () => {
    try {
      const response = await fetch('/api/curriculums/fetchCurriculums');
      const data = await response.json();
      setAvailableCurriculums(data || []);
    } catch (error) {
      console.error('Error fetching available curriculums:', error);
    }
  };

  // Add curriculum to project
  const handleAddCurriculum = async () => {
    if (!selectedCurriculumId) return;

    try {
      setAdding(true);
      const response = await fetch('/api/projects/add-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          curriculumId: selectedCurriculumId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Curriculum added to project successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        setAddDialogOpen(false);
        setSelectedCurriculumId('');
        fetchProjectCurriculums();
        
        // Update Redux store to make curriculum available in other components
        dispatch(getProjectCurriculums(projectId));
      } else {
        throw new Error(result.message || 'Failed to add curriculum');
      }
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to add curriculum',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setAdding(false);
    }
  };

  // Remove curriculum from project
  const handleRemoveCurriculum = async (curriculumId) => {
    if (!curriculumId) return;
    
    try {
      setRemoving(true);
      setMenuAnchor(null); // Close menu immediately
      
      const response = await fetch('/api/projects/remove-curriculum', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          curriculumId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Optimistically update local state first for immediate UI feedback
        setProjectCurriculums(prev => 
          prev.filter(pc => pc.curriculum.id !== curriculumId)
        );
        
        dispatch(openSnackbar({
          open: true,
          message: 'Curriculum removed successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        // Update Redux store in background (single call, not duplicate)
        dispatch(getProjectCurriculums(projectId));
      } else {
        throw new Error(result.message || 'Failed to remove curriculum');
      }
    } catch (error) {
      console.error('Error removing curriculum:', error);
      
      // Refresh data on error to ensure consistency
      fetchProjectCurriculums();
      
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to remove curriculum',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setRemoving(false);
    }
  };

  const handleMenuClick = (event, curriculum) => {
    setMenuAnchor(event.currentTarget);
    setSelectedCurriculum(curriculum);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedCurriculum(null);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProjectCurriculums(),
        fetchAvailableCurriculums()
      ]);
      setLoading(false);
    };

    if (projectId) {
      loadData();
    }
  }, [projectId]);

  // Get curriculums not already assigned to project
  const getAvailableForAdd = () => {
    const assignedIds = projectCurriculums.map(pc => pc.curriculum.id);
    return availableCurriculums.filter(c => !assignedIds.includes(c.id));
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={24} />
            <Typography>Loading project curriculums...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">Curriculums</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            disabled={getAvailableForAdd().length === 0}
          >
            Add Curriculum
          </Button>
        </Box>

            {projectCurriculums.length === 0 ? (
              <Alert severity="info">
                No curriculums assigned to this project yet. Click "Add Curriculum" to get started.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {projectCurriculums.map((pc) => (
                  <Stack
                    key={pc.curriculum.id}
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {pc.curriculum.title}
                      </Typography>
                      <Chip
                        icon={<SchoolIcon />}
                        label={`${pc.curriculum.curriculum_courses?.length || 0} courses`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                    
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, pc.curriculum)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => {
            handleRemoveCurriculum(selectedCurriculum?.id);
          }}
          disabled={removing}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            {removing ? (
              <CircularProgress size={16} color="error" />
            ) : (
              <DeleteIcon fontSize="small" color="error" />
            )}
          </ListItemIcon>
          <ListItemText>
            {removing ? 'Removing...' : 'Remove from Project'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Add Curriculum Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <MainCard
          title={
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <MenuBookIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="medium">
                  Add Curriculum to Project
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select a curriculum to add to this project
                </Typography>
              </Box>
            </Stack>
          }
          content={false}
          sx={{ 
            m: 0, 
            height: '100%', 
            '& .MuiCardHeader-root': { 
              pb: 2 
            }
          }}
        >
          <Divider />
          
          <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
              {getAvailableForAdd().length === 0 ? (
                <Alert severity="info">
                  All available curriculums are already assigned to this project.
                </Alert>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Select Curriculum</InputLabel>
                  <Select
                    value={selectedCurriculumId}
                    onChange={(e) => setSelectedCurriculumId(e.target.value)}
                    input={<OutlinedInput label="Select Curriculum" />}
                    displayEmpty
                  >
                    <MenuItem disabled value="">
                      <em>Choose a curriculum...</em>
                    </MenuItem>
                    {getAvailableForAdd().map((curriculum) => (
                      <MenuItem key={curriculum.id} value={curriculum.id}>
                        <Stack spacing={0.5} sx={{ py: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {curriculum.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {curriculum.courseCount} courses • Used in {curriculum.projectCount} projects
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Box>

          <Divider />
          
          <Box sx={{ p: 3, pt: 2, bgcolor: 'background.paper' }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button 
                color="error" 
                onClick={() => setAddDialogOpen(false)}
                disabled={adding}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleAddCurriculum}
                disabled={!selectedCurriculumId || adding || getAvailableForAdd().length === 0}
                startIcon={adding ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              >
                {adding ? 'Adding...' : 'Add Curriculum'}
              </Button>
            </Stack>
          </Box>
        </MainCard>
      </Dialog>
    </>
  );
};

export default ProjectCurriculumCard;