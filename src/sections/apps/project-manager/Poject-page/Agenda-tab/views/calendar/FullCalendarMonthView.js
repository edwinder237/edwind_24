import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
  IconButton,
  Stack,
  Chip
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  Today
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import { EditEventDialog, AddEventDialog } from '../../features/events/dialogs';
import { useDispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
// CQRS imports - RTK Query
import { useGetProjectAgendaQuery } from 'store/api/projectApi';

const FullCalendarMonthView = ({ project, events, onEventSelect }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // CQRS: Fetch agenda data using RTK Query (auto-updates entity stores)
  const {
    data: agendaData,
    isLoading: isLoadingAgenda,
    isFetching: isFetchingAgenda,
    refetch: refetchAgenda
  } = useGetProjectAgendaQuery(
    project?.id,
    {
      skip: !project?.id,
      refetchOnMountOrArgChange: true
    }
  );

  const calendarRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const refetchTimeoutRef = useRef(null);

  // Transform events for FullCalendar
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    backgroundColor: event.color || event.backgroundColor || theme.palette.primary.main,
    borderColor: event.color || event.borderColor || theme.palette.primary.main,
    textColor: '#fff',
    extendedProps: {
      ...event,
      event_groups: event.event_groups,
      instructor: event.instructor,
      location: event.location,
      eventType: event.eventType,
      description: event.description
    }
  }));

  // Safe refetch wrapper - prevents overlapping refetches that crash Prisma
  const safeRefetch = useCallback(async () => {
    // Clear any pending refetch
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
      refetchTimeoutRef.current = null;
    }

    // If already refetching, queue this refetch for later
    if (isRefetching) {
      console.log('[FullCalendarMonthView] Refetch already in progress, queuing...');
      refetchTimeoutRef.current = setTimeout(() => {
        safeRefetch();
      }, 1000);
      return;
    }

    setIsRefetching(true);
    try {
      console.log('[FullCalendarMonthView] Safe refetch starting...');
      await refetchAgenda();
      console.log('[FullCalendarMonthView] Safe refetch completed');
    } catch (error) {
      console.error('[FullCalendarMonthView] Refetch error:', error);
    } finally {
      setIsRefetching(false);
    }
  }, [refetchAgenda, isRefetching]);

  // Get calendar API
  const getCalendarApi = () => calendarRef.current?.getApi();

  // Force calendar to render properly after mount
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      setTimeout(() => {
        calendarApi.updateSize();
      }, 100);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

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

  // Handle date click for adding new events
  const handleDateClick = useCallback((dateClickInfo) => {
    setSelectedDate(dateClickInfo.date);
    setAddEventDialogOpen(true);
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

      // CQRS: Refresh agenda data using RTK Query (safe wrapper prevents DB crashes)
      if (project?.id) {
        await safeRefetch();
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

  // Custom event content
  const renderEventContent = (eventInfo) => {
    const event = eventInfo.event;
    const hasGroups = event.extendedProps.event_groups?.length > 0;
    
    return (
      <Box
        sx={{
          p: 0.5,
          height: '100%',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
      >
        <Typography 
          sx={{ 
            fontSize: '0.75rem',
            fontWeight: 600,
            lineHeight: 1.2,
            mb: 0.25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'inherit'
          }}
        >
          {event.title}
        </Typography>
        
        {/* Show time if not all day */}
        {!event.allDay && (
          <Typography 
            sx={{ 
              fontSize: '0.65rem',
              opacity: 0.9,
              color: 'inherit'
            }}
          >
            {event.start.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </Typography>
        )}
        
        {/* Show groups if available */}
        {hasGroups && (
          <Stack direction="row" spacing={0.25} sx={{ mt: 0.25 }}>
            {event.extendedProps.event_groups.slice(0, 2).map((eg, idx) => 
              eg.groups ? (
                <Box
                  key={idx}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: eg.groups.chipColor || theme.palette.common.white,
                    border: `1px solid ${alpha(theme.palette.common.white, 0.5)}`
                  }}
                />
              ) : null
            )}
            {event.extendedProps.event_groups.length > 2 && (
              <Typography sx={{ fontSize: '0.6rem', opacity: 0.8, color: 'inherit' }}>
                +{event.extendedProps.event_groups.length - 2}
              </Typography>
            )}
          </Stack>
        )}
      </Box>
    );
  };

  // Custom toolbar component
  const CustomToolbar = () => {
    const calendarApi = getCalendarApi();
    const currentMonth = calendarApi ? calendarApi.getDate() : new Date();
    const isToday = currentMonth.toDateString() === new Date().toDateString();

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
          <IconButton 
            onClick={() => handleNavigate('TODAY')}
            size="small"
            sx={{
              bgcolor: isToday ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
              color: isToday ? theme.palette.primary.main : 'inherit'
            }}
          >
            <Today />
          </IconButton>
        </Stack>

        <Typography variant="h5" fontWeight={600}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>

        <Stack direction="row" spacing={1}>
          <Chip 
            label={`${events.length} events`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Stack>
      </Stack>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
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
            '& .fc-daygrid-day': {
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.08)
              }
            },
            '& .fc-daygrid-day-number': {
              padding: theme.spacing(1),
              fontWeight: 500,
              color: theme.palette.text.primary
            },
            '& .fc-day-today': {
              backgroundColor: `${alpha(theme.palette.primary.main, 0.08)} !important`
            },
            '& .fc-day-today .fc-daygrid-day-number': {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            },
            '& .fc-day-other .fc-daygrid-day-number': {
              color: theme.palette.text.disabled
            },
            '& .fc-event': {
              borderRadius: theme.shape.borderRadius / 2,
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 500,
              padding: '2px 4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: theme.shadows[2]
              }
            },
            '& .fc-daygrid-event': {
              marginBottom: '2px'
            },
            '& .fc-daygrid-more-link': {
              color: theme.palette.primary.main,
              fontWeight: 500,
              fontSize: '0.75rem',
              marginTop: theme.spacing(0.5),
              '&:hover': {
                textDecoration: 'underline'
              }
            },
            '& .fc-popover': {
              borderRadius: theme.shape.borderRadius,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[8]
            },
            '& .fc-popover-header': {
              backgroundColor: theme.palette.background.paper,
              borderBottom: `1px solid ${theme.palette.divider}`,
              padding: theme.spacing(1)
            },
            '& .fc-toolbar': {
              display: 'none' // We're using our custom toolbar
            }
          }}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin, momentTimezonePlugin]}
            initialView="dayGridMonth"
            events={calendarEvents}
            timeZone="local"
            height="auto"
            headerToolbar={false}
            dayHeaderContent={(arg) => {
              const weekday = arg.date.toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  py: 1
                }}>
                  <Typography 
                    sx={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 600,
                      color: '#666',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {weekday}
                  </Typography>
                </Box>
              );
            }}
            editable={true}
            droppable={true}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            eventDrop={handleEventDrop}
            eventContent={renderEventContent}
            dayMaxEvents={3}
            moreLinkContent={(args) => `+${args.num} more`}
            eventDisplay="block"
            displayEventTime={false}
            eventMouseEnter={(info) => {
              info.el.style.zIndex = 1000;
            }}
            eventMouseLeave={(info) => {
              info.el.style.zIndex = 1;
            }}
            fixedWeekCount={false}
            showNonCurrentDates={true}
          />
        </Box>
      </Box>

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
          setSelectedDate(null);
        }}
        selectedTime=""
        selectedDate={selectedDate}
        project={project}
        onEventCreated={() => {
          // Events will be refreshed via Redux
        }}
      />
    </Box>
  );
};

export default FullCalendarMonthView;