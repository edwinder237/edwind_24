import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Card,
  CardContent,
  IconButton,
  Button,
  Divider,
  Avatar,
  useTheme,
  alpha,
  Collapse,
  Tooltip,
  Badge,
  TextField,
  MenuItem,
  InputAdornment,
  Autocomplete,
  Switch,
  FormControlLabel,
  useMediaQuery
} from '@mui/material';
import MainCard from 'components/MainCard';
import {
  ExpandMore,
  AccessTime,
  LocationOn,
  Person,
  Group,
  CalendarToday,
  AddCircleOutline,
  CheckCircle,
  Cancel,
  Schedule,
  FiberManualRecord,
  NavigateNext,
  MoreVert,
  Save,
  Edit,
  KeyboardArrowDown,
  ViewList,
  ViewModule
} from '@mui/icons-material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DraggableEventCard from '../../features/events/components/DraggableEventCard';
import AddEventDialog from '../../features/events/dialogs/AddEventDialog';
import EditEventDialog from '../../features/events/dialogs/EditEventDialog';
import { useDispatch } from 'store';
import { updateEvent } from 'store/commands/eventCommands';

// Drag types
const ItemTypes = {
  EVENT: 'event'
};



// ==============================|| DROP ZONE TIME SLOT ||============================== //

const DropZoneTimeSlot = ({ time, event, hour, dayDate, isLast, onDrop, onSelect, onTimeEdit, selectedTimeSlot, theme, localEvents, project, setSelectedEventTime, setSelectedEventDate, setAddEventDialogOpen, onEventUpdate, onEditEvent, conflictingEvents, isMobile }) => {
  const [isHovering, setIsHovering] = useState(false);
  
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.EVENT,
    drop: (item) => {
      onDrop(item.event, dayDate, hour);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const hasEvent = !!event;
  const isSelected = selectedTimeSlot === event?.id;
  const isDropActive = isOver && canDrop;

  const handleAddEvent = () => {
    setSelectedEventTime(time);
    setSelectedEventDate(dayDate);
    setAddEventDialogOpen(true);
  };

  return (
    <Box
      ref={drop}
      sx={{ position: 'relative', display: 'flex', gap: isMobile ? 1 : 2 }}
    >
      {/* Timeline - Hide on mobile */}
      {!isMobile && (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 80,
          flexShrink: 0
        }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: hasEvent ? 'text.primary' : 'text.secondary',
              mb: 1
            }}
          >
            {time}
          </Typography>
          <Box sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: hasEvent ? (event.eventType === 'course' ? theme.palette.primary.main : theme.palette.info.main) : theme.palette.grey[700],
            border: `2px solid ${theme.palette.background.paper}`,
            boxShadow: hasEvent ? theme.shadows[2] : 'none',
            zIndex: 1
          }} />
          {!isLast && (
            <Box sx={{
              width: 2,
              flex: 1,
              bgcolor: theme.palette.divider,
              mt: 1
            }} />
          )}
        </Box>
      )}

      {/* Event Card or Drop Zone */}
      {hasEvent ? (
        <DraggableEventCard
          event={event}
          isSelected={isSelected}
          isConflicting={conflictingEvents && conflictingEvents.includes(event.id)}
          onSelect={onSelect}
          onTimeEdit={onTimeEdit}
          onMoveToNextDay={onTimeEdit}
          allEvents={localEvents}
          project={project}
          onEventUpdate={onEventUpdate}
          onEditEvent={onEditEvent}
        />
      ) : (
        <Box
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          sx={{
            flex: 1,
            mb: 3,
            minHeight: 80,
            border: isDropActive
              ? `2px solid ${theme.palette.primary.main}`
              : `1px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            bgcolor: isDropActive
              ? alpha(theme.palette.primary.main, 0.1)
              : isHovering
                ? alpha(theme.palette.primary.main, 0.05)
                : 'transparent',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: canDrop ? 1 : 0.3,
            position: 'relative',
            cursor: isHovering ? 'pointer' : 'default'
          }}
        >
          {isDropActive && (
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
              📅 Drop event here
            </Typography>
          )}
          {canDrop && !isDropActive && !isHovering && (
            <Typography variant="caption" color="text.secondary">
              Drop zone
            </Typography>
          )}
          {isHovering && !isDropActive && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddCircleOutline />}
              onClick={handleAddEvent}
              sx={{
                bgcolor: theme.palette.mode === 'dark' 
                  ? theme.palette.primary.main 
                  : theme.palette.primary.main,
                color: theme.palette.mode === 'dark'
                  ? theme.palette.primary.contrastText
                  : '#FFFFFF',
                fontSize: '0.75rem',
                px: 2,
                py: 0.5,
                minWidth: 'auto',
                boxShadow: theme.shadows[2],
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark'
                    ? theme.palette.primary.dark
                    : theme.palette.primary.dark,
                  color: '#FFFFFF',
                  boxShadow: theme.shadows[4],
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Add Event
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

// ==============================|| AGENDA VIEW ||============================== //

const AgendaViewContent = ({ project, events, curriculums = [], onEventSelect }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));
  const [expandedDays, setExpandedDays] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [localEvents, setLocalEvents] = useState(events);
  const [viewMode, setViewMode] = useState('compact'); // 'detailed' or 'compact'
  const [hasInitialized, setHasInitialized] = useState(false);
  const [useProjectTimeRange, setUseProjectTimeRange] = useState(true);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [selectedEventTime, setSelectedEventTime] = useState('');
  const [selectedEventDate, setSelectedEventDate] = useState(null);
  const [conflictingEvents, setConflictingEvents] = useState([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  // Edit dialog state - lifted from DraggableEventCard to prevent re-render issues
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

  // Callback to open edit dialog from child components
  const handleOpenEditDialog = useCallback((event) => {
    setEventToEdit(event);
    setEditDialogOpen(true);
  }, []);

  // Function to detect overlapping/conflicting events
  const detectConflicts = useCallback((events) => {
    const conflicts = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        
        const start1 = new Date(event1.start);
        const end1 = new Date(event1.end);
        const start2 = new Date(event2.start);
        const end2 = new Date(event2.end);
        
        // Check if events overlap
        const hasTimeOverlap = 
          (start1 < end2 && end1 > start2) || 
          (start2 < end1 && end2 > start1);
        
        // Check if they're on the same day for all-day events
        const sameDay = start1.toDateString() === start2.toDateString();
        
        if (hasTimeOverlap || (event1.allDay && event2.allDay && sameDay)) {
          // Add both events to conflicts if not already there
          if (!conflicts.find(c => c.id === event1.id)) {
            conflicts.push(event1);
          }
          if (!conflicts.find(c => c.id === event2.id)) {
            conflicts.push(event2);
          }
        }
      }
    }
    
    return conflicts;
  }, []);

  // Update conflicts when events change
  useEffect(() => {
    const conflicts = detectConflicts(localEvents);
    setConflictingEvents(conflicts.map(e => e.id));
  }, [localEvents, detectConflicts]);

  // Groups data is provided via props from parent component that manages project data
  // No need to fetch groups separately as they're part of the project agenda data

  // Update local events when props change
  React.useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  // Callback to update a specific event in localEvents (for immediate UI updates)
  const updateLocalEvent = useCallback((eventId, updatedData) => {
    setLocalEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === eventId 
          ? { ...event, ...updatedData }
          : event
      )
    );
  }, []);

  // Group events by day
  const eventsByDay = useMemo(() => {
    
    // First, determine the project's date range
    const projectStartDate = project?.startDate ? new Date(project.startDate) : null;
    const projectEndDate = project?.endDate ? new Date(project.endDate) : null;
    const projectDuration = project?.duration || 5; // Default to 5 days if no duration specified
    
    // Calculate all days in the project range
    const allDays = [];
    
    // Check multiple possible locations for project dates
    const settings = project?.project_settings;
    const settingsStartDate = settings?.startDate ? new Date(settings.startDate) : null;
    const settingsEndDate = settings?.endDate ? new Date(settings.endDate) : null;
    
    
    // Enhanced date validation - check for valid dates (not Unix epoch 0 and not 1969/1970)
    const isValidDate = (date) => {
      if (!date) return false;
      const time = date.getTime();
      const year = date.getFullYear();
      // Reject Unix epoch 0, dates before 2000, and invalid dates
      return time !== 0 && year >= 2000 && !isNaN(time);
    };
    
    // Prioritize settings dates over project dates since settings dates are more reliable
    if (isValidDate(settingsStartDate) && isValidDate(settingsEndDate)) {
      // Use dates from project settings (most reliable)
      const currentDate = new Date(settingsStartDate);
      while (currentDate <= settingsEndDate) {
        allDays.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (isValidDate(settingsStartDate) && projectDuration) {
      // Use start date from settings + duration from project
      const currentDate = new Date(settingsStartDate);
      for (let i = 0; i < projectDuration; i++) {
        allDays.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (isValidDate(projectStartDate) && isValidDate(projectEndDate)) {
      // Use explicit start and end dates from project (fallback)
      const currentDate = new Date(projectStartDate);
      while (currentDate <= projectEndDate) {
        allDays.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (isValidDate(projectStartDate) && projectDuration) {
      // Use start date + duration from project (fallback)
      const currentDate = new Date(projectStartDate);
      for (let i = 0; i < projectDuration; i++) {
        allDays.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    // If we have events but no days calculated yet, use event dates
    if (allDays.length === 0 && localEvents.length > 0) {
      const sortedEvents = [...localEvents].sort((a, b) => new Date(a.start) - new Date(b.start));
      const firstEventDate = new Date(sortedEvents[0].start);
      const lastEventDate = new Date(sortedEvents[sortedEvents.length - 1].start);
      
      const currentDate = new Date(firstEventDate);
      while (currentDate <= lastEventDate) {
        allDays.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    // Final fallback if still no days
    if (allDays.length === 0) {
      // Final fallback: create days based on duration starting from today
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      for (let i = 0; i < projectDuration; i++) {
        allDays.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Group events by day
    const grouped = {};
    const sortedEvents = [...localEvents].sort((a, b) => new Date(a.start) - new Date(b.start));
    
    // Check if any events fall outside the calculated date range
    let hasEventsOutsideRange = false;
    const eventDatesOutsideRange = new Set();
    
    sortedEvents.forEach(event => {
      const eventDate = new Date(event.start);
      const eventDateStr = eventDate.toDateString();
      const isInRange = allDays.some(day => day.toDateString() === eventDateStr);
      
      if (!isInRange) {
        hasEventsOutsideRange = true;
        eventDatesOutsideRange.add(eventDateStr);
      }
    });
    
    // If events are outside the calculated range, use event dates instead
    if (hasEventsOutsideRange && sortedEvents.length > 0) {
      // Clear allDays and rebuild from event dates
      allDays.length = 0;
      
      // Get the date range from events
      const firstEventDate = new Date(sortedEvents[0].start);
      const lastEventDate = new Date(sortedEvents[sortedEvents.length - 1].start);
      
      // Create days from first to last event date
      const currentDate = new Date(firstEventDate);
      currentDate.setHours(0, 0, 0, 0);
      
      while (currentDate <= lastEventDate) {
        allDays.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    // Initialize all days with empty events array
    allDays.forEach(date => {
      const dayKey = date.toDateString();
      grouped[dayKey] = {
        date: new Date(date),
        events: []
      };
    });
    
    // Add events to their respective days
    sortedEvents.forEach(event => {
      const date = new Date(event.start);
      const dayKey = date.toDateString();
      if (grouped[dayKey]) {
        grouped[dayKey].events.push(event);
      }
    });

    // Convert to array and add day numbers
    const result = allDays.map((date, index) => {
      const dayKey = date.toDateString();
      const day = grouped[dayKey];
      return {
        ...day,
        dayNumber: index + 1,
        isToday: new Date().toDateString() === dayKey,
        isPast: day.date < new Date() && new Date().toDateString() !== dayKey
      };
    });
    
    
    return result;
  }, [localEvents, project?.startDate, project?.endDate, project?.duration, project?.project_settings]);

  // Set only today's events as expanded by default on first load and scroll to today
  React.useEffect(() => {
    if (eventsByDay.length > 0 && !hasInitialized) {
      // Find today's day and expand only that
      const todayDay = eventsByDay.find(d => d.isToday);
      if (todayDay) {
        setExpandedDays([todayDay.dayNumber]);

        // Scroll to today's section after a brief delay to ensure DOM is ready
        setTimeout(() => {
          const todayElement = document.getElementById(`day-section-${todayDay.dayNumber}`);
          if (todayElement) {
            todayElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 100);
      } else {
        // If no events today, expand the first day with events
        setExpandedDays([eventsByDay[0].dayNumber]);
      }
      setHasInitialized(true);
    }
  }, [eventsByDay, hasInitialized]);

  // Listen for custom event to expand a specific day (from Today button)
  React.useEffect(() => {
    const handleExpandDay = (e) => {
      const { dayNumber, eventId } = e.detail;
      if (dayNumber) {
        // Expand the day if not already expanded
        setExpandedDays(prev => {
          if (prev.includes(dayNumber)) return prev;
          return [...prev, dayNumber];
        });

        // If an event ID is provided, select it
        if (eventId) {
          setSelectedTimeSlot(eventId);
          if (onEventSelect) {
            onEventSelect(eventId);
          }
        }
      }
    };

    window.addEventListener('agenda:expandDay', handleExpandDay);
    return () => {
      window.removeEventListener('agenda:expandDay', handleExpandDay);
    };
  }, [onEventSelect]);

  // Date range calculation removed - not used in UI

  const handleDayToggle = (dayNumber) => {
    setExpandedDays(prev =>
      prev.includes(dayNumber)
        ? prev.filter(d => d !== dayNumber)
        : [...prev, dayNumber]
    );
  };

  const handleEventDrop = useCallback(async (draggedEvent, dayDate, hour) => {
    // Calculate new start and end times
    const newStart = new Date(dayDate);
    newStart.setHours(hour, 0, 0, 0);

    const duration = new Date(draggedEvent.end) - new Date(draggedEvent.start);
    const newEnd = new Date(newStart.getTime() + duration);

    const updatedEvent = {
      ...draggedEvent,
      start: newStart.toISOString(),
      end: newEnd.toISOString()
    };

    // Optimistically update the UI first
    const updatedEvents = localEvents.map(event => {
      if (event.id === draggedEvent.id) {
        return updatedEvent;
      }
      return event;
    });

    setLocalEvents(updatedEvents);

    try {
      // Use semantic command for updating event via CQRS architecture
      await dispatch(updateEvent({
        eventId: parseInt(draggedEvent.id),
        updates: {
          start: updatedEvent.start,
          end: updatedEvent.end,
          title: updatedEvent.title
        },
        projectId: project?.id
      }));

      // Success notification is handled by the semantic command
    } catch (error) {
      console.error('Error updating event:', error);
      
      // Revert the optimistic update on error
      setLocalEvents(localEvents);
      
      // Error notification is handled by the semantic command
    }
  }, [localEvents, project?.id, dispatch]);


  const handleTimeEdit = useCallback(async (updatedEvent) => {
    // Optimistically update the UI first
    const updatedEvents = localEvents.map(event =>
      event.id === updatedEvent.id ? updatedEvent : event
    );
    setLocalEvents(updatedEvents);

    try {
      // Use semantic command for updating event time
      await dispatch(updateEvent({
        eventId: parseInt(updatedEvent.id),
        updates: {
          start: updatedEvent.start,
          end: updatedEvent.end,
          title: updatedEvent.title
        },
        projectId: project?.id
      }));
    } catch (error) {
      console.error('Error updating event time:', error);
      
      // Revert the optimistic update on error
      setLocalEvents(localEvents);
      
      // Error notification is handled by the semantic command
    }
  }, [localEvents, project?.id, dispatch]);

  // Day section component
  const DaySection = ({ day, isExpanded, onToggle, isCompact = false }) => {
    const dayEvents = day.events.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    // Count conflicts for this day
    const dayConflicts = dayEvents.filter(event => conflictingEvents.includes(event.id)).length;

    // Generate time slots based on project settings or fallback
    const timeSlots = useMemo(() => {
      if (dayEvents.length === 0) return [];

      const slots = [];
      let startHour = 6; // Fallback default
      let endHour = 22; // Fallback default
      
      if (useProjectTimeRange) {
        // Use project settings if available
        const projectSettings = project?.project_settings;
        if (projectSettings?.startOfDayTime) {
          startHour = parseInt(projectSettings.startOfDayTime.split(':')[0]);
        }
        if (projectSettings?.endOfDayTime) {
          endHour = parseInt(projectSettings.endOfDayTime.split(':')[0]);
        }
      }

      // Create a map of hours that are occupied by events
      const occupiedHours = new Set();
      dayEvents.forEach(event => {
        const eventStartHour = new Date(event.start).getHours();
        const eventEndHour = new Date(event.end).getHours();
        const eventEndMinutes = new Date(event.end).getMinutes();
        
        // Mark all hours from start to end as occupied
        for (let h = eventStartHour; h < eventEndHour || (h === eventEndHour && eventEndMinutes > 0); h++) {
          if (h !== eventStartHour) { // Don't mark the start hour as occupied (we want to show the event there)
            occupiedHours.add(h);
          }
        }
      });

      for (let hour = startHour; hour <= endHour; hour++) {
        // Skip hours that are occupied by an event (except the event start time)
        if (occupiedHours.has(hour)) {
          continue;
        }

        const time = `${hour > 12 ? hour - 12 : hour === 12 ? 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
        const event = dayEvents.find(e => {
          const eventHour = new Date(e.start).getHours();
          return eventHour === hour;
        });

        slots.push({ time, event, hour });
      }

      return slots;
    }, [dayEvents, project?.project_settings, useProjectTimeRange]);

    return (
      <Box
        id={`day-section-${day.dayNumber}`}
        sx={{
          mb: 2,
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        {/* Day Header */}
        <Box
          onClick={() => onToggle(day.dayNumber)}
          sx={{
            p: 2,
            cursor: 'pointer',
            backgroundColor: day.isToday ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.05)
            },
            transition: 'background-color 0.2s ease'
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: day.isToday
                    ? theme.palette.primary.main
                    : day.isPast
                      ? theme.palette.grey[700]
                      : theme.palette.grey[800],
                  color: day.isToday
                    ? theme.palette.primary.contrastText
                    : theme.palette.primary.main
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {day.dayNumber}
                </Typography>
              </Box>

              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h6" fontWeight={600}>
                    Day {day.dayNumber}
                  </Typography>
                  {day.isToday && (
                    <Chip label="Today" size="small" color="primary" />
                  )}
                  {day.isPast && (
                    <CheckCircle sx={{ fontSize: 20, color: 'success.main' }} />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {day.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                label={`${dayEvents.length} events`}
                size="small"
                variant="outlined"
              />
              {dayConflicts > 0 && (
                <Chip
                  label={`${dayConflicts} conflicts`}
                  size="small"
                  color="error"
                  variant="filled"
                  sx={{
                    animation: 'pulse 2s infinite',
                    fontWeight: 600,
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.05)' },
                      '100%': { transform: 'scale(1)' }
                    }
                  }}
                />
              )}
              <IconButton size="small">
                <ExpandMore
                  sx={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}
                />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* Day Content */}
        <Collapse in={isExpanded}>
          <Divider />
          {isCompact ? (
            /* Compact Mode - Timeline with event cards but no gaps */
            <Box sx={{ p: 3, bgcolor: theme.palette.background.default }}>
              {dayEvents.map((event, index) => {
                const eventTime = new Date(event.start);
                const timeString = `${eventTime.getHours() > 12 ? eventTime.getHours() - 12 : eventTime.getHours() === 0 ? 12 : eventTime.getHours()}:${eventTime.getMinutes().toString().padStart(2, '0')} ${eventTime.getHours() >= 12 ? 'PM' : 'AM'}`;
                
                return (
                  <Box key={event.id} sx={{ position: 'relative', display: 'flex', gap: matchDownSM ? 1 : 2, mb: 0.5 }}>
                    {/* Timeline - Hide on mobile */}
                    {!matchDownSM && (
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: 80,
                        flexShrink: 0
                      }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: 'text.primary',
                            mb: 1
                          }}
                        >
                          {timeString}
                        </Typography>
                        <Box sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: event.eventType === 'course' ? theme.palette.primary.main : theme.palette.info.main,
                          border: `2px solid ${theme.palette.background.paper}`,
                          boxShadow: theme.shadows[2],
                          zIndex: 1
                        }} />
                        {index < dayEvents.length - 1 && (
                          <Box sx={{
                            width: 2,
                            height: 20,
                            bgcolor: theme.palette.divider,
                            mt: 1
                          }} />
                        )}
                      </Box>
                    )}

                    {/* Event Card */}
                    <DraggableEventCard
                      event={event}
                      isSelected={selectedTimeSlot === event.id}
                      isConflicting={conflictingEvents.includes(event.id)}
                      onSelect={(eventId) => {
                        setSelectedTimeSlot(eventId);
                        if (onEventSelect) {
                          onEventSelect(eventId);
                        }
                      }}
                      onTimeEdit={handleTimeEdit}
                      onMoveToNextDay={handleTimeEdit}
                      allEvents={localEvents}
                      project={project}
                      isCompact={true}
                      onEventUpdate={updateLocalEvent}
                      onEditEvent={handleOpenEditDialog}
                    />
                  </Box>
                );
              })}
              
              {/* Add Event Button for Compact View */}
              <Box sx={{ position: 'relative', display: 'flex', gap: 2, mt: 2 }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 80,
                  flexShrink: 0
                }}>
                  <Box sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: theme.palette.grey[400],
                    border: `2px solid ${theme.palette.background.paper}`,
                    zIndex: 1
                  }} />
                </Box>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddCircleOutline />}
                  disabled={isCreatingEvent || addEventDialogOpen}
                  onClick={() => {
                    setSelectedEventTime('');
                    setSelectedEventDate(day.date);
                    setAddEventDialogOpen(true);
                  }}
                  sx={{
                    borderStyle: 'dashed',
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.secondary,
                    backgroundColor: 'transparent',
                    flex: 1,
                    py: 1,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  Add Event
                </Button>
              </Box>
            </Box>
          ) : (
            /* Detailed Mode - Timeline with time slots */
            <Box sx={{ p: 3, bgcolor: theme.palette.background.default }}>
              {timeSlots.map((slot, index) => (
                <DropZoneTimeSlot
                  key={index}
                  time={slot.time}
                  event={slot.event}
                  hour={slot.hour}
                  dayDate={day.date}
                  isLast={index === timeSlots.length - 1}
                  onDrop={handleEventDrop}
                  onSelect={(eventId) => {
                    setSelectedTimeSlot(eventId);
                    if (onEventSelect) {
                      onEventSelect(eventId);
                    }
                  }}
                  onTimeEdit={handleTimeEdit}
                  selectedTimeSlot={selectedTimeSlot}
                  theme={theme}
                  localEvents={localEvents}
                  project={project}
                  setSelectedEventTime={setSelectedEventTime}
                  setSelectedEventDate={setSelectedEventDate}
                  setAddEventDialogOpen={setAddEventDialogOpen}
                  onEventUpdate={updateLocalEvent}
                  onEditEvent={handleOpenEditDialog}
                  conflictingEvents={conflictingEvents}
                  isMobile={matchDownSM}
                />
              ))}

              {/* Add Event Button */}
              <Box sx={{ ml: matchDownSM ? 0 : 12, mt: 2 }}>
                <Button
                  startIcon={<AddCircleOutline />}
                  variant="outlined"
                  size="small"
                  disabled={isCreatingEvent || addEventDialogOpen}
                  onClick={() => {
                    setSelectedEventTime('');
                    setSelectedEventDate(day.date);
                    setAddEventDialogOpen(true);
                  }}
                  sx={{
                    borderStyle: 'dashed',
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main
                    }
                  }}
                >
                  Add Event
                </Button>
              </Box>
            </Box>
          )}
        </Collapse>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <MainCard
        title="Agenda"
        secondary={
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Time Range Toggle - Only show in detailed view, positioned left of view buttons */}
            {!matchDownSM && viewMode === 'detailed' && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={useProjectTimeRange}
                      onChange={(e) => setUseProjectTimeRange(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      {useProjectTimeRange ? 'Project Hours' : 'Extended Hours'}
                    </Typography>
                  }
                  labelPlacement="start"
                  sx={{ mr: 1 }}
                />

                <Divider orientation="vertical" flexItem />
              </>
            )}

            {/* View Toggle */}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Detailed Timeline View">
                <IconButton
                  size="small"
                  onClick={() => setViewMode('detailed')}
                  sx={{
                    bgcolor: viewMode === 'detailed' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    color: viewMode === 'detailed' ? theme.palette.primary.main : theme.palette.text.secondary,
                  }}
                >
                  <ViewModule />
                </IconButton>
              </Tooltip>
              <Tooltip title="Compact List View">
                <IconButton
                  size="small"
                  onClick={() => setViewMode('compact')}
                  sx={{
                    bgcolor: viewMode === 'compact' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    color: viewMode === 'compact' ? theme.palette.primary.main : theme.palette.text.secondary,
                  }}
                >
                  <ViewList />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Controls - Show for both detailed and compact view */}
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                const allExpanded = expandedDays.length === eventsByDay.length;
                setExpandedDays(allExpanded ? [] : eventsByDay.map(d => d.dayNumber));
              }}
            >
              {expandedDays.length === eventsByDay.length ? 'Collapse All' : 'Expand All'}
            </Button>
          </Stack>
        }
        sx={{ 
          height: 'fit-content',
          ...(matchDownSM && {
            '& .MuiCardContent-root': {
              px: 0
            }
          })
        }}
      >


        {/* Content */}
        {localEvents.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No events scheduled
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Start by adding events to your project schedule
            </Typography>

            <Button
              variant="contained"
              size="medium"
              startIcon={<AddCircleOutline />}
              disabled={isCreatingEvent || addEventDialogOpen}
              onClick={() => {
                setSelectedEventTime('9:00 AM');
                setSelectedEventDate(new Date());
                setAddEventDialogOpen(true);
              }}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: '#FFFFFF',
                textTransform: 'none',
                px: 3,
                py: 1,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              Add Event
            </Button>
          </Box>
        ) : viewMode === 'compact' ? (
          /* Compact View - Same cards, no gaps */
          <Box>
            {eventsByDay.map((day) => (
              <DaySection
                key={day.dayNumber}
                day={day}
                isExpanded={expandedDays.includes(day.dayNumber)}
                onToggle={handleDayToggle}
                isCompact={true}
              />
            ))}
          </Box>
        ) : (
          /* Detailed View */
          <Box>
            {eventsByDay.map((day) => (
              <DaySection
                key={day.dayNumber}
                day={day}
                isExpanded={expandedDays.includes(day.dayNumber)}
                onToggle={handleDayToggle}
              />
            ))}
          </Box>
        )}
      </MainCard>

      {/* Add Event Dialog */}
      <AddEventDialog
        open={addEventDialogOpen}
        onClose={() => {
          setAddEventDialogOpen(false);
          setIsCreatingEvent(false);
        }}
        selectedTime={selectedEventTime}
        selectedDate={selectedEventDate}
        project={project}
        onEventCreated={() => {
          // Set creating state to true to disable Add Event buttons
          setIsCreatingEvent(true);
          // The parent component will receive updated events through Redux
          // This will trigger a re-render with the new event
          // Reset creating state after a brief delay to allow RTK Query to update
          setTimeout(() => {
            setIsCreatingEvent(false);
          }, 1000);
        }}
      />

      {/* Edit Event Dialog - Lifted from DraggableEventCard to prevent re-render issues */}
      <EditEventDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEventToEdit(null);
        }}
        event={eventToEdit}
        project={project}
      />
    </Box>
  );
};

// Main component with DnD Provider
const AgendaView = ({ project, events, curriculums, onEventSelect }) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <AgendaViewContent project={project} events={events} curriculums={curriculums} onEventSelect={onEventSelect} />
    </DndProvider>
  );
};

export default AgendaView;