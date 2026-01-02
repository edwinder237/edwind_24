import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { useGetProjectAgendaQuery } from 'store/api/projectApi';
import { eventCommands } from 'store/commands';
import { openSnackbar } from 'store/reducers/snackbar';
import EventModalCards from '../components/EventModalCards';
import { calculateCourseDurationFromModules } from 'utils/durationCalculations';
import { useTimeRangeInput } from 'hooks/useTimeRangeInput';

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

const AddEventDialog = ({ open, onClose, selectedTime, selectedDate, project, onEventCreated, operationInProgressRef, isFetchingAgendaRef }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // CQRS: Fetch agenda data using RTK Query (includes instructors, events, curriculums)
  const {
    data: agendaData,
    isLoading: isLoadingAgenda
  } = useGetProjectAgendaQuery(
    project?.id,
    {
      skip: !project?.id || !open,
      refetchOnMountOrArgChange: true
    }
  );

  // Extract data from CQRS query
  const projectInstructors = agendaData?.instructors || [];
  const agendaEvents = agendaData?.events || [];
  const projectCurriculums = agendaData?.curriculums || project?.project_curriculums || [];

  // Find the main lead instructor (assuming first instructor or specific role)
  const defaultInstructor = useMemo(() => {
    if (!projectInstructors || projectInstructors.length === 0) return null;

    // Look for lead instructor or fallback to first instructor
    const leadInstructor = projectInstructors.find(pi =>
      pi.instructorType === 'lead' || pi.instructorType === 'primary'
    );

    return leadInstructor?.instructor || projectInstructors[0]?.instructor || null;
  }, [projectInstructors]);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Use the reusable time range hook with auto-adjustment
  const {
    startTime: timeInputValue,
    endTime: endTimeInputValue,
    setStartTime: setTimeInputValue,
    setEndTime: setEndTimeInputValue,
    reset: resetTimes,
    _setStartTimeRaw,
    _setEndTimeRaw
  } = useTimeRangeInput({ minDurationMinutes: 60 });

  const [isTimeEditing, setIsTimeEditing] = useState(false);
  const [isEndTimeEditing, setIsEndTimeEditing] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Computed 12-hour display values from 24-hour hook values
  const editableTime = useMemo(() => {
    if (!timeInputValue) return '9:00 AM';
    const [hours, minutes = '00'] = timeInputValue.split(':');
    let hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    else if (hour === 0) hour = 12;
    return `${hour}:${minutes.padStart(2, '0')} ${period}`;
  }, [timeInputValue]);

  const editableEndTime = useMemo(() => {
    if (!endTimeInputValue) return '';
    const [hours, minutes = '00'] = endTimeInputValue.split(':');
    let hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    else if (hour === 0) hour = 12;
    return `${hour}:${minutes.padStart(2, '0')} ${period}`;
  }, [endTimeInputValue]);

  // IMPORTANT: Use the shared ref passed from parent (FullCalendarWeekViewCQRS)
  // This prevents rapid-fire event creation AND prevents opening dialog during operations
  // If no ref provided (backward compatibility), create local ref
  const localRef = useRef(false);
  const creationInProgressRef = operationInProgressRef || localRef;

  // Helper function to handle event creation using CQRS architecture
  const createEventWithStateUpdate = async (eventData) => {
    // CRITICAL: Check ref FIRST - it's synchronous and prevents race conditions
    if (creationInProgressRef.current) {
      console.log('[AddEventDialog] Event creation BLOCKED by ref - operation already in progress');
      dispatch(openSnackbar({
        open: true,
        message: 'Please wait - an event is currently being created',
        variant: 'alert',
        alert: { color: 'warning' },
        close: false,
        anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
        autoHideDuration: 2000
      }));
      return;
    }

    try {
      // Set ref IMMEDIATELY to block all subsequent creation attempts
      creationInProgressRef.current = true;
      console.log(`[AddEventDialog] [${new Date().toISOString()}] Event creation started - ref set to TRUE`);

      setIsCreatingEvent(true);

      // CQRS: Use semantic command for event creation
      // RTK Query automatically invalidates cache and refetches data
      // Event bus publishes domain events for real-time updates
      const startTime = Date.now();
      await dispatch(eventCommands.createEvent({
        projectId: project.id,
        eventData: eventData
      }));
      console.log(`[AddEventDialog] [${new Date().toISOString()}] Event creation completed (${Date.now() - startTime}ms)`);

      // Update the next available time slot based on the event we just created
      // This ensures subsequent events don't overlap
      const endDate = new Date(eventData.end);
      const nextTime24 = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      const nextEndTime = convertTo12HourFormat(nextTime24);
      const nextEndTime24 = convertTo24HourFormat(calculateDefaultEndTime(nextEndTime));
      resetTimes(nextTime24, nextEndTime24);

      // CRITICAL: Wait for ACTUAL RTK Query cache invalidation + refetch to complete
      // The create command invalidates ProjectAgenda tag which triggers fetchProjectAgenda
      // We monitor isFetchingAgendaRef and wait until it becomes false
      // This works on any connection speed - fast or slow connections handled automatically!
      console.log(`[AddEventDialog] [${new Date().toISOString()}] Waiting for agenda refetch to complete...`);

      if (isFetchingAgendaRef) {
        // Poll isFetchingAgendaRef until refetch completes (with timeout safety)
        const maxWaitTime = 30000; // 30 second timeout for very slow connections
        const pollInterval = 100; // Check every 100ms
        let waited = 0;

        while (isFetchingAgendaRef.current && waited < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          waited += pollInterval;
        }

        if (waited >= maxWaitTime) {
          console.warn(`[AddEventDialog] Timeout waiting for agenda refetch (${waited}ms)`);
        } else {
          console.log(`[AddEventDialog] [${new Date().toISOString()}] Agenda refetch completed (waited ${waited}ms)`);
        }
      } else {
        console.log(`[AddEventDialog] [${new Date().toISOString()}] No refetch in progress`);
      }

      // Call callback if provided
      if (onEventCreated) {
        onEventCreated();
      }

      // Close dialog after successful creation
      onClose();

    } catch (error) {
      console.error('[AddEventDialog] Error creating event:', error);
      // Error notification is handled by the semantic command
    } finally {
      setIsCreatingEvent(false);
      // Reset ref AFTER all operations complete
      creationInProgressRef.current = false;
      console.log(`[AddEventDialog] [${new Date().toISOString()}] Operation complete - ref reset to FALSE`);
    }
  };
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

    // CQRS: Use projectEvents passed as parameter (from agendaEvents)
    const eventsToCheck = projectEvents || [];
    
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
    
    // Check if this event end time looks suspicious (like midnight of next day)
    if (lastEventEnd.getUTCHours() === 0 && lastEventEnd.getUTCMinutes() === 0) {
    }
    
    // Get the end time in 24-hour format
    let endHour = lastEventEnd.getHours();
    let endMinutes = lastEventEnd.getMinutes();
    
    // TEMPORARY FIX: If event end time is midnight UTC (indicating timezone bug),
    // default to 6:00 PM local time instead of converting the erroneous time
    if (lastEventEnd.getUTCHours() === 0 && lastEventEnd.getUTCMinutes() === 0) {
      endHour = 18; // 6:00 PM
      endMinutes = 0;
    }
    
    // Return the end time of the last event as the next available time
    const nextAvailableTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    const result = convertTo12HourFormat(nextAvailableTime);
    return result;
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

  // Update time values when selectedTime prop changes or dialog opens
  useEffect(() => {
    if (open && selectedDate) {
      // If selectedTime is explicitly provided (from Week/Month view clicks), use it directly
      // If selectedTime is empty/null (from Agenda view "Add Event" buttons), find next available
      let timeToUse;
      if (selectedTime) {
        // Week/Month view: use the clicked time directly
        timeToUse = selectedTime;
      } else {
        // Agenda view: find next available time slot using latest events from CQRS
        const currentEvents = agendaEvents || project?.events || [];
        const baseTime = '9:00 AM';
        timeToUse = findNextAvailableTime(baseTime, selectedDate, currentEvents);
      }

      // Convert 12-hour to 24-hour format for the hook
      const time24 = convertTo24HourFormat(timeToUse);
      const endTime24 = convertTo24HourFormat(calculateDefaultEndTime(timeToUse));

      // Use raw setters to initialize without triggering auto-adjustment
      _setStartTimeRaw(time24);
      _setEndTimeRaw(endTime24);
    }
  }, [open, selectedTime, selectedDate, agendaEvents, project?.events, _setStartTimeRaw, _setEndTimeRaw]);

  // Reset editing state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setIsTimeEditing(false);
      setIsEndTimeEditing(false);
      resetTimes('09:00', '10:00');
      setIsCreatingEvent(false);
      setPendingEventIds(new Set());
    }
  }, [open, resetTimes]);

  // CQRS: Project curriculums are automatically loaded via useGetProjectAgendaQuery
  // No manual dispatch needed - RTK Query handles it

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
    // timeInputValue is already in 24-hour format from the hook
  };

  const handleTimeEditCancel = () => {
    setIsTimeEditing(false);
  };

  const handleTimeEditSave = () => {
    // Hook already has the value, just close edit mode
    // Auto-adjustment of end time is handled by the hook
    setIsTimeEditing(false);
  };

  const handleEndTimeEditStart = () => {
    setIsEndTimeEditing(true);
    // endTimeInputValue is already in 24-hour format from the hook
  };

  const handleEndTimeEditCancel = () => {
    setIsEndTimeEditing(false);
  };

  const handleEndTimeEditSave = () => {
    // Hook already has the value with auto-adjustment, just close edit mode
    setIsEndTimeEditing(false);
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

  // CQRS: Get all courses from project curriculums (loaded via RTK Query)
  const availableCourses = useMemo(() => {
    if (!projectCurriculums) return [];

    const courses = [];
    projectCurriculums.forEach(projectCurriculum => {
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
  }, [projectCurriculums]);

  // Get support activities from project curriculums
  const [availableSupportActivities, setAvailableSupportActivities] = useState([]);
  const [loadingSupportActivities, setLoadingSupportActivities] = useState(false);

  // Fetch support activities when dialog is opened (not just when project changes)
  useEffect(() => {
    const fetchSupportActivities = async () => {
      if (!open || !project?.id || loadingSupportActivities) {
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
  }, [open, project?.id]);

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

  // CQRS: Get scheduled course IDs from agendaEvents
  const scheduledCourseIds = useMemo(() => {
    if (!agendaEvents || !project?.id) return [];
    return agendaEvents
      .filter(event => event.courseId && event.projectId === project.id && event.eventType === 'course')
      .map(event => event.courseId);
  }, [agendaEvents, project?.id]);

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

  // CQRS: Get scheduled support activity IDs from agendaEvents
  const scheduledSupportActivityIds = useMemo(() => {
    if (!agendaEvents || !project?.id) return [];
    return agendaEvents
      .filter(event => event.supportActivityId && event.projectId === project.id && event.eventType === 'supportActivity')
      .map(event => event.supportActivityId);
  }, [agendaEvents, project?.id]);

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
        
        // Create end date using the same date as startDate to avoid timezone issues
        endDate = new Date(startDate);
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
        instructor: defaultInstructor, // Default to project main lead instructor
        extendedProps: {
          curriculumId: course.curriculumId,
          curriculumName: course.curriculumName,
          modules: course.modules || []
        }
      };

      // Use the new helper function to create event with proper state updates
      await createEventWithStateUpdate(eventData);

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
        
        // Create end date using the same date as startDate to avoid timezone issues
        endDate = new Date(startDate);
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
        instructor: activity.instructor || defaultInstructor, // Use activity instructor or default to project main lead
        extendedProps: {
          category: activity.category
        }
      };

      // Use the new helper function to create event with proper state updates
      await createEventWithStateUpdate(eventData);

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
        
        // Create end date using the same date as startDate to avoid timezone issues
        endDate = new Date(startDate);
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
        instructor: defaultInstructor, // Default to project main lead instructor
        extendedProps: {
          category: eventSuggestion.category,
          icon: eventSuggestion.icon
        }
      };

      // Use the new helper function to create event with proper state updates
      await createEventWithStateUpdate(eventData);

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
                    disabled={isCreatingEvent}
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
                    disabled={isCreatingEvent}
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
                  disabled={isCreatingEvent}
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