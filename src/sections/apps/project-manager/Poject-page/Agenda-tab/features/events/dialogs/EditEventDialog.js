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
import { useGetProjectAgendaQuery } from 'store/api/projectApi';
import { eventCommands } from 'store/commands';
import { APP_COLOR_OPTIONS } from 'constants/eventColors';
import { useDateTimeRangeInput, formatDateTimeLocal } from 'hooks/useTimeRangeInput';

const EditEventDialog = ({ open, onClose, event, project }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  // Track if dialog was ever opened to prevent premature data loading
  const [wasOpened, setWasOpened] = useState(false);

  // DateTime range hook with auto-adjustment
  const {
    startDateTime,
    endDateTime,
    setStartDateTime,
    setEndDateTime,
    reset: resetDateTimes,
    _setStartRaw,
    _setEndRaw
  } = useDateTimeRangeInput({ minDurationMinutes: 60 });

  useEffect(() => {
    if (open && event?.id) {
      setWasOpened(true);
    }
  }, [open, event?.id]);

  // CQRS: Fetch agenda data using RTK Query (includes instructors, curriculums)
  // IMPORTANT: We subscribe to the query but DO NOT trigger any network requests
  // The data should already be cached from parent components (AgendaTimeline, etc.)
  // This prevents triggering Redux updates that would cause parent re-renders
  const {
    data: agendaData,
    isLoading: isLoadingAgenda
  } = useGetProjectAgendaQuery(
    project?.id,
    {
      skip: !project?.id || !wasOpened,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      // Use selectFromResult to prevent re-renders when data doesn't change
      selectFromResult: (result) => ({
        data: result.data,
        isLoading: result.isLoading
      })
    }
  );

  // Extract data from CQRS query - use cached data from Redux store
  const curriculums = agendaData?.curriculums || [];
  const projectInstructors = agendaData?.instructors || [];

  // Get groups from project data
  const groups = project?.groups || [];
  
  // Extract all courses from curriculums with proper nesting
  const availableCourses = useMemo(() => {
    if (!curriculums || curriculums.length === 0) {
      return [];
    }
    
    const courses = [];
    curriculums.forEach(projectCurriculum => {
      // Navigate through the nested structure: project_curriculums -> curriculum -> curriculum_courses -> course
      const curriculum = projectCurriculum.curriculum;
      if (curriculum && curriculum.curriculum_courses) {
        curriculum.curriculum_courses.forEach(curriculumCourse => {
          if (curriculumCourse.course) {
            const course = curriculumCourse.course;
            courses.push({
              ...course,
              curriculumTitle: curriculum.title,
              curriculumId: curriculum.id,
              displayName: `${course.title}${course.version ? ` v${course.version}` : ''} (${curriculum.title})`
            });
          }
        });
      }
    });
    
    return courses;
  }, [curriculums]);
  
  // Form state (start/end handled by useDateTimeRangeInput hook)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'other',
    allDay: false,
    location: '',
    instructor: null,
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.main,
    courseId: null,
    supportActivityId: null,
    selectedGroups: []
  });

  // Use standard color options from constants
  const colorOptions = APP_COLOR_OPTIONS;

  // Event type options
  const eventTypeOptions = [
    { value: 'course', label: 'Course', icon: <School />, color: theme.palette.primary.main },
    { value: 'supportActivity', label: 'Support Activity', icon: <Support />, color: theme.palette.info.main },
    { value: 'meeting', label: 'Meeting', icon: <EventIcon />, color: theme.palette.secondary.main },
    { value: 'break', label: 'Break', icon: <EventIcon />, color: theme.palette.warning.main },
    { value: 'other', label: 'Other', icon: <EventIcon />, color: theme.palette.grey[600] }
  ];

  // Get real instructors from project data
  const availableInstructors = useMemo(() => {
    if (!projectInstructors || projectInstructors.length === 0) {
      return [];
    }

    const instructors = projectInstructors
      .filter(pi => pi?.instructor) // Safety check
      .map(pi => ({
        id: pi.instructor.id,
        name: `${pi.instructor.firstName} ${pi.instructor.lastName}`,
        email: pi.instructor.email,
        instructorType: pi.instructorType,
        phone: pi.instructor.phone,
        expertise: pi.instructor.expertise
      }));

    return instructors;
  }, [projectInstructors]);

  // Find the main lead instructor for defaulting
  const defaultInstructor = useMemo(() => {
    if (!availableInstructors || availableInstructors.length === 0) return null;
    
    // Look for lead instructor or fallback to first instructor
    const leadInstructor = availableInstructors.find(instructor => 
      instructor.instructorType === 'lead' || instructor.instructorType === 'primary'
    );
    
    return leadInstructor || availableInstructors[0] || null;
  }, [availableInstructors]);

  // Initialize form data when event changes
  useEffect(() => {
    if (event && open) {
      // Extract courseId from event or course object
      const courseId = event.courseId || event.course?.id || null;

      // Use event instructor or default to main lead instructor
      const instructorToUse = event.instructor || defaultInstructor;

      // Initialize datetime values using raw setters (no auto-adjustment on init)
      _setStartRaw(formatDateTimeLocal(event.start));
      _setEndRaw(formatDateTimeLocal(event.end));

      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventType: event.eventType || 'other',
        allDay: event.allDay || false,
        location: event.location || '',
        instructor: instructorToUse,
        color: event.color || theme.palette.primary.main,
        backgroundColor: event.backgroundColor || event.color || theme.palette.primary.main,
        courseId: courseId,
        supportActivityId: event.supportActivityId || null,
        selectedGroups: event.event_groups?.map(eg => eg.groupId) || []
      });
    }
  }, [event, open, theme.palette.primary.main, defaultInstructor, _setStartRaw, _setEndRaw]);

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
      backgroundColor: typeConfig?.color || theme.palette.primary.main,
      // Keep courseId if still course type, otherwise clear it
      courseId: newType === 'course' ? prev.courseId : null,
      supportActivityId: newType === 'supportActivity' ? prev.supportActivityId : null
    }));
  };

  const handleClose = () => {
    resetDateTimes('', '');
    setFormData({
      title: '',
      description: '',
      eventType: 'other',
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
      return;
    }

    setLoading(true);
    try {
      // CQRS: Use semantic command for updating event
      await dispatch(eventCommands.updateEvent({
        eventId: parseInt(event.id),
        updates: {
          ...formData,
          start: new Date(startDateTime).toISOString(),
          end: new Date(endDateTime).toISOString(),
          textColor: '#fff' // Default text color for contrast
        },
        projectId: project?.id
      }));

      handleClose();
    } catch (error) {
      console.error('Error updating event:', error);
      // Error notification is handled by the semantic command
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

  // Early return if no event provided
  if (!event) {
    return null;
  }

  // Don't render anything if dialog was never opened (saves resources)
  if (!wasOpened) {
    return null;
  }

  return (
    <Dialog
      key={`edit-event-${event?.id}`}
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disablePortal={false}
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '85vh',
          height: 'auto'
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
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                Edit Event
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {event && formatDateTime(event.start)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.75rem' }}>
                Event Color
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {colorOptions.slice(0, 8).map((color) => (
                  <Box
                    key={color.name}
                    onClick={() => handleColorChange(color.value)}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: 0.5,
                      bgcolor: color.value,
                      cursor: 'pointer',
                      border: formData.color === color.value ? `2px solid ${theme.palette.text.primary}` : '1px solid transparent',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    {formData.color === color.value && (
                      <Typography 
                        sx={{ 
                          color: color.textColor || 'white', 
                          fontSize: 10, 
                          fontWeight: 'bold',
                          textShadow: color.textColor === '#000000' ? '1px 1px 2px rgba(255,255,255,0.5)' : '1px 1px 2px rgba(0,0,0,0.5)'
                        }}
                      >
                        ✓
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
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
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '& .MuiCardContent-root': {
            p: 0,
            flex: 1,
            overflow: 'auto'
          }
        }}
      >
        <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
          <Grid container spacing={2}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            {/* Event Title */}
            <Grid item xs={12} sm={8}>
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
            <Grid item xs={12} sm={4}>
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

            {/* Course Selection - Only show when event type is 'course' */}
            {formData.eventType === 'course' && (
              <Grid item xs={12}>
                <Autocomplete
                  fullWidth
                  options={availableCourses}
                  getOptionLabel={(option) => option.displayName || option.title || ''}
                  value={availableCourses.find(c => c.id === formData.courseId) || null}
                  onChange={(_, newValue) => handleInputChange('courseId', newValue?.id || null)}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Stack>
                        <Typography variant="body2">
                          {option.title}
                          {option.version && (
                            <Typography 
                              component="span" 
                              variant="body2" 
                              color="primary.main"
                              sx={{ ml: 1, fontWeight: 600 }}
                            >
                              v{option.version}
                            </Typography>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.curriculumTitle}
                          {option.duration && ` • ${option.duration} min`}
                          {option.level && ` • ${option.level}`}
                        </Typography>
                      </Stack>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Course"
                      placeholder="Choose a course from the curriculum"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <School sx={{ mr: 1, color: 'text.secondary' }} />
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
            )}

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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
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

            {/* Duration Display */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Duration"
                value={(() => {
                  if (!startDateTime || !endDateTime) return '';
                  const start = new Date(startDateTime);
                  const end = new Date(endDateTime);
                  const diffMs = end - start;
                  const diffMins = Math.round(diffMs / 60000);
                  if (diffMins < 60) return `${diffMins} minutes`;
                  const hours = Math.floor(diffMins / 60);
                  const mins = diffMins % 60;
                  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                })()}
                disabled
                helperText="Duration is automatically calculated from start and end times"
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: theme.palette.text.secondary,
                  }
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
                value={availableInstructors.find(inst => inst.id === formData.instructor?.id) || null}
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

          </Grid>

        </Box>
        
        {/* Actions - Fixed at bottom */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 2, 
          p: 2, 
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.paper'
        }}>
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
      </MainCard>
    </Dialog>
  );
};

export default EditEventDialog;