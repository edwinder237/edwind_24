import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
  IconButton,
  Stack,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  Tooltip
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  Today,
  Add
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EditEventDialog from './EditEventDialog';
import AddEventDialog from './AddEventDialog';
import { useDispatch, useSelector } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { getEvents } from 'store/reducers/calendar';
import { getSingleProject, getGroupsDetails } from 'store/reducers/projects';

const FullCalendarWeekView = ({ project, events, onEventSelect }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { groups } = useSelector((state) => state.projects);
  const calendarRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [calendarReady, setCalendarReady] = useState(false);
  const [conflictingEvents, setConflictingEvents] = useState([]);

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
        
        // Check if events overlap (accounting for all-day events)
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
    const conflicts = detectConflicts(events);
    setConflictingEvents(conflicts.map(e => e.id));
  }, [events, detectConflicts]);

  // Transform events for FullCalendar
  const calendarEvents = events.map(event => {
    const isConflicting = conflictingEvents.includes(event.id);
    
    return {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: isConflicting 
        ? theme.palette.error.main 
        : event.color || event.backgroundColor || theme.palette.primary.main,
      borderColor: isConflicting 
        ? theme.palette.error.dark 
        : event.color || event.borderColor || theme.palette.primary.main,
      textColor: '#fff',
      extendedProps: {
        ...event,
        event_groups: event.event_groups,
        instructor: event.instructor,
        location: event.location,
        eventType: event.eventType,
        description: event.description,
        isConflicting: isConflicting
      }
    };
  });

  // Get calendar API
  const getCalendarApi = () => calendarRef.current?.getApi();

  // Force calendar to render properly after mount
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      setTimeout(() => {
        calendarApi.updateSize();
        setCalendarReady(true);
      }, 100);
    }
  }, []);

  // Load groups when component mounts or project changes
  useEffect(() => {
    if (project?.id) {
      dispatch(getGroupsDetails(project.id));
    }
  }, [project?.id, dispatch]);

  // Handle navigation
  const handleNavigate = useCallback((action) => {
    const calendarApi = getCalendarApi();
    if (!calendarApi) return;

    switch (action) {
      case 'PREV':
        calendarApi.prev();
        setCurrentDate(calendarApi.getDate());
        break;
      case 'NEXT':
        calendarApi.next();
        setCurrentDate(calendarApi.getDate());
        break;
      case 'TODAY':
        calendarApi.today();
        setCurrentDate(new Date());
        break;
      default:
        break;
    }
  }, []);

  // Handle event click
  const handleEventClick = useCallback((clickInfo) => {
    const event = clickInfo.event;
    const eventData = {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      ...event.extendedProps
    };
    
    setSelectedEvent(eventData);
    setEditDialogOpen(true);
    
    if (onEventSelect) {
      onEventSelect(event.id);
    }
  }, [onEventSelect]);

  // Handle slot selection for adding new events
  const handleDateSelect = useCallback((selectInfo) => {
    setSelectedSlot({
      start: selectInfo.start,
      end: selectInfo.end,
      allDay: selectInfo.allDay
    });
    setAddEventDialogOpen(true);
    
    // Clear the selection
    selectInfo.view.calendar.unselect();
  }, []);

  // Handle event drop (drag and drop)
  const handleEventDrop = useCallback(async (dropInfo) => {
    const event = dropInfo.event;
    const updatedEvent = {
      ...event.extendedProps,
      id: event.id,
      start: event.start.toISOString(),
      end: event.end ? event.end.toISOString() : event.start.toISOString()
    };

    try {
      const response = await fetch('/api/calendar/db-update-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          event: updatedEvent
        })
      });

      if (!response.ok) {
        dropInfo.revert();
        throw new Error('Failed to update event');
      }

      // Refresh events
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
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
          autoHideDuration: 2000
        })
      );
    } catch (error) {
      console.error('Error updating event:', error);
      dropInfo.revert();
      
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to update event',
          variant: 'alert',
          alert: { color: 'error' },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
        })
      );
    }
  }, [project?.id, dispatch]);

  // Handle event resize
  const handleEventResize = useCallback(async (resizeInfo) => {
    const event = resizeInfo.event;
    const updatedEvent = {
      ...event.extendedProps,
      id: event.id,
      start: event.start.toISOString(),
      end: event.end ? event.end.toISOString() : event.start.toISOString()
    };

    try {
      const response = await fetch('/api/calendar/db-update-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          event: updatedEvent
        })
      });

      if (!response.ok) {
        resizeInfo.revert();
        throw new Error('Failed to update event');
      }

      // Refresh events
      if (project?.id) {
        await dispatch(getEvents(project.id));
        await dispatch(getSingleProject(project.id));
      }

      dispatch(
        openSnackbar({
          open: true,
          message: 'Event duration updated',
          variant: 'alert',
          alert: { color: 'success' },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
          autoHideDuration: 2000
        })
      );
    } catch (error) {
      console.error('Error resizing event:', error);
      resizeInfo.revert();
      
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to update event duration',
          variant: 'alert',
          alert: { color: 'error' },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
        })
      );
    }
  }, [project?.id, dispatch]);

  // Handle delete event directly from calendar
  const handleEventDelete = useCallback(async (eventId, e) => {
    e?.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    try {
      // Show loading state immediately
      dispatch(
        openSnackbar({
          open: true,
          message: 'Deleting event...',
          variant: 'alert',
          alert: { color: 'info' },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
        })
      );

      const response = await fetch('/api/calendar/db-delete-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Refresh both calendar events and project data to ensure UI updates
      if (project?.id) {
        await dispatch(getEvents(project.id));
        await dispatch(getSingleProject(project.id));
      }

      dispatch(
        openSnackbar({
          open: true,
          message: 'Event deleted successfully',
          variant: 'alert',
          alert: { color: 'success' },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
          autoHideDuration: 2000
        })
      );
    } catch (error) {
      console.error('Error deleting event:', error);
      
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete event',
          variant: 'alert',
          alert: { color: 'error' },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
        })
      );
    }
  }, [project?.id, dispatch]);

  // Handle quick group assignment
  const handleQuickGroupAssign = useCallback(async (eventId, groupId, e) => {
    e?.stopPropagation();
    
    try {
      const response = await fetch('/api/projects/addEventGroup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, groupId })
      });

      if (!response.ok) {
        throw new Error('Failed to assign group to event');
      }

      // Refresh events to show the update
      if (project?.id) {
        await dispatch(getEvents(project.id));
      }

      dispatch(
        openSnackbar({
          open: true,
          message: 'Group assigned to event successfully',
          variant: 'alert',
          alert: { color: 'success' },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
          autoHideDuration: 2000
        })
      );
    } catch (error) {
      console.error('Error assigning group to event:', error);
      
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to assign group to event',
          variant: 'alert',
          alert: { color: 'error' },
          close: false,
          anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
        })
      );
    }
  }, [project?.id, dispatch]);

  // Custom event content
  const renderEventContent = (eventInfo) => {
    const event = eventInfo.event;
    const hasGroups = event.extendedProps.event_groups?.length > 0;
    const isConflicting = event.extendedProps.isConflicting;
    
    return (
      <Box
        sx={{
          p: '6px 8px',
          height: '100%',
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          position: 'relative',
          ...(isConflicting && {
            border: `2px solid ${theme.palette.error.dark}`,
            boxShadow: `0 0 8px ${alpha(theme.palette.error.main, 0.3)}`,
            animation: 'pulse 2s infinite'
          })
        }}
      >
        {/* Delete button */}
        <Box
          onClick={(e) => handleEventDelete(event.id, e)}
          sx={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            '.fc-event:hover &': {
              opacity: 1
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              transform: 'scale(1.1)'
            },
            zIndex: 10
          }}
        >
          <Typography sx={{ 
            fontSize: '10px', 
            lineHeight: 1, 
            color: 'red',
            fontWeight: 'bold'
          }}>
            ×
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pr: 2 }}>
          {isConflicting && (
            <Tooltip title="Scheduling Conflict!" arrow>
              <Box sx={{ 
                fontSize: '0.7rem',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                animation: 'blink 1.5s infinite'
              }}>
                ⚠️
              </Box>
            </Tooltip>
          )}
          <Typography 
            sx={{ 
              fontSize: '0.8rem',
              fontWeight: 600,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'inherit',
              letterSpacing: '0.01em',
              flex: 1
            }}
          >
            {event.title}
          </Typography>
        </Box>
        
        {/* Show time */}
        <Typography 
          sx={{ 
            fontSize: '0.7rem',
            opacity: 0.95,
            color: 'inherit',
            fontWeight: 500
          }}
        >
          {eventInfo.timeText}
        </Typography>
        
        {/* Show location if available */}
        {event.extendedProps.location && (
          <Typography 
            sx={{ 
              fontSize: '0.7rem',
              opacity: 0.85,
              color: 'inherit',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '0.65rem' }}>📍</span>
            {event.extendedProps.location}
          </Typography>
        )}
        
        {/* Show groups if available or quick assign dropdown if none */}
        {hasGroups ? (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 'auto', pt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
            {event.extendedProps.event_groups.slice(0, 2).map((eg, idx) => 
              eg.groups ? (
                <Stack key={idx} direction="row" alignItems="center" spacing={0.3}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: eg.groups.chipColor || theme.palette.common.white,
                      border: `1px solid ${alpha(theme.palette.common.white, 0.6)}`,
                      boxShadow: `0 0 1px ${alpha(theme.palette.common.black, 0.2)}`
                    }}
                  />
                  <Typography sx={{ 
                    fontSize: '0.6rem', 
                    opacity: 0.95, 
                    color: 'inherit', 
                    fontWeight: 500,
                    maxWidth: '60px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {eg.groups.groupName}
                  </Typography>
                </Stack>
              ) : null
            )}
            {event.extendedProps.event_groups.length > 2 && (
              <Typography sx={{ fontSize: '0.6rem', opacity: 0.9, color: 'inherit', fontWeight: 600 }}>
                +{event.extendedProps.event_groups.length - 2}
              </Typography>
            )}
          </Stack>
        ) : (
          // Quick group assignment dropdown when no groups are assigned
          groups && groups.length > 0 && (
            <Box sx={{ mt: 'auto', pt: 0.5 }}>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  displayEmpty
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleQuickGroupAssign(event.id, e.target.value, e);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    fontSize: '0.65rem',
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '12px',
                    '& .MuiSelect-select': {
                      py: 0.5,
                      px: 1,
                      fontSize: '0.65rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid rgba(255, 255, 255, 0.5)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid rgba(255, 255, 255, 0.8)'
                    }
                  }}
                  renderValue={() => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Add sx={{ fontSize: 12 }} />
                      <span>Add Group</span>
                    </Box>
                  )}
                >
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: group.chipColor || theme.palette.primary.main
                          }}
                        />
                        <Typography sx={{ fontSize: '0.75rem' }}>
                          {group.groupName}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )
        )}
      </Box>
    );
  };

  // Custom toolbar component
  const CustomToolbar = () => {
    const calendarApi = getCalendarApi();
    const currentWeek = calendarApi ? calendarApi.getDate() : new Date();
    
    // Get week range and week number
    const getWeekInfo = () => {
      if (!calendarApi || !calendarApi.view) return { range: 'Loading...', weekNum: '' };
      
      const view = calendarApi.view;
      const start = view.currentStart;
      const end = view.currentEnd;
      
      // Calculate week number
      const startOfYear = new Date(start.getFullYear(), 0, 1);
      const weekNum = Math.ceil((((start - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
      
      // Adjust end date (FullCalendar includes next day at 00:00)
      const adjustedEnd = new Date(end);
      adjustedEnd.setDate(adjustedEnd.getDate() - 1);
      
      let range = '';
      if (start.getMonth() === adjustedEnd.getMonth()) {
        range = `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${adjustedEnd.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
      } else if (start.getYear() === adjustedEnd.getYear()) {
        range = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${adjustedEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else {
        range = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${adjustedEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      
      return { range, weekNum };
    };

    const isCurrentWeek = () => {
      if (!calendarApi) return false;
      const view = calendarApi.view;
      const now = new Date();
      return now >= view.currentStart && now < view.currentEnd;
    };

    return (
      <Stack 
        direction="row" 
        justifyContent="space-between" 
        alignItems="center" 
        sx={{ 
          px: 3,
          py: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.15)}`
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => handleNavigate('PREV')} size="small">
            <NavigateBefore />
          </IconButton>
          <IconButton onClick={() => handleNavigate('NEXT')} size="small">
            <NavigateNext />
          </IconButton>
          <Button 
            onClick={() => handleNavigate('TODAY')}
            size="small"
            variant={isCurrentWeek() ? "contained" : "outlined"}
            sx={{
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'none',
              borderRadius: 1,
              ...(isCurrentWeek() ? {} : {
                borderColor: alpha(theme.palette.divider, 0.3),
                color: theme.palette.text.secondary,
                '&:hover': {
                  borderColor: alpha(theme.palette.divider, 0.5),
                  backgroundColor: alpha(theme.palette.action.hover, 0.04)
                }
              })
            }}
          >
            Today
          </Button>
        </Stack>

        <Stack alignItems="center" spacing={0.5}>
          <Typography variant="h5" fontWeight={600}>
            {getWeekInfo().range}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Week {getWeekInfo().weekNum}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Chip 
            label={`${events.length} events`}
            size="small"
            color="primary"
            variant="outlined"
          />
          {conflictingEvents.length > 0 && (
            <Chip 
              label={`${conflictingEvents.length} conflicts`}
              size="small"
              color="error"
              variant="filled"
              icon={<Box component="span" sx={{ fontSize: '0.8rem' }}>⚠️</Box>}
              sx={{
                animation: 'pulse 2s infinite',
                fontWeight: 600
              }}
            />
          )}
        </Stack>
      </Stack>
    );
  };

  // Get business hours from project settings
  const getBusinessHours = () => {
    const projectSettings = project?.project_settings;
    if (!projectSettings?.startOfDayTime || !projectSettings?.endOfDayTime) {
      return {
        startTime: '08:00',
        endTime: '18:00'
      };
    }
    
    return {
      startTime: projectSettings.startOfDayTime,
      endTime: projectSettings.endOfDayTime
    };
  };

  const businessHours = getBusinessHours();

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      p: 2,
      // Add CSS animations
      '@keyframes pulse': {
        '0%': {
          transform: 'scale(1)',
        },
        '50%': {
          transform: 'scale(1.05)',
        },
        '100%': {
          transform: 'scale(1)',
        },
      },
      '@keyframes blink': {
        '0%, 100%': {
          opacity: 1,
        },
        '50%': {
          opacity: 0.3,
        },
      }
    }}>
      <Box
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: 0,
          overflow: 'hidden',
          backgroundColor: alpha(theme.palette.background.paper, 0.02),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 0
        }}
      >
        <CustomToolbar />
        
        <Box 
          sx={{ 
            flex: 1,
            p: 0,
            minHeight: 0,
            position: 'relative',
            '& .fc': {
              height: '100%',
              fontFamily: theme.typography.fontFamily,
              margin: 0
            },
            '& .fc-view-harness': {
              minHeight: '600px'
            },
            '& .fc-theme-standard td, & .fc-theme-standard th': {
              borderColor: alpha(theme.palette.divider, 0.5)
            },
            '& .fc-theme-standard .fc-scrollgrid': {
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: 0
            },
            '& .fc-col-header': {
              backgroundColor: 'transparent',
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
            },
            '& .fc-col-header-cell': {
              backgroundColor: 'transparent',
              padding: theme.spacing(0.5, 0.5),
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              '&:last-child': {
                borderRight: 'none'
              }
            },
            '& .fc-col-header-cell-cushion': {
              textDecoration: 'none',
              padding: 0
            },
            '& .fc-timegrid-slot': {
              height: '48px !important'
            },
            '& .fc-timegrid-slot-minor': {
              borderStyle: 'dotted',
              borderColor: alpha(theme.palette.divider, 0.3)
            },
            '& .fc-timegrid-slot-label': {
              fontSize: '0.75rem',
              color: alpha(theme.palette.text.secondary, 0.8),
              fontWeight: 500,
              letterSpacing: '0.025em'
            },
            '& .fc-day-today': {
              backgroundColor: `${alpha(theme.palette.primary.main, 0.05)} !important`,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: theme.palette.primary.main
              }
            },
            '& .fc-timegrid-axis': {
              fontSize: '0.7rem',
              padding: '0 12px',
              backgroundColor: 'transparent',
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              color: alpha(theme.palette.text.secondary, 0.7),
              fontWeight: 500,
              minWidth: '60px'
            },
            '& .fc-timegrid-axis-frame': {
              backgroundColor: 'transparent'
            },
            '& .fc-timegrid-divider': {
              padding: 0
            },
            '& .fc-event': {
              borderRadius: 0,
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 500,
              padding: '4px 6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              overflow: 'hidden',
              boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.1)}`,
              '&:hover': {
                transform: 'translateX(2px)',
                boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.15)}`,
                zIndex: 1000
              }
            },
            '& .fc-v-event': {
              border: 'none',
              backgroundColor: 'var(--fc-event-bg-color)',
              '& .fc-event-main': {
                color: '#fff'
              }
            },
            '& .fc-timegrid-now-indicator-line': {
              borderColor: theme.palette.error.main,
              borderWidth: 2,
              borderStyle: 'solid',
              opacity: 0.8
            },
            '& .fc-timegrid-now-indicator-arrow': {
              borderColor: theme.palette.error.main,
              borderWidth: '5px'
            },
            '& .fc-toolbar': {
              display: 'none' // We're using our custom toolbar
            },
            // Highlight non-business hours
            '& .fc-non-business': {
              backgroundColor: alpha(theme.palette.action.disabled, 0.02)
            },
            // All-day slot styling
            '& .fc-daygrid-day-frame': {
              minHeight: '30px',
              padding: '2px',
              backgroundColor: 'transparent'
            },
            '& .fc-daygrid-event': {
              borderRadius: 0,
              fontSize: '0.7rem',
              padding: '1px 4px',
              fontWeight: 600
            },
            // Remove white background from all-day row
            '& .fc-daygrid-body': {
              backgroundColor: 'transparent'
            },
            '& .fc-daygrid-day': {
              backgroundColor: 'transparent'
            }
          }}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            events={calendarEvents}
            height="auto"
            headerToolbar={false}
            editable={true}
            droppable={true}
            selectable={true}
            selectMirror={true}
            eventClick={handleEventClick}
            select={handleDateSelect}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventContent={renderEventContent}
            slotMinTime={businessHours.startTime}
            slotMaxTime={businessHours.endTime}
            expandRows={true}
            nowIndicator={true}
            dayHeaderContent={(arg) => {
              const date = arg.date;
              const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
              const day = date.getDate();
              const month = date.toLocaleDateString('en-US', { month: 'short' });
              const isToday = date.toDateString() === new Date().toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              
              return (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  py: 0.75
                }}>
                  <Typography 
                    sx={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 500,
                      color: '#666',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      mb: 0.25,
                      lineHeight: 1
                    }}
                  >
                    {weekday}
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontSize: '0.9rem', 
                      fontWeight: isToday ? 700 : 600,
                      color: isToday ? theme.palette.primary.main : '#333',
                      lineHeight: 1.2
                    }}
                  >
                    {day}
                  </Typography>
                </Box>
              );
            }}
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }}
            allDaySlot={true}
            eventDisplay="block"
            eventMouseEnter={(info) => {
              info.el.style.zIndex = 1000;
            }}
            eventMouseLeave={(info) => {
              info.el.style.zIndex = 1;
            }}
            datesSet={() => {
              // Trigger re-render when dates change
              setCalendarReady(true);
            }}
          />
        </Box>
      </Box>
      
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ 
          fontSize: '0.75rem',
          fontStyle: 'italic',
          textAlign: 'left',
          mt: 2,
          opacity: 0.8
        }}
      >
        Drag to reschedule • Click to edit • Resize to change duration
      </Typography>

      {/* Edit Event Dialog */}
      {selectedEvent && (
        <EditEventDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          project={project}
        />
      )}

      {/* Add Event Dialog */}
      <AddEventDialog
        open={addEventDialogOpen}
        onClose={() => {
          setAddEventDialogOpen(false);
          setSelectedSlot(null);
        }}
        selectedTime={selectedSlot ? 
          selectedSlot.start.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }) : ''
        }
        selectedDate={selectedSlot?.start}
        project={project}
        onEventCreated={() => {
          // Events will be refreshed via Redux
        }}
      />
    </Box>
  );
};

export default FullCalendarWeekView;