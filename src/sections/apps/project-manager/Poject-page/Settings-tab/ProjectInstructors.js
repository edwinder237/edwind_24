import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  TextField,
  Autocomplete,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// project imports
import MainCard from 'components/MainCard';
import { useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import axios from 'utils/axios';

// ==============================|| PROJECT INSTRUCTORS MANAGEMENT ||============================== //

const ProjectInstructors = ({ projectId }) => {
  const dispatch = useDispatch();
  const [projectInstructors, setProjectInstructors] = useState([]);
  const [allInstructors, setAllInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedInstructorType, setSelectedInstructorType] = useState('main');

  // Fetch project instructors
  const fetchProjectInstructors = async () => {
    try {
      const response = await axios.get(`/api/projects/instructors?projectId=${projectId}`);
      if (response.data.success) {
        setProjectInstructors(response.data.instructors);
      }
    } catch (error) {
      console.error('Error fetching project instructors:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to fetch project instructors',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  // Fetch all available instructors
  const fetchAllInstructors = async () => {
    try {
      const response = await axios.get('/api/instructors/fetchInstructors?status=active');
      setAllInstructors(response.data);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to fetch instructors',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    }
  };

  useEffect(() => {
    if (projectId) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          fetchProjectInstructors(),
          fetchAllInstructors()
        ]);
        setLoading(false);
      };
      loadData();
    }
  }, [projectId]);

  // Update selected instructor type when dialog opens based on current state
  useEffect(() => {
    if (addDialogOpen) {
      setSelectedInstructorType(hasMainInstructor() ? 'assistant' : 'main');
    }
  }, [addDialogOpen, projectInstructors]);

  // Get available instructors (not already assigned to project)
  const getAvailableInstructors = () => {
    const assignedInstructorIds = projectInstructors.map(pi => pi.instructor.id);
    return allInstructors.filter(instructor => !assignedInstructorIds.includes(instructor.id));
  };

  // Add instructor to project
  const handleAddInstructor = async () => {
    if (!selectedInstructor) return;

    try {
      setSaving(true);
      const response = await axios.post(`/api/projects/instructors?projectId=${projectId}`, {
        instructorId: selectedInstructor.id,
        instructorType: selectedInstructorType
      });

      if (response.data.success) {
        await fetchProjectInstructors();
        setAddDialogOpen(false);
        setSelectedInstructor(null);
        // Reset to appropriate default based on whether main instructor exists
        setSelectedInstructorType(hasMainInstructor() ? 'assistant' : 'main');
        dispatch(openSnackbar({
          open: true,
          message: 'Instructor added to project successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
      }
    } catch (error) {
      console.error('Error adding instructor:', error);
      const message = error.response?.data?.message || 'Failed to add instructor to project';
      dispatch(openSnackbar({
        open: true,
        message,
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setSaving(false);
    }
  };

  // Update instructor type in project
  const handleUpdateInstructorType = async (instructorId, newType) => {
    try {
      setSaving(true);
      const response = await axios.put(`/api/projects/instructors?projectId=${projectId}`, {
        instructorId: instructorId,
        instructorType: newType
      });

      if (response.data.success) {
        await fetchProjectInstructors();
        dispatch(openSnackbar({
          open: true,
          message: 'Instructor type updated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
      }
    } catch (error) {
      console.error('Error updating instructor type:', error);
      const message = error.response?.data?.message || 'Failed to update instructor type';
      dispatch(openSnackbar({
        open: true,
        message,
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setSaving(false);
    }
  };

  // Remove instructor from project
  const handleRemoveInstructor = async (instructorId) => {
    try {
      setSaving(true);
      const response = await axios.delete(`/api/projects/instructors?projectId=${projectId}`, {
        data: { instructorId }
      });

      if (response.data.success) {
        await fetchProjectInstructors();
        dispatch(openSnackbar({
          open: true,
          message: 'Instructor removed from project successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
      }
    } catch (error) {
      console.error('Error removing instructor:', error);
      const message = error.response?.data?.message || 'Failed to remove instructor from project';
      dispatch(openSnackbar({
        open: true,
        message,
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setSaving(false);
    }
  };

  const instructorTypeOptions = [
    { value: 'main', label: 'Main Instructor', color: 'primary' },
    { value: 'assistant', label: 'Assistant', color: 'info' },
    { value: 'guest', label: 'Guest Instructor', color: 'warning' },
    { value: 'consultant', label: 'Consultant', color: 'secondary' },
    { value: 'mentor', label: 'Mentor', color: 'success' }
  ];

  // Check if there's already a main instructor
  const hasMainInstructor = () => {
    return projectInstructors.some(pi => pi.instructorType === 'main');
  };

  // Get available instructor types based on current assignments
  const getAvailableInstructorTypes = (currentInstructorType = null) => {
    if (hasMainInstructor() && currentInstructorType !== 'main') {
      return instructorTypeOptions.filter(option => option.value !== 'main');
    }
    return instructorTypeOptions;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading instructors...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">Instructors</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          disabled={saving || getAvailableInstructors().length === 0}
        >
          Add
        </Button>
      </Box>
      {projectInstructors.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No instructors assigned to this project yet. Add instructors to help manage and deliver project content.
        </Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Project Role</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projectInstructors.map((projectInstructor) => {
                const instructor = projectInstructor.instructor;
                return (
                  <TableRow key={projectInstructor.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {instructor.firstName} {instructor.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={projectInstructor.instructorType}
                        onChange={(e) => handleUpdateInstructorType(instructor.id, e.target.value)}
                        disabled={saving}
                        sx={{ minWidth: 140 }}
                      >
                        {getAvailableInstructorTypes(projectInstructor.instructorType).map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveInstructor(instructor.id)}
                        disabled={saving}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Instructor Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => !saving && setAddDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 0,
            maxWidth: 400
          }
        }}
      >
        <MainCard
          title="Add Instructor to Project"
          sx={{ 
            m: 0,
            '& .MuiCardContent-root': {
              p: 3
            }
          }}
        >
          <Stack spacing={3}>
            <Autocomplete
              value={selectedInstructor}
              onChange={(event, newValue) => setSelectedInstructor(newValue)}
              options={getAvailableInstructors()}
              getOptionLabel={(instructor) => `${instructor.firstName} ${instructor.lastName}`}
              renderOption={(props, instructor) => (
                <Box component="li" {...props}>
                  <Stack>
                    <Typography variant="body2">
                      {instructor.firstName} {instructor.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {instructor.email || 'No email provided'}
                    </Typography>
                  </Stack>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Instructor"
                  fullWidth
                />
              )}
              noOptionsText={getAvailableInstructors().length === 0 ? "All instructors are already assigned" : "No instructors found"}
            />

            <FormControl fullWidth>
              <InputLabel>Project Role</InputLabel>
              <Select
                value={selectedInstructorType}
                onChange={(e) => setSelectedInstructorType(e.target.value)}
                label="Project Role"
              >
                {getAvailableInstructorTypes().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                    {option.value === 'main' && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (Only one allowed)
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Action Buttons */}
            <Stack
              direction="row"
              justifyContent="flex-end"
              spacing={2}
              sx={{ pt: 2, mt: 3, borderTop: 1, borderColor: 'divider' }}
            >
              <Button 
                variant="outlined"
                color="secondary"
                onClick={() => setAddDialogOpen(false)}
                disabled={saving}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1,
                  px: 3,
                  py: 1
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleAddInstructor}
                disabled={!selectedInstructor || saving}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1,
                  px: 3,
                  py: 1,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none'
                  }
                }}
              >
                {saving ? 'Adding...' : 'Add Instructor'}
              </Button>
            </Stack>
          </Stack>
        </MainCard>
      </Dialog>
    </Box>
  );
};

export default ProjectInstructors;