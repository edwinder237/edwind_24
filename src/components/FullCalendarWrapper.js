import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Box, useTheme, CircularProgress } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

const FullCalendarWrapper = React.memo(({
  events = [],
  onEventClick = () => {},
  onDateSelect = () => {},
  height = 720,
  view = 'dayGridMonth',
  date = new Date(),
  selectedEventId = null,
  onEventDrop = () => {},
  onEventResize = () => {},
  onClearSelection = () => {},
}) => {
  const theme = useTheme();
  const calendarRef = useRef(null);
  const [calendarApi, setCalendarApi] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize calendar API
  useEffect(() => {
    if (calendarRef.current) {
      setCalendarApi(calendarRef.current.getApi());
    }
  }, []);

  // Update calendar view when view prop changes
  useEffect(() => {
    if (calendarApi && view) {
      calendarApi.changeView(view);
    }
  }, [calendarApi, view]);

  // Update calendar date when date prop changes
  useEffect(() => {
    if (calendarApi && date) {
      calendarApi.gotoDate(date);
    }
  }, [calendarApi, date]);


  // Utility function to get group names from event
  const getEventDisplayTitle = useCallback((event) => {
    const baseTitle = event.title || 'Untitled Event';
    const groups = event.event_groups || [];
    
    if (groups.length === 0) {
      return baseTitle;
    }
    
    const groupNames = groups.map(eventGroup => eventGroup.groups?.groupName).filter(Boolean);
    
    if (groupNames.length === 0) {
      return baseTitle;
    }
    
    return `${baseTitle} (${groupNames.join(', ')})`;
  }, []);

  // Transform events to FullCalendar format with memoization
  const transformedEvents = useMemo(() => events.map(event => {
    // Create a unique version string based on properties that might change
    const version = `${event.color || ''}-${event.backgroundColor || ''}-${event.textColor || ''}-${event.title || ''}-${event.eventType || ''}`;
    
    return {
      id: `${event.id}-${version}`, // Make ID unique to force re-render when colors change
      _originalId: event.id, // Keep original ID for reference
      title: getEventDisplayTitle(event),
      start: event.start,
      end: event.end,
      backgroundColor: event.backgroundColor || event.color || theme.palette.primary.main,
      borderColor: event.borderColor || event.backgroundColor || event.color || theme.palette.primary.main,
      textColor: event.textColor || theme.palette.primary.contrastText,
      extendedProps: {
        ...event.extendedProps,
        originalEvent: event,
      },
      // No custom classNames - let FullCalendar handle everything naturally
    };
  }), [events, theme.palette.primary.main, theme.palette.primary.contrastText, getEventDisplayTitle]);

  // Handle event click with better UX
  const handleEventClick = useCallback((clickInfo) => {
    if (!clickInfo?.event?.extendedProps?.originalEvent) {
      return;
    }

    // Add click feedback only for non-list views
    const el = clickInfo.el;
    if (el && !clickInfo.view.type.includes('list')) {
      el.style.transform = 'scale(0.95)';
      setTimeout(() => {
        el.style.transform = 'scale(1)';
      }, 150);
    }
    
    const originalEvent = clickInfo.event.extendedProps.originalEvent;
    onEventClick({ event: originalEvent });
  }, [onEventClick]);

  // Handle date select (both single clicks and range selections)
  const handleDateSelect = useCallback((selectInfo) => {
    
    const startTime = selectInfo.start.getTime();
    const endTime = selectInfo.end.getTime();
    const duration = endTime - startTime;
    
    // For time grid views (day/week), FullCalendar often creates 30-minute or 1-hour selections
    // We want to ensure a minimum 1-hour duration for new events
    if (duration <= 60 * 60 * 1000) { // 1 hour or less
      const newEnd = new Date(startTime + 60 * 60 * 1000); // Always 1 hour
      onDateSelect({
        start: selectInfo.start,
        end: newEnd,
      });
    } else {
      // It's a longer range selection
      onDateSelect({
        start: selectInfo.start,
        end: selectInfo.end,
      });
    }
    
    // Clear selection after a short delay to clean up the UI
    setTimeout(() => {
      if (calendarApi) {
        calendarApi.unselect();
      }
    }, 200);
  }, [onDateSelect, calendarApi]);

  // Handle single date click as backup
  const handleDateClick = useCallback((dateClickInfo) => {
    
    // Only trigger if select didn't handle it
    // This serves as a backup for views where select might not work
    const start = dateClickInfo.date;
    const end = new Date(start.getTime() + 60 * 60 * 1000); // Add 1 hour
    
    onDateSelect({
      start: start,
      end: end,
    });
  }, [onDateSelect]);

  // Handle event drop (drag and drop) with loading state
  const handleEventDrop = useCallback(async (dropInfo) => {
    if (!dropInfo?.event?.extendedProps?.originalEvent) {
      return;
    }

    setIsDragging(true);
    const originalEvent = dropInfo.event.extendedProps.originalEvent;
    
    // Show loading state
    dropInfo.event.setProp('backgroundColor', theme.palette.action.disabled);
    
    // Create updated event with all necessary properties for database sync
    const updatedEvent = {
      ...originalEvent,
      id: dropInfo.event._originalId || originalEvent.id,
      start: dropInfo.event.start,
      end: dropInfo.event.end,
      allDay: dropInfo.event.allDay,
      // Ensure all required fields are present for database update
      title: originalEvent.title || dropInfo.event.title,
      description: originalEvent.description || dropInfo.event.extendedProps?.description,
      eventType: originalEvent.eventType || 'other',
      color: originalEvent.color,
      textColor: originalEvent.textColor,
      backgroundColor: originalEvent.backgroundColor,
      borderColor: originalEvent.borderColor,
      editable: originalEvent.editable,
      eventStatus: originalEvent.eventStatus,
      extendedProps: originalEvent.extendedProps,
      courseId: originalEvent.courseId,
    };
    
    try {
      await onEventDrop({ event: updatedEvent });
      
      // Reset loading state
      setTimeout(() => {
        setIsDragging(false);
        dropInfo.event.setProp('backgroundColor', originalEvent?.backgroundColor || theme.palette.primary.main);
      }, 500);
    } catch (error) {
      
      // Revert the event position on error
      dropInfo.revert();
      
      // Reset loading state
      setTimeout(() => {
        setIsDragging(false);
        dropInfo.event.setProp('backgroundColor', originalEvent?.backgroundColor || theme.palette.primary.main);
      }, 500);
    }
  }, [onEventDrop, theme.palette.action.disabled, theme.palette.primary.main]);

  // Handle event resize with loading state
  const handleEventResize = useCallback(async (resizeInfo) => {
    if (!resizeInfo?.event?.extendedProps?.originalEvent) {
      return;
    }

    setIsDragging(true);
    const originalEvent = resizeInfo.event.extendedProps.originalEvent;
    
    // Show loading state
    resizeInfo.event.setProp('backgroundColor', theme.palette.action.disabled);
    
    // Create updated event with all necessary properties for database sync
    const updatedEvent = {
      ...originalEvent,
      id: resizeInfo.event._originalId || originalEvent.id,
      start: resizeInfo.event.start,
      end: resizeInfo.event.end,
      allDay: resizeInfo.event.allDay,
      // Ensure all required fields are present for database update
      title: originalEvent.title || resizeInfo.event.title,
      description: originalEvent.description || resizeInfo.event.extendedProps?.description,
      eventType: originalEvent.eventType || 'other',
      color: originalEvent.color,
      textColor: originalEvent.textColor,
      backgroundColor: originalEvent.backgroundColor,
      borderColor: originalEvent.borderColor,
      editable: originalEvent.editable,
      eventStatus: originalEvent.eventStatus,
      extendedProps: originalEvent.extendedProps,
      courseId: originalEvent.courseId,
    };
    
    try {
      await onEventResize({ event: updatedEvent });
      
      // Reset loading state
      setTimeout(() => {
        setIsDragging(false);
        resizeInfo.event.setProp('backgroundColor', originalEvent?.backgroundColor || theme.palette.primary.main);
      }, 500);
    } catch (error) {
      
      // Revert the event size on error
      resizeInfo.revert();
      
      // Reset loading state
      setTimeout(() => {
        setIsDragging(false);
        resizeInfo.event.setProp('backgroundColor', originalEvent?.backgroundColor || theme.palette.primary.main);
      }, 500);
    }
  }, [onEventResize, theme.palette.action.disabled, theme.palette.primary.main]);

  // Enhanced calendar styling with smooth animations
  const calendarStyle = useMemo(() => ({
    height: height,
    position: 'relative',
    '& .fc': {
      fontFamily: theme.typography.fontFamily,
      height: '100%',
    },
    '& .fc-theme-standard .fc-scrollgrid': {
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: '8px',
      overflow: 'hidden',
    },
    '& .fc-theme-standard td, & .fc-theme-standard th': {
      borderColor: theme.palette.divider,
    },
    '& .fc-col-header-cell': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.secondary,
      fontWeight: 600,
      padding: '12px 8px',
      transition: 'background-color 0.2s ease',
    },
    '& .fc-daygrid-day': {
      backgroundColor: theme.palette.background.paper,
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
    '& .fc-daygrid-day.fc-day-today': {
      backgroundColor: theme.palette.primary.light + '20',
      border: `1px solid ${theme.palette.primary.light}`,
    },
    '& .fc-daygrid-day-number': {
      color: theme.palette.text.primary,
      fontWeight: 500,
      padding: '4px',
      transition: 'all 0.2s ease',
    },
    '& .fc-day-today .fc-daygrid-day-number': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderRadius: '50%',
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.875rem',
      fontWeight: 600,
      boxShadow: theme.shadows[2],
    },
    '& .fc-event': {
      cursor: 'pointer',
      fontSize: '0.75rem',
      borderRadius: '6px',
      border: 'none',
      padding: '3px 6px',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: theme.shadows[1],
    },
    // Grid and time view events
    '& .fc-daygrid-event, & .fc-timegrid-event': {
      '&:hover': {
        opacity: 0.9,
        transform: 'translateY(-1px) scale(1.02)',
        boxShadow: theme.shadows[3],
      },
      '&:active': {
        transform: 'translateY(0px) scale(0.98)',
      },
      '&.fc-event-selected': {
        boxShadow: `0 0 0 2px ${theme.palette.secondary.main}, ${theme.shadows[4]}`,
        transform: 'translateY(-1px) scale(1.02)',
        zIndex: 10,
      },
    },
    // List view dot color should match event color
    '& .fc-list-event-dot': {
      borderColor: 'currentColor',
    },
    '& .fc-button-primary': {
      backgroundColor: theme.palette.primary.main,
      borderColor: theme.palette.primary.main,
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        borderColor: theme.palette.primary.dark,
        transform: 'translateY(-1px)',
      },
      '&:disabled': {
        backgroundColor: theme.palette.action.disabledBackground,
        borderColor: theme.palette.action.disabledBackground,
      },
    },
    '& .fc-toolbar': {
      marginBottom: '1rem',
    },
    '& .fc-toolbar-title': {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: theme.palette.text.primary,
    },
    '& .fc-today-button, & .fc-button': {
      textTransform: 'none',
      fontWeight: 500,
      borderRadius: '6px',
    },
    '& .fc-more-link': {
      color: theme.palette.primary.main,
      fontWeight: 500,
      '&:hover': {
        color: theme.palette.primary.dark,
      },
    },
    '& .fc-daygrid-more-link': {
      backgroundColor: theme.palette.background.paper,
      borderRadius: '4px',
      padding: '2px 4px',
      fontSize: '0.7rem',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
    // Loading state styles
    ...(isDragging && {
      '& .fc-event': {
        pointerEvents: 'none',
        opacity: 0.7,
      },
    }),
  }), [height, theme, isDragging]);


  return (
    <Box sx={calendarStyle}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={view}
            initialDate={date}
            events={transformedEvents}
            height={height}
            headerToolbar={false} // We'll use custom toolbar
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            eventClick={handleEventClick}
            select={handleDateSelect}
            dateClick={handleDateClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventDisplay="block"
            dayMaxEventRows={3}
            moreLinkClick="popover"
            nowIndicator={true}
            // Enhanced options for better UX
            aspectRatio={1.35}
            contentHeight={height - 60}
            eventTextColor={theme.palette.text.primary}
            themeSystem="standard"
            // Performance optimizations
            lazyFetching={true}
            // Better interaction - more permissive for flexibility
            selectAllow={(selectInfo) => {
              // Allow all selections for flexibility
              return true;
            }}
            eventAllow={(dropInfo, draggedEvent) => {
              // Allow all drops for flexibility
              return true;
            }}
            // Event rendering with animations
            eventDidMount={(info) => {
              // Only add entrance animation for non-list views
              if (!info.view.type.includes('list')) {
                // Add entrance animation
                info.el.style.opacity = '0';
                info.el.style.transform = 'translateY(10px)';
                setTimeout(() => {
                  info.el.style.transition = 'all 0.3s ease';
                  info.el.style.opacity = '1';
                  info.el.style.transform = 'translateY(0)';
                }, 50);
              } else {
                // For list view, set dot color to match event color
                const dot = info.el.querySelector('.fc-list-event-dot');
                if (dot) {
                  const eventColor = info.event.backgroundColor || 
                                   info.event.extendedProps.originalEvent?.backgroundColor || 
                                   info.event.extendedProps.originalEvent?.color || 
                                   theme.palette.primary.main;
                  dot.style.borderColor = eventColor;
                }
              }
            }}
            // Date cell rendering
            dayCellDidMount={(info) => {
              // Add custom styling for today
              if (info.date.toDateString() === new Date().toDateString()) {
                info.el.classList.add('fc-day-today');
              }
            }}
            // Enhanced event content rendering
            eventContent={(eventInfo) => {
              const { event } = eventInfo;
              const originalEvent = event.extendedProps.originalEvent;
              
              // For list view, show more details
              if (eventInfo.view.type.includes('list')) {
                return {
                  html: `
                    <div style="padding: 6px; line-height: 1.3;">
                      <strong style="color: ${theme.palette.text.primary};">${event.title}</strong>
                      ${originalEvent.extendedProps?.description ? `<br/><small style="color: ${theme.palette.text.secondary};">${originalEvent.extendedProps.description}</small>` : ''}
                      ${originalEvent.start ? `<br/><small style="color: ${theme.palette.text.secondary};">${new Date(originalEvent.start).toLocaleTimeString()}</small>` : ''}
                    </div>
                  `
                };
              }
              
              // For grid/time views, show compact title with better formatting
              return {
                html: `
                  <div style="
                    padding: 2px 4px; 
                    font-size: 0.75rem; 
                    line-height: 1.2; 
                    overflow: hidden; 
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: ${event.textColor || theme.palette.primary.contrastText};
                  ">
                    ${event.title}
                  </div>
                `
              };
            }}
          />
    </Box>
  );
});

export default FullCalendarWrapper;