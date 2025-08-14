import React, { useState, useMemo, useCallback } from 'react';
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
  FormControlLabel
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
import DraggableEventCard from './DraggableEventCard';
import AddEventDialog from './AddEventDialog';
import { useDispatch } from 'store';
import { getEvents } from 'store/reducers/calendar';
import { getSingleProject } from 'store/reducers/projects';
import { openSnackbar } from 'store/reducers/snackbar';

// Drag types
const ItemTypes = {
  EVENT: 'event'
};



// ==============================|| DROP ZONE TIME SLOT ||============================== //

const DropZoneTimeSlot = ({ time, event, hour, dayDate, isLast, onDrop, onSelect, onTimeEdit, selectedTimeSlot, theme, localEvents, project, setSelectedEventTime, setSelectedEventDate, setAddEventDialogOpen }) => {
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
      sx={{ position: 'relative', display: 'flex', gap: 2 }}
    >
      {/* Timeline */}
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

      {/* Event Card or Drop Zone */}
      {hasEvent ? (
        <DraggableEventCard
          event={event}
          isSelected={isSelected}
          onSelect={onSelect}
          onTimeEdit={onTimeEdit}
          onMoveToNextDay={onTimeEdit}
          allEvents={localEvents}
          project={project}
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

// ==============================|| ITINERARY SCHEDULE ||============================== //

const ItineraryScheduleContent = ({ project, events, onEventSelect }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [expandedDays, setExpandedDays] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [localEvents, setLocalEvents] = useState(events);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' or 'compact'
  const [hasInitialized, setHasInitialized] = useState(false);
  const [useProjectTimeRange, setUseProjectTimeRange] = useState(true);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [selectedEventTime, setSelectedEventTime] = useState('');
  const [selectedEventDate, setSelectedEventDate] = useState(null);

  // Update local events when props change
  React.useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = {};
    const sortedEvents = [...localEvents].sort((a, b) => new Date(a.start) - new Date(b.start));

    sortedEvents.forEach(event => {
      const date = new Date(event.start);
      const dayKey = date.toDateString();
      if (!grouped[dayKey]) {
        grouped[dayKey] = {
          date,
          events: []
        };
      }
      grouped[dayKey].events.push(event);
    });

    // Convert to array and add day numbers
    return Object.values(grouped).map((day, index) => ({
      ...day,
      dayNumber: index + 1,
      isToday: new Date().toDateString() === day.date.toDateString(),
      isPast: day.date < new Date() && !day.isToday
    }));
  }, [localEvents]);

  // Set all days as expanded by default on first load only
  React.useEffect(() => {
    if (eventsByDay.length > 0 && !hasInitialized) {
      setExpandedDays(eventsByDay.map(d => d.dayNumber));
      setHasInitialized(true);
    }
  }, [eventsByDay, hasInitialized]);

  // Get project date range
  const dateRange = useMemo(() => {
    if (localEvents.length === 0) return '';
    const sortedEvents = [...localEvents].sort((a, b) => new Date(a.start) - new Date(b.start));
    const startDate = new Date(sortedEvents[0].start);
    const endDate = new Date(sortedEvents[sortedEvents.length - 1].start);

    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }, [localEvents]);

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
      // Persist to database
      const response = await fetch('/api/calendar/db-update-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: draggedEvent.id,
          event: updatedEvent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      // Refresh calendar events to ensure sync
      if (project?.id) {
        await dispatch(getEvents(project.id));
        await dispatch(getSingleProject(project.id));
      }

      // Show success notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Event moved successfully',
          variant: 'alert',
          alert: {
            color: 'success'
          },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
          autoHideDuration: 2000
        })
      );
    } catch (error) {
      console.error('Error updating event:', error);
      
      // Revert the optimistic update on error
      setLocalEvents(localEvents);
      
      // Show error notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to move event. Please try again.',
          variant: 'alert',
          alert: {
            color: 'error'
          },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
        })
      );
    }
  }, [localEvents, project?.id, dispatch]);


  const handleTimeEdit = useCallback(async (updatedEvent) => {
    // Optimistically update the UI first
    const updatedEvents = localEvents.map(event =>
      event.id === updatedEvent.id ? updatedEvent : event
    );
    setLocalEvents(updatedEvents);

    try {
      // Persist to database
      const response = await fetch('/api/calendar/db-update-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: updatedEvent.id,
          event: updatedEvent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      // Refresh calendar events to ensure sync
      if (project?.id) {
        await dispatch(getEvents(project.id));
        await dispatch(getSingleProject(project.id));
      }

      // Show success notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Event time updated successfully',
          variant: 'alert',
          alert: {
            color: 'success'
          },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
          autoHideDuration: 2000
        })
      );
    } catch (error) {
      console.error('Error updating event time:', error);
      
      // Revert the optimistic update on error
      setLocalEvents(localEvents);
      
      // Show error notification
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to update event time. Please try again.',
          variant: 'alert',
          alert: {
            color: 'error'
          },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
        })
      );
    }
  }, [localEvents, project?.id, dispatch]);

  // Day section component
  const DaySection = ({ day, isExpanded, onToggle, isCompact = false }) => {
    const dayEvents = day.events.sort((a, b) => new Date(a.start) - new Date(b.start));

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

      for (let hour = startHour; hour <= endHour; hour++) {
        const time = `${hour > 12 ? hour - 12 : hour === 12 ? 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
        const event = dayEvents.find(e => {
          const eventHour = new Date(e.start).getHours();
          return eventHour === hour;
        });

        if (event || hour % 1 === 0) { // Show event times or every 1 hour
          slots.push({ time, event, hour });
        }
      }

      return slots;
    }, [dayEvents, project?.project_settings, useProjectTimeRange]);

    return (
      <Box
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
                  <Box key={event.id} sx={{ position: 'relative', display: 'flex', gap: 2, mb: 0.5 }}>
                    {/* Timeline */}
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

                    {/* Event Card */}
                    <DraggableEventCard
                      event={event}
                      isSelected={selectedTimeSlot === event.id}
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
                />
              ))}

              {/* Add Event Button */}
              <Box sx={{ ml: 12, mt: 2 }}>
                <Button
                  startIcon={<AddCircleOutline />}
                  variant="outlined"
                  size="small"
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
    <Box sx={{ maxWidth: 900, mx: 'auto', pl: 2,pr: 2 }}>
      <MainCard
        title="Agenda"
        secondary={
          <Stack direction="row" spacing={1} alignItems="center">
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

            <Divider orientation="vertical" flexItem />

            {/* Time Range Toggle */}
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
              sx={{ mr: 1 }}
            />

            <Divider orientation="vertical" flexItem />

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
        sx={{ height: 'fit-content' }}
      >


        {/* Content */}
        {localEvents.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No events scheduled
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Start by adding events to your project schedule
            </Typography>
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
        onClose={() => setAddEventDialogOpen(false)}
        selectedTime={selectedEventTime}
        selectedDate={selectedEventDate}
        project={project}
        onEventCreated={() => {
          // The parent component will receive updated events through Redux
          // This will trigger a re-render with the new event
        }}
      />
    </Box>
  );
};

// Main component with DnD Provider
const ItinerarySchedule = ({ project, events, onEventSelect }) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <ItineraryScheduleContent project={project} events={events} onEventSelect={onEventSelect} />
    </DndProvider>
  );
};

export default ItinerarySchedule;