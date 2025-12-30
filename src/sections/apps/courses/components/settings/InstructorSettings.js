import React, { useState, useEffect } from 'react';
import { useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';

// material-ui
import {
  Stack,
  Button,
  Typography,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  CircularProgress,
  Tooltip,
  Badge,
  Box,
  Alert,
} from '@mui/material';

// material-ui icons
import {
  School as SchoolIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';

const InstructorSettings = ({ courseId }) => {
  const dispatch = useDispatch();
  const [courseInstructors, setCourseInstructors] = useState([]);
  const [availableInstructors, setAvailableInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedRole, setSelectedRole] = useState('main');
  const [newInstructor, setNewInstructor] = useState(null);

  // Fetch course instructors
  const fetchCourseInstructors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/instructors?courseId=${courseId}`);
      const data = await response.json();
      
      if (data.success) {
        setCourseInstructors(data.instructors);
      } else {
        throw new Error(data.message || 'Failed to fetch instructors');
      }
    } catch (error) {
      console.error('Error fetching course instructors:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to fetch course instructors',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch available instructors
  const fetchAvailableInstructors = async () => {
    try {
      const response = await fetch('/api/instructors/fetchInstructors');
      const data = await response.json();
      // Ensure we always set an array
      setAvailableInstructors(Array.isArray(data) ? data : (data.instructors || []));
    } catch (error) {
      console.error('Error fetching available instructors:', error);
      setAvailableInstructors([]);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseInstructors();
      fetchAvailableInstructors();
    }
  }, [courseId]);

  // Add instructor to course
  const handleAddInstructor = async () => {
    if (!newInstructor) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/courses/instructors?courseId=${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: newInstructor.id,
          role: selectedRole
        })
      });

      const result = await response.json();
      
      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Instructor added successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        setAddDialogOpen(false);
        setNewInstructor(null);
        setSelectedRole('main');
        fetchCourseInstructors();
      } else {
        throw new Error(result.message || 'Failed to add instructor');
      }
    } catch (error) {
      console.error('Error adding instructor:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to add instructor',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setActionLoading(false);
    }
  };

  // Update instructor role
  const handleUpdateRole = async () => {
    if (!selectedInstructor) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/courses/instructors?courseId=${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: selectedInstructor.instructor.id,
          role: selectedRole
        })
      });

      const result = await response.json();
      
      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Instructor role updated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        setEditDialogOpen(false);
        setSelectedInstructor(null);
        fetchCourseInstructors();
      } else {
        throw new Error(result.message || 'Failed to update instructor role');
      }
    } catch (error) {
      console.error('Error updating instructor role:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to update instructor role',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setActionLoading(false);
    }
  };

  // Remove instructor from course
  const handleRemoveInstructor = async (instructorId) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/courses/instructors?courseId=${courseId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId })
      });

      const result = await response.json();
      
      if (result.success) {
        dispatch(openSnackbar({
          open: true,
          message: 'Instructor removed successfully',
          variant: 'alert',
          alert: { color: 'success' }
        }));
        
        fetchCourseInstructors();
      } else {
        throw new Error(result.message || 'Failed to remove instructor');
      }
    } catch (error) {
      console.error('Error removing instructor:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.message || 'Failed to remove instructor',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'main': return 'primary';
      case 'secondary': return 'secondary';
      case 'assistant': return 'info';
      default: return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'main': return <StarIcon />;
      case 'secondary': return <PersonIcon />;
      case 'assistant': return <GroupIcon />;
      default: return <PersonIcon />;
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SchoolIcon color="primary" />
          Course Instructors
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            Course Instructors
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PersonAddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add
          </Button>
        </Box>
        <Stack spacing={2}>
            {courseInstructors.length === 0 ? (
              <Alert severity="info" variant="outlined">
                <Typography variant="body2">
                  No instructors assigned yet. Add instructors to manage who can teach this course.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setAddDialogOpen(true)}
                  sx={{ mt: 1 }}
                >
                  Add First Instructor
                </Button>
              </Alert>
            ) : (
              <List dense>
                {courseInstructors.map((courseInstructor, index) => (
                  <ListItem 
                    key={courseInstructor.id} 
                    divider={index < courseInstructors.length - 1}
                    sx={{ px: 0 }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={getRoleIcon(courseInstructor.role)}
                        color="primary"
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      >
                        <Avatar
                          src={courseInstructor.instructor.profileImage}
                          sx={{ width: 40, height: 40 }}
                        >
                          {courseInstructor.instructor.firstName[0]}{courseInstructor.instructor.lastName[0]}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle2">
                            {courseInstructor.instructor.firstName} {courseInstructor.instructor.lastName}
                          </Typography>
                          <Chip
                            label={courseInstructor.role}
                            size="small"
                            color={getRoleColor(courseInstructor.role)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      primaryTypographyProps={{ component: 'div' }}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption">
                            {courseInstructor.instructor.email}
                          </Typography>
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                    
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit Role">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedInstructor(courseInstructor);
                              setSelectedRole(courseInstructor.role);
                              setEditDialogOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveInstructor(courseInstructor.instructor.id)}
                            disabled={actionLoading}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}

            {courseInstructors.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={() => setAddDialogOpen(true)}
                fullWidth
              >
                Add Another Instructor
              </Button>
            )}
          </Stack>
      </Box>

      {/* Add Instructor Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Add Instructor</Typography>
            <IconButton onClick={() => setAddDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Autocomplete
              options={(Array.isArray(availableInstructors) ? availableInstructors : []).filter(instructor =>
                !courseInstructors.some(ci => ci.instructor.id === instructor.id)
              )}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
              value={newInstructor}
              onChange={(event, value) => setNewInstructor(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Instructor"
                  placeholder="Search instructors..."
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Avatar
                    src={option.profileImage}
                    sx={{ width: 32, height: 32, mr: 2 }}
                  >
                    {option.firstName[0]}{option.lastName[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">
                      {option.firstName} {option.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={selectedRole}
                label="Role"
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <MenuItem value="main">
                  <Chip icon={<StarIcon />} label="Main Instructor" size="small" color="primary" />
                </MenuItem>
                <MenuItem value="secondary">
                  <Chip icon={<PersonIcon />} label="Secondary Instructor" size="small" color="secondary" />
                </MenuItem>
                <MenuItem value="assistant">
                  <Chip icon={<GroupIcon />} label="Assistant" size="small" color="info" />
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddInstructor}
            variant="contained"
            disabled={!newInstructor || actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {actionLoading ? 'Adding...' : 'Add Instructor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Edit Instructor Role</Typography>
            <IconButton onClick={() => setEditDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          {selectedInstructor && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={selectedInstructor.instructor.profileImage}
                  sx={{ width: 48, height: 48 }}
                >
                  {selectedInstructor.instructor.firstName[0]}{selectedInstructor.instructor.lastName[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">
                    {selectedInstructor.instructor.firstName} {selectedInstructor.instructor.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedInstructor.instructor.email}
                  </Typography>
                </Box>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedRole}
                  label="Role"
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <MenuItem value="main">
                    <Chip icon={<StarIcon />} label="Main Instructor" size="small" color="primary" />
                  </MenuItem>
                  <MenuItem value="secondary">
                    <Chip icon={<PersonIcon />} label="Secondary Instructor" size="small" color="secondary" />
                  </MenuItem>
                  <MenuItem value="assistant">
                    <Chip icon={<GroupIcon />} label="Assistant" size="small" color="info" />
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateRole}
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <EditIcon />}
          >
            {actionLoading ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InstructorSettings;