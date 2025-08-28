import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  IconButton,
  Alert,
  Divider
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  CloseOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SaveOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { format, parseISO } from 'date-fns';

// ==============================|| PROJECT DETAILS DIALOG ||============================== //

const ProjectDetailsDialog = ({ 
  open, 
  project, 
  instructors, 
  getAvailableInstructors,
  onClose, 
  onUpdate, 
  onDelete 
}) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: null,
    endDate: null,
    status: '',
    instructorId: '',
    location: ''
  });
  const [availableInstructors, setAvailableInstructors] = useState([]);
  const [errors, setErrors] = useState({});

  // Initialize form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        startDate: project.startDate ? parseISO(project.startDate) : null,
        endDate: project.endDate ? parseISO(project.endDate) : null,
        status: project.status || 'upcoming',
        instructorId: project.instructorId || '',
        location: project.location || ''
      });
    }
  }, [project]);

  // Update available instructors when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate && getAvailableInstructors) {
      const available = getAvailableInstructors(
        formData.startDate,
        formData.endDate,
        project?.id
      );
      setAvailableInstructors(available);
    } else {
      setAvailableInstructors(instructors);
    }
  }, [formData.startDate, formData.endDate, instructors, getAvailableInstructors, project]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const updatedProject = {
        ...project,
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString()
      };
      onUpdate(updatedProject);
      setEditMode(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      onDelete(project.id);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      upcoming: 'warning',
      'in-progress': 'info',
      completed: 'success',
      cancelled: 'error',
      onhold: 'default'
    };
    return statusColors[status] || 'default';
  };

  if (!project) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            {editMode ? 'Edit Project' : 'Project Details'}
          </Typography>
          <Stack direction="row" spacing={1}>
            {!editMode && (
              <IconButton onClick={() => setEditMode(true)} size="small">
                <EditOutlined />
              </IconButton>
            )}
            <IconButton onClick={handleDelete} size="small" color="error">
              <DeleteOutlined />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <CloseOutlined />
            </IconButton>
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Project Name and Status */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Project Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                />
              ) : (
                <Typography variant="h6">{project.name}</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {editMode ? (
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="upcoming">Upcoming</MenuItem>
                    <MenuItem value="in-progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="onhold">On Hold</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <Chip 
                  label={project.status} 
                  color={getStatusColor(project.status)}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>
          </Grid>

          {/* Description */}
          <Box>
            {editMode ? (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            ) : (
              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2">
                  {project.description || 'No description provided'}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider />

          {/* Dates */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {editMode ? (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(date) => handleInputChange('startDate', date)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        error={!!errors.startDate}
                        helperText={errors.startDate}
                      />
                    )}
                  />
                </LocalizationProvider>
              ) : (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarOutlined style={{ fontSize: '16px', color: '#666' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Start Date
                    </Typography>
                  </Stack>
                  <Typography variant="body1">
                    {project.startDate ? format(parseISO(project.startDate), 'MMM dd, yyyy') : 'Not set'}
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {editMode ? (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={formData.endDate}
                    onChange={(date) => handleInputChange('endDate', date)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        error={!!errors.endDate}
                        helperText={errors.endDate}
                      />
                    )}
                  />
                </LocalizationProvider>
              ) : (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarOutlined style={{ fontSize: '16px', color: '#666' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      End Date
                    </Typography>
                  </Stack>
                  <Typography variant="body1">
                    {project.endDate ? format(parseISO(project.endDate), 'MMM dd, yyyy') : 'Not set'}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          <Divider />

          {/* Instructor and Location */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {editMode ? (
                <FormControl fullWidth>
                  <InputLabel>Instructor</InputLabel>
                  <Select
                    value={formData.instructorId}
                    onChange={(e) => handleInputChange('instructorId', e.target.value)}
                    label="Instructor"
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {availableInstructors.map((instructor) => (
                      <MenuItem key={instructor.id} value={instructor.id}>
                        {instructor.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {availableInstructors.length === 0 && formData.instructorId === '' && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      No instructors available for selected dates
                    </Alert>
                  )}
                </FormControl>
              ) : (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <UserOutlined style={{ fontSize: '16px', color: '#666' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Instructor
                    </Typography>
                  </Stack>
                  <Typography variant="body1">
                    {instructors.find(i => i.id === project.instructorId)?.name || 'Unassigned'}
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              ) : (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EnvironmentOutlined style={{ fontSize: '16px', color: '#666' }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Location
                    </Typography>
                  </Stack>
                  <Typography variant="body1">
                    {project.location || 'Not specified'}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>


          {/* Participants */}
          {project.participants && project.participants.length > 0 && !editMode && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Participants ({project.participants.length})
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                  {project.participants.map((participant, idx) => (
                    <Chip key={idx} label={participant} size="small" />
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && !editMode && (
            <Box>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Tags
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                {project.tags.map((tag, idx) => (
                  <Chip key={idx} label={tag} size="small" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        {editMode ? (
          <>
            <Button onClick={() => setEditMode(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleSave}
              startIcon={<SaveOutlined />}
            >
              Save Changes
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

ProjectDetailsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  project: PropTypes.object,
  instructors: PropTypes.array,
  getAvailableInstructors: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default ProjectDetailsDialog;