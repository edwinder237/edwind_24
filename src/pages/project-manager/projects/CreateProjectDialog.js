import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  Button,
  TextField,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  IconButton,
  Alert,
  Chip,
  FormHelperText,
  useTheme
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  CloseOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HomeOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import LocationAutocomplete from 'components/LocationAutocomplete';

// ==============================|| CREATE PROJECT DIALOG ||============================== //

const CreateProjectDialog = ({
  open,
  instructors,
  rooms,
  getAvailableInstructors,
  getInstructorsWithAvailability,
  getRoomsWithAvailability,
  getDateAvailability,
  isDateBlocked,
  onClose,
  onCreate
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: null,
    endDate: null,
    status: 'upcoming',
    instructorId: '',
    instructor2Id: '',
    roomId: '',
    recipient: '',
    location: '',
    tags: [],
    participants: []
  });
  const [availableInstructors, setAvailableInstructors] = useState([]);
  const [instructorsWithAvailability, setInstructorsWithAvailability] = useState([]);
  const [roomsWithAvailability, setRoomsWithAvailability] = useState([]);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [participantInput, setParticipantInput] = useState('');
  const [locationValue, setLocationValue] = useState(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
        startDate: null,
        endDate: null,
        status: 'upcoming',
        instructorId: '',
        instructor2Id: '',
        roomId: '',
        recipient: '',
        location: '',
        tags: [],
        participants: []
      });
      setErrors({});
      setTagInput('');
      setParticipantInput('');
      setLocationValue(null);
    }
  }, [open]);

  // Update available instructors and rooms when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate && getAvailableInstructors) {
      const available = getAvailableInstructors(formData.startDate, formData.endDate);
      setAvailableInstructors(available);
    } else {
      setAvailableInstructors(instructors);
    }

    if (formData.startDate && formData.endDate && getInstructorsWithAvailability) {
      const withAvailability = getInstructorsWithAvailability(formData.startDate, formData.endDate);
      setInstructorsWithAvailability(withAvailability);
    } else {
      setInstructorsWithAvailability(instructors.map(inst => ({ ...inst, isAvailable: true, conflictingProjects: [] })));
    }

    if (formData.startDate && formData.endDate && getRoomsWithAvailability) {
      const roomsAvailability = getRoomsWithAvailability(formData.startDate, formData.endDate);
      setRoomsWithAvailability(roomsAvailability);
    } else {
      setRoomsWithAvailability((rooms || []).map(room => ({ ...room, isAvailable: true, conflictingProjects: [] })));
    }
  }, [formData.startDate, formData.endDate, instructors, rooms, getAvailableInstructors, getInstructorsWithAvailability, getRoomsWithAvailability]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleDateRangeChange = (newValue) => {
    setFormData(prev => ({
      ...prev,
      startDate: newValue[0],
      endDate: newValue[1]
    }));

    // Clear date errors when dates are set
    setErrors(prev => ({
      ...prev,
      startDate: newValue[0] ? undefined : prev.startDate,
      endDate: newValue[1] ? undefined : prev.endDate
    }));
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

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddParticipant = () => {
    if (participantInput.trim() && !formData.participants.includes(participantInput.trim())) {
      handleInputChange('participants', [...formData.participants, participantInput.trim()]);
      setParticipantInput('');
    }
  };

  const handleRemoveParticipant = (participantToRemove) => {
    handleInputChange('participants', formData.participants.filter(p => p !== participantToRemove));
  };

  const handleCreate = () => {
    if (validateForm()) {
      const newProject = {
        ...formData,
        startDate: formData.startDate?.toISOString(),
        endDate: formData.endDate?.toISOString(),
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        progress: 0,
        projections: []
      };
      onCreate(newProject);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
          p: 0,
          m: { xs: 1, sm: 2 },
          width: { xs: 'calc(100% - 16px)', sm: 'auto' },
          maxWidth: { xs: 'none', sm: 900 }
        }
      }}
    >
      <MainCard
        title="Create New Project"
        secondary={
          <IconButton onClick={onClose} size="small">
            <CloseOutlined />
          </IconButton>
        }
        sx={{
          m: 0,
          '& .MuiCardContent-root': {
            p: 0
          }
        }}
      >
        <Box sx={{ px: 3, py: 2, maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }}>
          <Grid container spacing={3}>
          {/* Project Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Project Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter project description..."
            />
          </Grid>

          {/* Date Range and Status */}
          <Grid item xs={12} sm={8}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack direction="row" spacing={2}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(date) => handleInputChange('startDate', date)}
                  shouldDisableDate={isDateBlocked}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.startDate,
                      helperText: errors.startDate
                    },
                    day: (ownerState) => {
                      const availability = getDateAvailability ? getDateAvailability(ownerState.day) : null;
                      const status = availability?.status || 'available';

                      // Color coding based on availability status
                      const statusStyles = {
                        blocked: {
                          backgroundColor: '#f44336',
                          color: '#fff',
                          '&:hover': { backgroundColor: '#d32f2f' },
                        },
                        busy: {
                          backgroundColor: '#ff9800',
                          color: '#fff',
                          '&:hover': { backgroundColor: '#f57c00' },
                        },
                        limited: {
                          backgroundColor: '#fff3e0',
                          color: '#e65100',
                          '&:hover': { backgroundColor: '#ffe0b2' },
                        },
                        available: {}
                      };

                      return { sx: statusStyles[status] || {} };
                    }
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(date) => handleInputChange('endDate', date)}
                  minDate={formData.startDate || undefined}
                  shouldDisableDate={isDateBlocked}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.endDate,
                      helperText: errors.endDate
                    },
                    day: (ownerState) => {
                      const availability = getDateAvailability ? getDateAvailability(ownerState.day) : null;
                      const status = availability?.status || 'available';

                      // Color coding based on availability status
                      const statusStyles = {
                        blocked: {
                          backgroundColor: '#f44336',
                          color: '#fff',
                          '&:hover': { backgroundColor: '#d32f2f' },
                        },
                        busy: {
                          backgroundColor: '#ff9800',
                          color: '#fff',
                          '&:hover': { backgroundColor: '#f57c00' },
                        },
                        limited: {
                          backgroundColor: '#fff3e0',
                          color: '#e65100',
                          '&:hover': { backgroundColor: '#ffe0b2' },
                        },
                        available: {}
                      };

                      return { sx: statusStyles[status] || {} };
                    }
                  }}
                />
              </Stack>
              {/* Legend for calendar colors */}
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#fff3e0', border: '1px solid #e65100' }} />
                  <Typography variant="caption" color="text.secondary">Limited</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff9800' }} />
                  <Typography variant="caption" color="text.secondary">Busy</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336' }} />
                  <Typography variant="caption" color="text.secondary">Blocked</Typography>
                </Stack>
              </Stack>
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Instructors */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Primary Instructor</InputLabel>
              <Select
                value={formData.instructorId}
                onChange={(e) => handleInputChange('instructorId', e.target.value)}
                label="Primary Instructor"
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {instructorsWithAvailability.map((instructor) => (
                  <MenuItem
                    key={instructor.id}
                    value={instructor.id}
                    disabled={instructor.id === formData.instructor2Id}
                    sx={{
                      opacity: instructor.isAvailable ? 1 : 0.7,
                      bgcolor: instructor.isAvailable ? 'transparent' : 'action.hover'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {instructor.isAvailable ? (
                          <CheckCircleOutlined style={{ color: '#4caf50', fontSize: 14 }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#f44336', fontSize: 14 }} />
                        )}
                        <span>{instructor.name} - {instructor.specialization}</span>
                      </Box>
                      {!instructor.isAvailable && instructor.conflictingProjects?.length > 0 && (
                        <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                          ({instructor.conflictingProjects.map(p => p.name).join(', ')})
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Second Instructor (Optional)</InputLabel>
              <Select
                value={formData.instructor2Id}
                onChange={(e) => handleInputChange('instructor2Id', e.target.value)}
                label="Second Instructor (Optional)"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {instructorsWithAvailability.map((instructor) => (
                  <MenuItem
                    key={instructor.id}
                    value={instructor.id}
                    disabled={instructor.id === formData.instructorId}
                    sx={{
                      opacity: instructor.isAvailable ? 1 : 0.7,
                      bgcolor: instructor.isAvailable ? 'transparent' : 'action.hover'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {instructor.isAvailable ? (
                          <CheckCircleOutlined style={{ color: '#4caf50', fontSize: 14 }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#f44336', fontSize: 14 }} />
                        )}
                        <span>{instructor.name} - {instructor.specialization}</span>
                      </Box>
                      {!instructor.isAvailable && instructor.conflictingProjects?.length > 0 && (
                        <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                          ({instructor.conflictingProjects.map(p => p.name).join(', ')})
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {formData.startDate && formData.endDate && (availableInstructors.length === 0 || roomsWithAvailability.filter(r => r.isAvailable).length === 0) && (
            <Grid item xs={12}>
              <Alert severity="warning">
                {availableInstructors.length === 0 && roomsWithAvailability.filter(r => r.isAvailable).length === 0
                  ? 'All instructors and rooms are busy during the selected dates.'
                  : availableInstructors.length === 0
                    ? 'All instructors are busy during the selected dates.'
                    : 'All rooms are busy during the selected dates.'}
              </Alert>
            </Grid>
          )}

          {/* Room */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Room</InputLabel>
              <Select
                value={formData.roomId}
                onChange={(e) => handleInputChange('roomId', e.target.value)}
                label="Room"
              >
                <MenuItem value="">
                  <em>No Room Assigned</em>
                </MenuItem>
                {roomsWithAvailability.map((room) => (
                  <MenuItem
                    key={room.id}
                    value={room.id}
                    sx={{
                      opacity: room.isAvailable ? 1 : 0.7,
                      bgcolor: room.isAvailable ? 'transparent' : 'action.hover'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {room.isAvailable ? (
                          <CheckCircleOutlined style={{ color: '#4caf50', fontSize: 14 }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#f44336', fontSize: 14 }} />
                        )}
                        <HomeOutlined style={{ fontSize: 14, color: '#666' }} />
                        <span>{room.name} - {room.location} (Cap: {room.capacity})</span>
                      </Box>
                      {!room.isAvailable && room.conflictingProjects?.length > 0 && (
                        <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                          ({room.conflictingProjects.map(p => p.name).join(', ')})
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {formData.startDate && formData.endDate && (
                <FormHelperText>
                  {roomsWithAvailability.filter(r => r.isAvailable).length} of {roomsWithAvailability.length} room(s) available
                </FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Training Recipient */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Training Recipient"
              value={formData.recipient}
              onChange={(e) => handleInputChange('recipient', e.target.value)}
              placeholder="e.g., Company or client name"
            />
          </Grid>

          {/* Location */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., New York, NY or Remote"
            />
          </Grid>

          {/* Tags */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              Tags
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                size="small"
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                sx={{ flex: 1 }}
              />
              <Button size="small" onClick={handleAddTag} variant="outlined">
                Add
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {formData.tags.map((tag, idx) => (
                <Chip
                  key={idx}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                />
              ))}
            </Stack>
          </Grid>

          {/* Participants */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              Participants
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                size="small"
                placeholder="Add participant name"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant())}
                sx={{ flex: 1 }}
              />
              <Button size="small" onClick={handleAddParticipant} variant="outlined">
                Add
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {formData.participants.map((participant, idx) => (
                <Chip
                  key={idx}
                  label={participant}
                  onDelete={() => handleRemoveParticipant(participant)}
                  size="small"
                  color="primary"
                />
              ))}
            </Stack>
          </Grid>
        </Grid>
        </Box>

        {/* Actions */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'
          }}
        >
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            startIcon={<PlusOutlined />}
          >
            Create Project
          </Button>
        </Box>
      </MainCard>
    </Dialog>
  );
};

CreateProjectDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  instructors: PropTypes.array,
  rooms: PropTypes.array,
  getAvailableInstructors: PropTypes.func,
  getInstructorsWithAvailability: PropTypes.func,
  getRoomsWithAvailability: PropTypes.func,
  getDateAvailability: PropTypes.func,
  isDateBlocked: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired
};

export default CreateProjectDialog;
