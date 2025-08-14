import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  useTheme,
  alpha,
  Avatar
} from '@mui/material';
import {
  Close,
  Save,
  AccessTime,
  LocationOn,
  Person,
  Palette,
  School,
  Support,
  Event as EventIcon,
  Description
} from '@mui/icons-material';
import MainCard from 'components/MainCard';
import { useDispatch, useSelector } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { getEvents } from 'store/reducers/calendar';
import { getSingleProject } from 'store/reducers/projects';

const EditEventDialog = ({ open, onClose, event, project }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'other',
    start: '',
    end: '',
    allDay: false,
    location: '',
    instructor: null,
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.main,
    courseId: null,
    supportActivityId: null
  });

  // Color options
  const colorOptions = [
    { name: 'Primary', value: theme.palette.primary.main },
    { name: 'Info', value: theme.palette.info.main },
    { name: 'Success', value: theme.palette.success.main },
    { name: 'Warning', value: theme.palette.warning.main },
    { name: 'Error', value: theme.palette.error.main },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Orange', value: '#ff9800' },
    { name: 'Teal', value: '#009688' },
    { name: 'Pink', value: '#e91e63' },
    { name: 'Indigo', value: '#3f51b5' },
    { name: 'Cyan', value: '#00bcd4' },
    { name: 'Grey', value: '#607d8b' }
  ];

  // Event type options
  const eventTypeOptions = [
    { value: 'course', label: 'Course', icon: <School />, color: theme.palette.primary.main },
    { value: 'supportActivity', label: 'Support Activity', icon: <Support />, color: theme.palette.info.main },
    { value: 'meeting', label: 'Meeting', icon: <EventIcon />, color: theme.palette.secondary.main },
    { value: 'break', label: 'Break', icon: <EventIcon />, color: theme.palette.warning.main },
    { value: 'other', label: 'Other', icon: <EventIcon />, color: theme.palette.grey[600] }
  ];

  // Mock instructors data (replace with actual data from your system)
  const availableInstructors = [
    { id: 1, name: 'John Smith', email: 'john@example.com' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com' },
    { id: 3, name: 'Mike Brown', email: 'mike@example.com' },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com' }
  ];

  // Initialize form data when event changes
  useEffect(() => {
    if (event && open) {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventType: event.eventType || 'other',
        start: startDate.toISOString().slice(0, 16), // Format for datetime-local input
        end: endDate.toISOString().slice(0, 16),
        allDay: event.allDay || false,
        location: event.location || '',
        instructor: event.instructor || null,
        color: event.color || theme.palette.primary.main,
        backgroundColor: event.backgroundColor || event.color || theme.palette.primary.main,
        courseId: event.courseId || null,
        supportActivityId: event.supportActivityId || null
      });
    }
  }, [event, open, theme.palette.primary.main]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleColorChange = (newColor) => {
    setFormData(prev => ({
      ...prev,
      color: newColor,
      backgroundColor: newColor
    }));
  };

  const handleEventTypeChange = (newType) => {
    const typeConfig = eventTypeOptions.find(option => option.value === newType);
    setFormData(prev => ({
      ...prev,
      eventType: newType,
      color: typeConfig?.color || theme.palette.primary.main,
      backgroundColor: typeConfig?.color || theme.palette.primary.main
    }));
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      eventType: 'other',
      start: '',
      end: '',
      allDay: false,
      location: '',
      instructor: null,
      color: theme.palette.primary.main,
      backgroundColor: theme.palette.primary.main,
      courseId: null,
      supportActivityId: null
    });
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Event title is required',
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/calendar/db-update-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          event: {
            ...event,
            ...formData,
            start: new Date(formData.start).toISOString(),
            end: new Date(formData.end).toISOString(),
            textColor: '#fff' // Default text color for contrast
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      // Refresh calendar events
      if (project?.id) {
        await dispatch(getEvents(project.id));
        await dispatch(getSingleProject(project.id));
      }

      dispatch(
        openSnackbar({
          open: true,
          message: 'Event updated successfully',
          variant: 'alert',
          alert: { color: 'success' },
          close: false
        })
      );

      handleClose();
    } catch (error) {
      console.error('Error updating event:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to update event',
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const selectedEventType = eventTypeOptions.find(option => option.value === formData.eventType);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                bgcolor: alpha(formData.color, 0.1),
                color: formData.color,
                width: 40,
                height: 40
              }}
            >
              {selectedEventType?.icon}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Edit Event
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {event && formatDateTime(event.start)}
              </Typography>
            </Box>
          </Stack>
        }
        secondary={
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        }
        sx={{
          m: 0,
          '& .MuiCardContent-root': {
            p: 0
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            {/* Event Title */}
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Event Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                InputProps={{
                  startAdornment: selectedEventType?.icon && (
                    <Box sx={{ mr: 1, color: formData.color }}>
                      {selectedEventType.icon}
                    </Box>
                  )
                }}
              />
            </Grid>

            {/* Event Type */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={formData.eventType}
                  label="Event Type"
                  onChange={(e) => handleEventTypeChange(e.target.value)}
                >
                  {eventTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ color: option.color }}>
                          {option.icon}
                        </Box>
                        <Typography>{option.label}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Description sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
                  )
                }}
              />
            </Grid>

            {/* Timing Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Timing & Location
              </Typography>
            </Grid>

            {/* All Day Toggle */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allDay}
                    onChange={(e) => handleInputChange('allDay', e.target.checked)}
                  />
                }
                label="All Day Event"
              />
            </Grid>

            {/* Start Time */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="datetime-local"
                value={formData.start}
                onChange={(e) => handleInputChange('start', e.target.value)}
                disabled={formData.allDay}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                  )
                }}
              />
            </Grid>

            {/* End Time */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Time"
                type="datetime-local"
                value={formData.end}
                onChange={(e) => handleInputChange('end', e.target.value)}
                disabled={formData.allDay}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                  )
                }}
              />
            </Grid>

            {/* Location */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter event location"
                InputProps={{
                  startAdornment: (
                    <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  )
                }}
              />
            </Grid>

            {/* Instructor */}
            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                options={availableInstructors}
                getOptionLabel={(option) => option.name}
                value={formData.instructor}
                onChange={(event, newValue) => handleInputChange('instructor', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Instructor"
                    placeholder="Select an instructor"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <Person sx={{ mr: 1, color: 'text.secondary' }} />
                          {params.InputProps.startAdornment}
                        </>
                      )
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 0.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                        {option.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
              />
            </Grid>

            {/* Appearance Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Appearance
              </Typography>
            </Grid>

            {/* Color Picker */}
            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <Palette sx={{ mr: 1, verticalAlign: 'middle', fontSize: 18 }} />
                  Event Color
                </Typography>
                <Grid container spacing={1}>
                  {colorOptions.map((color) => (
                    <Grid item key={color.name}>
                      <Box
                        onClick={() => handleColorChange(color.value)}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: color.value,
                          cursor: 'pointer',
                          border: formData.color === color.value ? `3px solid ${theme.palette.text.primary}` : '2px solid transparent',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: theme.shadows[2]
                          }
                        }}
                      >
                        {formData.color === color.value && (
                          <Typography 
                            sx={{ 
                              color: 'white', 
                              fontSize: 16, 
                              fontWeight: 'bold',
                              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                            }}
                          >
                            ✓
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          </Grid>

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !formData.title.trim()}
              startIcon={<Save />}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </MainCard>
    </Dialog>
  );
};

export default EditEventDialog;