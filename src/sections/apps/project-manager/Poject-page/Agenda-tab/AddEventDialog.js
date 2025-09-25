import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Stack,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  Chip,
  CircularProgress,
  Backdrop
} from '@mui/material';
import {
  Search,
  Close,
  Add,
  School,
  Support,
  Event,
  AccessTime,
  Edit,
  Check,
  Cancel
} from '@mui/icons-material';
import MainCard from 'components/MainCard';
import { useDispatch, useSelector } from 'store';
import { createEvent, getEvents } from 'store/reducers/calendar';
import { openSnackbar } from 'store/reducers/snackbar';
import { getSingleProject, getProjectCurriculums } from 'store/reducers/projects';
import EventModalCards from './EventModalCards';
import { calculateCourseDurationFromModules } from 'utils/durationCalculations';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`add-event-tabpanel-${index}`}
      aria-labelledby={`add-event-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `add-event-tab-${index}`,
    'aria-controls': `add-event-tabpanel-${index}`,
  };
}

const AddEventDialog = ({ open, onClose, selectedTime, selectedDate, project, onEventCreated }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { events, isAdding } = useSelector((state) => state.calendar);
  const { project_curriculums, singleProject } = useSelector((state) => state.projects);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editableTime, setEditableTime] = useState(selectedTime || '9:00 AM');
  const [editableEndTime, setEditableEndTime] = useState('');
  const [isTimeEditing, setIsTimeEditing] = useState(false);
  const [isEndTimeEditing, setIsEndTimeEditing] = useState(false);
  const [timeInputValue, setTimeInputValue] = useState('');
  const [endTimeInputValue, setEndTimeInputValue] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [pendingEventIds, setPendingEventIds] = useState(new Set());

  // Helper functions for time conversion
  const convertTo24HourFormat = (time12) => {
    if (!time12) return '09:00';
    
    const [time, period] = time12.split(' ');
    if (!time || !period) return '09:00';
    
    const [hours, minutes = '00'] = time.split(':');
    let hour = parseInt(hours);
    
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  const convertTo12HourFormat = (time24) => {
    if (!time24) return '9:00 AM';
    
    const [hours, minutes = '00'] = time24.split(':');
    let hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    
    if (hour > 12) {
      hour -= 12;
    } else if (hour === 0) {
      hour = 12;
    }
    
    return `${hour}:${minutes.padStart(2, '0')} ${period}`;
  };

  // Function to find next available time slot
  const findNextAvailableTime = (requestedTime, date, projectEvents) => {
    // Use projectEvents if available (from project.events), otherwise fall back to calendar events
    const eventsToCheck = projectEvents || events || [];
    
    if (!eventsToCheck.length || !date) {
      return requestedTime;
    }
    
    // Filter events for the selected date and sort by start time
    const dayEvents = eventsToCheck.filter(event => {
      const eventDate = new Date(event.start || event.start_time);
      return eventDate.toDateString() === date.toDateString();
    }).sort((a, b) => {
      const startA = new Date(a.start || a.start_time);
      const startB = new Date(b.start || b.start_time);
      return startA - startB;
    });

    if (dayEvents.length === 0) {
      return requestedTime;
    }

    // Find the end time of the last event of the day
    const lastEvent = dayEvents[dayEvents.length - 1];
    const lastEventEnd = new Date(lastEvent.end || lastEvent.end_time);
    
    // Get the end time in 24-hour format
    const endHour = lastEventEnd.getHours();
    const endMinutes = lastEventEnd.getMinutes();
    
    // Return the end time of the last event as the next available time
    const nextAvailableTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    return convertTo12HourFormat(nextAvailableTime);
  };

  // Calculate default end time (1 hour after start time)
  const calculateDefaultEndTime = (startTime) => {
    const start24 = convertTo24HourFormat(startTime);
    const [hours, minutes] = start24.split(':').map(Number);
    
    // Add 1 hour for default duration
    let endHours = hours + 1;
    let endMinutes = minutes;
    
    // Handle day overflow
    if (endHours >= 24) {
      endHours = 23;
      endMinutes = 59;
    }
    
    return convertTo12HourFormat(`${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`);
  };

  // Update editableTime when selectedTime prop changes or dialog opens
  useEffect(() => {
    if (open && selectedDate) {
      // If selectedTime is explicitly provided (from Week/Month view clicks), use it directly
      // If selectedTime is empty/null (from Agenda view "Add Event" buttons), find next available
      let timeToUse;
      if (selectedTime) {
        // Week/Month view: use the clicked time directly
        timeToUse = selectedTime;
      } else {
        // Agenda view: find next available time slot
        const baseTime = '9:00 AM';
        timeToUse = findNextAvailableTime(baseTime, selectedDate, project?.events);
      }
      
      setEditableTime(timeToUse);
      // Set default end time (1 hour after start)
      setEditableEndTime(calculateDefaultEndTime(timeToUse));
    }
  }, [open, selectedTime, selectedDate, events, project?.events]);

  // Reset editing state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setIsTimeEditing(false);
      setTimeInputValue('');
      setIsCreatingEvent(false);
      setPendingEventIds(new Set());
    }
  }, [open]);

  // Refresh project curriculums when dialog opens to get latest courses
  useEffect(() => {
    if (open && (project?.id || singleProject?.id)) {
      const projectId = project?.id || singleProject?.id;
      dispatch(getProjectCurriculums(projectId));
    }
  }, [open, project?.id, singleProject?.id, dispatch]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearchQuery(''); // Reset search when switching tabs
  };

  const handleClose = () => {
    // Prevent closing while creating event
    if (isCreatingEvent) {
      return;
    }
    setSearchQuery('');
    setTabValue(0);
    onClose();
  };

  const getPlaceholderText = () => {
    switch (tabValue) {
      case 0:
        return 'Search for courses...';
      case 1:
        return 'Search for support activities...';
      case 2:
        return 'Search for other events...';
      default:
        return 'Search...';
    }
  };

  const getEmptyStateText = () => {
    switch (tabValue) {
      case 0:
        return 'Search for courses, modules or activities.';
      case 1:
        return 'Search for support activities, workshops or sessions.';
      case 2:
        return 'Search for meetings, breaks or custom events.';
      default:
        return 'Search for events to add.';
    }
  };

  const formatDateTime = () => {
    if (!selectedDate) return '';
    
    const date = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    
    if (editableEndTime) {
      return `${date} • ${editableTime} - ${editableEndTime}`;
    }
    return `${date} at ${editableTime}`;
  };

  const handleTimeEditStart = () => {
    setIsTimeEditing(true);
    // Convert current time to 24-hour format for input field
    const time24 = convertTo24HourFormat(editableTime);
    setTimeInputValue(time24);
  };

  const handleTimeEditCancel = () => {
    setIsTimeEditing(false);
    setTimeInputValue('');
  };

  const handleTimeEditSave = () => {
    if (timeInputValue) {
      // Convert 24-hour format back to 12-hour format with AM/PM
      const time12 = convertTo12HourFormat(timeInputValue);
      setEditableTime(time12);
      // Update end time to maintain duration if end time is set
      if (editableEndTime) {
        const newEndTime = calculateDefaultEndTime(time12);
        setEditableEndTime(newEndTime);
      }
    }
    setIsTimeEditing(false);
    setTimeInputValue('');
  };

  const handleEndTimeEditStart = () => {
    setIsEndTimeEditing(true);
    // Convert current time to 24-hour format for input field
    const time24 = convertTo24HourFormat(editableEndTime);
    setEndTimeInputValue(time24);
  };

  const handleEndTimeEditCancel = () => {
    setIsEndTimeEditing(false);
    setEndTimeInputValue('');
  };

  const handleEndTimeEditSave = () => {
    if (endTimeInputValue) {
      // Convert 24-hour format back to 12-hour format with AM/PM
      const time12 = convertTo12HourFormat(endTimeInputValue);
      setEditableEndTime(time12);
    }
    setIsEndTimeEditing(false);
    setEndTimeInputValue('');
  };


  const handleKeyPress = (event, isEndTime = false) => {
    if (event.key === 'Enter') {
      if (isEndTime) {
        handleEndTimeEditSave();
      } else {
        handleTimeEditSave();
      }
    } else if (event.key === 'Escape') {
      if (isEndTime) {
        handleEndTimeEditCancel();
      } else {
        handleTimeEditCancel();
      }
    }
  };

  // Get all courses from project curriculums (use Redux state for fresh data)
  const availableCourses = useMemo(() => {
    // Use Redux state if available, fallback to project prop
    const curriculums = project_curriculums || project?.project_curriculums;
    if (!curriculums) return [];
    
    const courses = [];
    curriculums.forEach(projectCurriculum => {
      const curriculum = projectCurriculum.curriculum;
      if (curriculum?.curriculum_courses) {
        curriculum.curriculum_courses.forEach(curriculumCourse => {
          const course = curriculumCourse.course;
          if (course) {
            // Calculate course duration from modules
            const duration = calculateCourseDurationFromModules(course.modules || []);
            
            courses.push({
              ...course,
              curriculumName: curriculum.title,
              curriculumId: curriculum.id,
              duration: duration
            });
          }
        });
      }
    });
    
    return courses;
  }, [project_curriculums, project?.project_curriculums]);

  // Get support activities from project curriculums
  const [availableSupportActivities, setAvailableSupportActivities] = useState([]);
  const [loadingSupportActivities, setLoadingSupportActivities] = useState(false);

  // Fetch support activities when project changes
  useEffect(() => {
    const fetchSupportActivities = async () => {
      if (!project?.id || loadingSupportActivities) {
        return;
      }

      setLoadingSupportActivities(true);
      try {
        const response = await fetch('/api/supportActivities/getByProject', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: project.id
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAvailableSupportActivities(data.supportActivities || []);
          } else {
            console.error('Failed to fetch support activities:', data.message);
            setAvailableSupportActivities([]);
          }
        } else {
          console.error('Failed to fetch support activities:', response.statusText);
          setAvailableSupportActivities([]);
        }
      } catch (error) {
        console.error('Error fetching support activities:', error);
        setAvailableSupportActivities([]);
      } finally {
        setLoadingSupportActivities(false);
      }
    };

    fetchSupportActivities();
  }, [project?.id]);

  // Common event suggestions for "Other" tab
  const commonEventSuggestions = useMemo(() => {
    return [
      {
        id: 'lunch',
        title: 'Lunch Break',
        description: 'Scheduled lunch time for participants',
        duration: 60,
        category: 'Break',
        icon: '🍽️'
      },
      {
        id: 'coffee',
        title: 'Coffee Break',
        description: 'Short break for refreshments',
        duration: 15,
        category: 'Break',
        icon: '☕'
      },
      {
        id: 'meeting',
        title: 'Team Meeting',
        description: 'Regular team sync-up meeting',
        duration: 30,
        category: 'Meeting',
        icon: '👥'
      },
      {
        id: 'standup',
        title: 'Daily Standup',
        description: 'Quick daily progress check-in',
        duration: 15,
        category: 'Meeting',
        icon: '🚀'
      },
      {
        id: 'retrospective',
        title: 'Retrospective',
        description: 'Team reflection and improvement discussion',
        duration: 60,
        category: 'Meeting',
        icon: '💭'
      },
      {
        id: 'presentation',
        title: 'Presentation',
        description: 'Project or topic presentation',
        duration: 45,
        category: 'Presentation',
        icon: '📊'
      },
      {
        id: 'workshop',
        title: 'Workshop',
        description: 'Interactive learning session',
        duration: 120,
        category: 'Workshop',
        icon: '🛠️'
      },
      {
        id: 'networking',
        title: 'Networking Session',
        description: 'Informal networking and socializing',
        duration: 30,
        category: 'Social',
        icon: '🤝'
      }
    ];
  }, []);

  // Filter courses based on search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery) return availableCourses;
    
    const query = searchQuery.toLowerCase();
    return availableCourses.filter(course => 
      course.title?.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query) ||
      course.curriculumName?.toLowerCase().includes(query)
    );
  }, [availableCourses, searchQuery]);

  // Get scheduled course IDs (existing only)
  const scheduledCourseIds = useMemo(() => {
    if (!events || !project?.id) return [];
    return events
      .filter(event => event.courseId && event.projectId === project.id && event.eventType === 'course')
      .map(event => event.courseId);
  }, [events, project?.id]);

  // Filter support activities based on search query
  const filteredSupportActivities = useMemo(() => {
    if (!searchQuery) return availableSupportActivities;
    
    const query = searchQuery.toLowerCase();
    return availableSupportActivities.filter(activity => 
      activity.title?.toLowerCase().includes(query) ||
      activity.description?.toLowerCase().includes(query) ||
      activity.category?.toLowerCase().includes(query) ||
      activity.instructor?.toLowerCase().includes(query)
    );
  }, [availableSupportActivities, searchQuery]);

  // Get scheduled support activity IDs (existing only)
  const scheduledSupportActivityIds = useMemo(() => {
    if (!events || !project?.id) return [];
    return events
      .filter(event => event.supportActivityId && event.projectId === project.id && event.eventType === 'supportActivity')
      .map(event => event.supportActivityId);
  }, [events, project?.id]);

  // Convert pendingEventIds Set to Array for passing to components
  const pendingEventIdsArray = useMemo(() => [...pendingEventIds], [pendingEventIds]);

  const handleCourseSelect = async (course) => {
    // Prevent multiple clicks
    if (isCreatingEvent) {
      return;
    }
    
    // Check if already being added or already exists
    if (pendingEventIds.has(course.id)) {
      return;
    }
    
    try {
      // Set creating state and add to pending
      setIsCreatingEvent(true);
      setPendingEventIds(prev => new Set([...prev, course.id]));
      
      // Note: We allow rescheduling the same course to different time slots
      // The duplicate check is removed to allow multiple schedules of the same course

      // Calculate start and end times using editableTime
      const startDate = new Date(selectedDate);
      if (editableTime) {
        const [time, period] = editableTime.split(' ');
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        startDate.setHours(hour, parseInt(minutes), 0, 0);
      } else {
        // Default to 9 AM if no time selected
        startDate.setHours(9, 0, 0, 0);
      }

      // Calculate end time based on editableEndTime or course duration
      let endDate;
      if (editableEndTime) {
        // Use the user-specified end time
        endDate = new Date(selectedDate);
        const [endTime, endPeriod] = editableEndTime.split(' ');
        const [endHours, endMinutes] = endTime.split(':');
        let endHour = parseInt(endHours);
        if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
        if (endPeriod === 'AM' && endHour === 12) endHour = 0;
        endDate.setHours(endHour, parseInt(endMinutes), 0, 0);
      } else {
        // Fallback to duration-based calculation
        const calculatedDuration = calculateCourseDurationFromModules(course.modules || []);
        const duration = calculatedDuration || 60; // Default to 60 minutes if no modules
        endDate = new Date(startDate.getTime() + duration * 60000);
      }

      // Create event data matching the format expected by the calendar reducer
      const eventData = {
        title: course.title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        eventType: 'course',
        courseId: course.id,
        projectId: project.id,
        description: course.description || '',
        color: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main,
        textColor: '#fff',
        allDay: false,
        location: '', // Can be set later
        instructor: null, // Can be set later
        extendedProps: {
          curriculumId: course.curriculumId,
          curriculumName: course.curriculumName,
          modules: course.modules || []
        }
      };

      // Use Redux action to create event
      await dispatch(createEvent(eventData, events, isAdding));
      
      // Also refresh calendar events to ensure sync
      if (project.id) {
        await dispatch(getEvents(project.id));
      }
      
      // Refresh project data to update the events in Beta tab
      if (project.id) {
        await dispatch(getSingleProject(project.id));
      }
      
      // Call the callback if provided
      if (onEventCreated) {
        onEventCreated();
      }
      
      // Show success notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Event added successfully',
          variant: 'alert',
          alert: {
            color: 'success'
          },
          close: false
        })
      );

      // Small delay to ensure state updates propagate
      setTimeout(() => {
        handleClose();
      }, 100);
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Remove from pending since creation failed
      setPendingEventIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(course.id);
        return newSet;
      });
      
      // Show error notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to add event. Please try again.',
          variant: 'alert',
          alert: {
            color: 'error'
          },
          close: false
        })
      );
    } finally {
      // Always reset creating state
      setIsCreatingEvent(false);
    }
  };

  const handleSupportActivitySelect = async (activity) => {
    // Prevent multiple clicks
    if (isCreatingEvent) {
      return;
    }
    
    // Check if already being added or already exists
    if (pendingEventIds.has(activity.id)) {
      return;
    }
    
    try {
      // Set creating state and add to pending
      setIsCreatingEvent(true);
      setPendingEventIds(prev => new Set([...prev, activity.id]));
      
      // Note: We allow rescheduling the same support activity to different time slots
      // The duplicate check is removed to allow multiple schedules of the same activity

      // Calculate start and end times using editableTime
      const startDate = new Date(selectedDate);
      if (editableTime) {
        const [time, period] = editableTime.split(' ');
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        startDate.setHours(hour, parseInt(minutes), 0, 0);
      } else {
        // Default to 9 AM if no time selected
        startDate.setHours(9, 0, 0, 0);
      }

      // Calculate end time based on editableEndTime or activity duration
      let endDate;
      if (editableEndTime) {
        // Use the user-specified end time
        endDate = new Date(selectedDate);
        const [endTime, endPeriod] = editableEndTime.split(' ');
        const [endHours, endMinutes] = endTime.split(':');
        let endHour = parseInt(endHours);
        if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
        if (endPeriod === 'AM' && endHour === 12) endHour = 0;
        endDate.setHours(endHour, parseInt(endMinutes), 0, 0);
      } else {
        // Fallback to duration-based calculation
        const duration = activity.duration || 60; // Default to 60 minutes
        endDate = new Date(startDate.getTime() + duration * 60000);
      }

      // Create event data matching the format expected by the calendar reducer
      const eventData = {
        title: activity.title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        eventType: 'supportActivity',
        supportActivityId: activity.id,
        projectId: project.id,
        description: activity.description || '',
        color: theme.palette.info.main,
        backgroundColor: theme.palette.info.main,
        textColor: '#fff',
        allDay: false,
        location: '', // Can be set later
        instructor: activity.instructor || null,
        extendedProps: {
          category: activity.category
        }
      };

      // Use Redux action to create event
      await dispatch(createEvent(eventData, events, isAdding));
      
      // Also refresh calendar events to ensure sync
      if (project.id) {
        await dispatch(getEvents(project.id));
      }
      
      // Refresh project data to update the events in Beta tab
      if (project.id) {
        await dispatch(getSingleProject(project.id));
      }
      
      // Call the callback if provided
      if (onEventCreated) {
        onEventCreated();
      }
      
      // Show success notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Support activity added successfully',
          variant: 'alert',
          alert: {
            color: 'success'
          },
          close: false
        })
      );

      // Small delay to ensure state updates propagate
      setTimeout(() => {
        handleClose();
      }, 100);
    } catch (error) {
      console.error('Error creating support activity event:', error);
      
      // Remove from pending since creation failed
      setPendingEventIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(activity.id);
        return newSet;
      });
      
      // Show error notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to add support activity. Please try again.',
          variant: 'alert',
          alert: {
            color: 'error'
          },
          close: false
        })
      );
    } finally {
      // Always reset creating state
      setIsCreatingEvent(false);
    }
  };

  const handleOtherEventSelect = async (eventSuggestion) => {
    // Prevent multiple clicks
    if (isCreatingEvent) {
      return;
    }
    
    // Check if already being added or already exists
    if (pendingEventIds.has(eventSuggestion.id)) {
      return;
    }
    
    try {
      // Set creating state and add to pending
      setIsCreatingEvent(true);
      setPendingEventIds(prev => new Set([...prev, eventSuggestion.id]));
      
      // Calculate start and end times using editableTime
      const startDate = new Date(selectedDate);
      if (editableTime) {
        const [time, period] = editableTime.split(' ');
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        startDate.setHours(hour, parseInt(minutes), 0, 0);
      } else {
        // Default to 9 AM if no time selected
        startDate.setHours(9, 0, 0, 0);
      }

      // Calculate end time based on editableEndTime or duration
      let endDate;
      if (editableEndTime) {
        // Use the user-specified end time
        endDate = new Date(selectedDate);
        const [endTime, endPeriod] = editableEndTime.split(' ');
        const [endHours, endMinutes] = endTime.split(':');
        let endHour = parseInt(endHours);
        if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
        if (endPeriod === 'AM' && endHour === 12) endHour = 0;
        endDate.setHours(endHour, parseInt(endMinutes), 0, 0);
      } else {
        // Fallback to duration-based calculation
        const duration = eventSuggestion.duration || 60; // Default to 60 minutes
        endDate = new Date(startDate.getTime() + duration * 60000);
      }

      // Create event data
      const eventData = {
        title: eventSuggestion.title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        eventType: 'other',
        projectId: project.id,
        description: eventSuggestion.description || '',
        color: theme.palette.warning.main,
        backgroundColor: theme.palette.warning.main,
        textColor: '#fff',
        allDay: false,
        location: '', // Can be set later
        extendedProps: {
          category: eventSuggestion.category,
          icon: eventSuggestion.icon
        }
      };

      // Use Redux action to create event
      await dispatch(createEvent(eventData, events, isAdding));
      
      // Also refresh calendar events to ensure sync
      if (project.id) {
        await dispatch(getEvents(project.id));
      }
      
      // Refresh project data to update the events in Beta tab
      if (project.id) {
        await dispatch(getSingleProject(project.id));
      }
      
      // Call the callback if provided
      if (onEventCreated) {
        onEventCreated();
      }
      
      // Show success notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Event added successfully',
          variant: 'alert',
          alert: {
            color: 'success'
          },
          close: false
        })
      );

      // Small delay to ensure state updates propagate
      setTimeout(() => {
        handleClose();
      }, 100);
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Show error notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to add event. Please try again.',
          variant: 'alert',
          alert: {
            color: 'error'
          },
          close: false
        })
      );
    } finally {
      // Always reset creating state and remove from pending
      setPendingEventIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventSuggestion.id);
        return newSet;
      });
      // Always reset creating state
      setIsCreatingEvent(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isCreatingEvent}
      PaperProps={{
        sx: {
          borderRadius: 2,
          height: 'auto',
          maxHeight: '90vh',
          p: 0,
          m: { xs: 1, sm: 2 },
          width: { xs: 'calc(100% - 16px)', sm: 'auto' },
          maxWidth: { xs: 'none', sm: 600 }
        }
      }}
    >
      <MainCard
        title="Add Event"
        secondary={
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {selectedDate && (
              <Stack direction="row" alignItems="center" spacing={1}>
                {/* Start Time */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {isTimeEditing ? (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <TextField
                        type="time"
                        value={timeInputValue}
                        onChange={(e) => setTimeInputValue(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, false)}
                        size="small"
                        sx={{
                          '& .MuiInputBase-input': {
                            fontSize: '0.75rem',
                            py: 0.25,
                            px: 1
                          },
                          '& .MuiOutlinedInput-root': {
                            height: 28,
                            minWidth: 80
                          }
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={handleTimeEditSave}
                        sx={{ color: 'success.main', p: 0.25 }}
                      >
                        <Check fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleTimeEditCancel}
                        sx={{ color: 'error.main', p: 0.25 }}
                      >
                        <Cancel fontSize="small" />
                      </IconButton>
                    </Stack>
                  ) : (
                    <Tooltip title="Click to edit start time">
                      <TextField
                        value={editableTime}
                        onClick={handleTimeEditStart}
                        size="small"
                        InputProps={{
                          readOnly: true,
                          sx: { cursor: 'pointer' }
                        }}
                        sx={{
                          width: 100,
                          '& .MuiInputBase-input': {
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 1,
                            cursor: 'pointer',
                            textAlign: 'center'
                          },
                          '& .MuiOutlinedInput-root': {
                            height: 28,
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main
                              }
                            }
                          }
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  -
                </Typography>

                {/* End Time */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {isEndTimeEditing ? (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <TextField
                        type="time"
                        value={endTimeInputValue}
                        onChange={(e) => setEndTimeInputValue(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, true)}
                        size="small"
                        sx={{
                          '& .MuiInputBase-input': {
                            fontSize: '0.75rem',
                            py: 0.25,
                            px: 1
                          },
                          '& .MuiOutlinedInput-root': {
                            height: 28,
                            minWidth: 80
                          }
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={handleEndTimeEditSave}
                        sx={{ color: 'success.main', p: 0.25 }}
                      >
                        <Check fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleEndTimeEditCancel}
                        sx={{ color: 'error.main', p: 0.25 }}
                      >
                        <Cancel fontSize="small" />
                      </IconButton>
                    </Stack>
                  ) : (
                    <Tooltip title="Click to edit end time">
                      <TextField
                        value={editableEndTime}
                        onClick={handleEndTimeEditStart}
                        size="small"
                        InputProps={{
                          readOnly: true,
                          sx: { cursor: 'pointer' }
                        }}
                        sx={{
                          width: 100,
                          '& .MuiInputBase-input': {
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 1,
                            cursor: 'pointer',
                            textAlign: 'center'
                          },
                          '& .MuiOutlinedInput-root': {
                            height: 28,
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main
                              }
                            }
                          }
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
              </Stack>
            )}
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Stack>
        }
        sx={{ 
          m: 0,
          '& .MuiCardContent-root': {
            p: 0
          }
        }}
      >
        {/* Tabs */}
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: 1, mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="add event tabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                minWidth: { xs: 100, sm: 120 },
                px: { xs: 1, sm: 2 },
                '&.Mui-selected': {
                  fontWeight: 600,
                  color: theme.palette.text.primary
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab
              icon={<School sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Course"
              {...a11yProps(0)}
            />
            <Tab
              icon={<Support sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Support Activity"
              {...a11yProps(1)}
            />
            <Tab
              icon={<Event sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Other"
              {...a11yProps(2)}
            />
          </Tabs>
        </Box>

        <Divider />

        {/* Search Bar */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={getPlaceholderText()}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                backgroundColor: theme.palette.grey[50],
                '&:hover': {
                  backgroundColor: theme.palette.grey[100]
                },
                '&.Mui-focused': {
                  backgroundColor: 'background.paper'
                }
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'transparent'
                },
                '&:hover fieldset': {
                  borderColor: 'transparent'
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main
                }
              }
            }}
          />
        </Box>

        {/* Tab Content */}
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
          <TabPanel value={tabValue} index={0}>
            {/* Course Content */}
            {searchQuery || availableCourses.length > 0 ? (
              <Box>
                {searchQuery && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {filteredCourses.length > 0 
                      ? `Found ${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''} matching "${searchQuery}"`
                      : `No courses found for "${searchQuery}"`
                    }
                  </Typography>
                )}
                
                {/* Course List */}
                <Box sx={{ maxHeight: { xs: '50vh', sm: '40vh' }, overflowY: 'auto', p: 1 }}>
                  <EventModalCards 
                    items={searchQuery ? filteredCourses : availableCourses}
                    onItemSelect={handleCourseSelect}
                    type="course"
                    scheduledItemIds={scheduledCourseIds}
                    pendingItemIds={pendingEventIdsArray}
                  />
                </Box>
                
                {(searchQuery ? filteredCourses : availableCourses).length === 0 && !searchQuery && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <School sx={{ fontSize: 36, color: 'text.secondary', mb: 1.5 }} />
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      No courses available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add courses to your project curriculum to see them here.
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Search sx={{ fontSize: 36, color: 'text.secondary', mb: 1.5 }} />
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Search for courses
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getEmptyStateText()}
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Support Activity Content */}
            {searchQuery || availableSupportActivities.length > 0 ? (
              <Box>
                {searchQuery && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {filteredSupportActivities.length > 0 
                      ? `Found ${filteredSupportActivities.length} support ${filteredSupportActivities.length !== 1 ? 'activities' : 'activity'} matching "${searchQuery}"`
                      : `No support activities found for "${searchQuery}"`
                    }
                  </Typography>
                )}
                
                {/* Support Activity List */}
                <Box sx={{ maxHeight: { xs: '50vh', sm: '40vh' }, overflowY: 'auto', p: 1 }}>
                  <EventModalCards 
                    items={searchQuery ? filteredSupportActivities : availableSupportActivities}
                    onItemSelect={handleSupportActivitySelect}
                    type="supportActivity"
                    scheduledItemIds={scheduledSupportActivityIds}
                    pendingItemIds={pendingEventIdsArray}
                  />
                </Box>
                
                {(searchQuery ? filteredSupportActivities : availableSupportActivities).length === 0 && !searchQuery && !loadingSupportActivities && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Support sx={{ fontSize: 36, color: 'text.secondary', mb: 1.5 }} />
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      No support activities available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add support activities to your project curriculums to see them here.
                    </Typography>
                  </Box>
                )}
                
                {loadingSupportActivities && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Loading support activities...
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Search sx={{ fontSize: 36, color: 'text.secondary', mb: 1.5 }} />
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Search for support activities
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getEmptyStateText()}
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {/* Other Events Content */}
            <Box>
              {!searchQuery && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choose from common event types or search for specific events.
                </Typography>
              )}
              
              {/* Event Suggestions List */}
              <Box sx={{ maxHeight: { xs: '50vh', sm: '40vh' }, overflowY: 'auto', p: 1 }}>
                <EventModalCards 
                  items={commonEventSuggestions}
                  onItemSelect={handleOtherEventSelect}
                  type="other"
                  scheduledItemIds={[]} // Other events don't have scheduled state tracking yet
                  pendingItemIds={pendingEventIdsArray}
                />
              </Box>

              {/* Quick Create Button for Custom Events */}
              <Box sx={{ textAlign: 'center', pt: 2, mt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => {
                    // TODO: Implement custom event creation form
                    console.log('Quick create custom event');
                  }}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1,
                    borderStyle: 'dashed',
                    '&:hover': {
                      borderStyle: 'solid'
                    }
                  }}
                >
                  Create Custom Event
                </Button>
              </Box>
            </Box>
          </TabPanel>
        </Box>
        
        {/* Loading Overlay */}
        <Backdrop
          sx={{ 
            position: 'absolute',
            zIndex: 9999,
            color: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 2
          }}
          open={isCreatingEvent}
        >
          <Stack alignItems="center" spacing={2}>
            <CircularProgress color="inherit" />
            <Typography variant="body1" color="inherit">
              Adding event to calendar...
            </Typography>
          </Stack>
        </Backdrop>
      </MainCard>
    </Dialog>
  );
};

export default AddEventDialog;