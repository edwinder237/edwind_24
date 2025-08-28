import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Box,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  CircularProgress,
  Alert
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

const ProjectCurriculumCard = ({ projectId }) => {
  const dispatch = useDispatch();
  const [projectCurriculums, setProjectCurriculums] = useState([]);
  const [availableCurriculums, setAvailableCurriculums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState('');
  const [adding, setAdding] = useState(false);
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
    try {
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
        dispatch(openSnackbar({
          open: true,
          message: 'Curriculum removed from project successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        fetchProjectCurriculums();
      } else {
        throw new Error(result.message || 'Failed to remove curriculum');
      }
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to remove curriculum',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setMenuAnchor(null);
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
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <MenuBookIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Project Curriculums
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage curriculums assigned to this project
                  </Typography>
                </Box>
              </Stack>
              
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
                disabled={getAvailableForAdd().length === 0}
              >
                Add Curriculum
              </Button>
            </Stack>

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
          </Stack>
        </CardContent>
      </Card>

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
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Remove from Project</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add Curriculum Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Curriculum to Project</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Curriculum</InputLabel>
              <Select
                value={selectedCurriculumId}
                onChange={(e) => setSelectedCurriculumId(e.target.value)}
                input={<OutlinedInput label="Select Curriculum" />}
              >
                {getAvailableForAdd().map((curriculum) => (
                  <MenuItem key={curriculum.id} value={curriculum.id}>
                    <Stack>
                      <Typography variant="body1">{curriculum.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {curriculum.courseCount} courses • {curriculum.projectCount} projects
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleAddCurriculum}
                disabled={!selectedCurriculumId || adding}
                startIcon={adding ? <CircularProgress size={20} /> : <AddIcon />}
              >
                Add Curriculum
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectCurriculumCard;