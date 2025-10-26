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
import { useDispatch, useSelector } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { selectProjectCurriculums, selectAvailableCurriculums, addCurriculumToProject, removeCurriculumFromProject } from 'store/reducers/project/settings';
import MainCard from 'components/MainCard';

const ProjectCurriculumCard = ({ projectId }) => {
  const dispatch = useDispatch();
  
  // Get data from settings store instead of separate API calls
  const projectCurriculums = useSelector(selectProjectCurriculums);
  const availableCurriculums = useSelector(selectAvailableCurriculums);
  
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);

  // Project curriculums and available curriculums now come from settings store

  // Add curriculum to project
  const handleAddCurriculum = async () => {
    if (!selectedCurriculumId) return;

    try {
      setAdding(true);

      // Use CQRS command to add curriculum (no full refetch)
      await dispatch(addCurriculumToProject(projectId, selectedCurriculumId));

      dispatch(openSnackbar({
        open: true,
        message: 'Curriculum added to project successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));

      setAddDialogOpen(false);
      setSelectedCurriculumId('');
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
  const handleRemoveCurriculum = async (projectCurriculum) => {
    if (!projectCurriculum) return;

    try {
      setRemoving(true);
      setMenuAnchor(null); // Close menu immediately

      // Use CQRS command to remove curriculum (no full refetch)
      // Pass: projectId, curriculumId (for API), and projectCurriculumId (for store update)
      await dispatch(removeCurriculumFromProject(
        projectId,
        projectCurriculum.curriculumId,
        projectCurriculum.id
      ));

      dispatch(openSnackbar({
        open: true,
        message: 'Curriculum removed successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));
    } catch (error) {
      console.error('Error removing curriculum:', error);

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

  const handleMenuClick = (event, projectCurriculum) => {
    setMenuAnchor(event.currentTarget);
    setSelectedCurriculum(projectCurriculum);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedCurriculum(null);
  };

  // Data now comes from settings store - no need for useEffect to fetch

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
                      onClick={(e) => handleMenuClick(e, pc)}
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
            handleRemoveCurriculum(selectedCurriculum);
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
                  <InputLabel>Choose Curriculum</InputLabel>
                  <Select
                    value={selectedCurriculumId}
                    onChange={(e) => setSelectedCurriculumId(e.target.value)}
                    input={<OutlinedInput label="Choose Curriculum" />}
                  >
                    <MenuItem disabled value="">
                      <em>Select a curriculum from your organization</em>
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