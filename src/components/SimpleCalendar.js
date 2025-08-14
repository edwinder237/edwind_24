import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  Stack,
  Chip,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';

const SimpleCalendar = ({
  events = [],
  onEventClick = () => {},
  onDateSelect = () => {},
  height = 720,
  view = 'dayGridMonth',
  date = new Date(),
  selectedEventId = null,
}) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(date);
  
  // Utility function to get group names from event
  const getEventDisplayTitle = (event) => {
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
  };
  
  // Update current date when prop changes
  React.useEffect(() => {
    setCurrentDate(date);
  }, [date]);

  // Get current month calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  // Generate calendar grid
  const calendarDays = [];
  const currentIterDate = new Date(startDate);
  
  for (let week = 0; week < 6; week++) {
    const weekDays = [];
    for (let day = 0; day < 7; day++) {
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === currentIterDate.toDateString();
      });
      
      weekDays.push({
        date: new Date(currentIterDate),
        events: dayEvents,
        isCurrentMonth: currentIterDate.getMonth() === month,
        isToday: currentIterDate.toDateString() === new Date().toDateString(),
      });
      
      currentIterDate.setDate(currentIterDate.getDate() + 1);
    }
    calendarDays.push(weekDays);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event) => {
    // Add visual feedback with a subtle animation
    const eventElement = document.querySelector(`[data-event-id="${event.id}"]`);
    if (eventElement) {
      eventElement.style.transform = 'scale(0.95)';
      setTimeout(() => {
        eventElement.style.transform = 'scale(1)';
      }, 150);
    }
    
    // Call the parent's event handler
    onEventClick({ event });
  };

  const handleDateClick = (date) => {
    onDateSelect({
      start: date,
      end: new Date(date.getTime() + 60 * 60 * 1000), // 1 hour later
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Render different views based on view prop
  const renderMonthView = () => {

    return (
      <Box sx={{ 
        height, 
        border: `1px solid ${theme.palette.divider}`, 
        borderRadius: 1,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary
      }}>
        {/* Calendar Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: `1px solid ${theme.palette.divider}`, 
          bgcolor: theme.palette.action.hover,
          borderRadius: '4px 4px 0 0'
        }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight={600}>
            {monthNames[month]} {year}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TodayIcon />}
              onClick={handleToday}
            >
              Today
            </Button>
            <IconButton onClick={handlePrevMonth} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <IconButton onClick={handleNextMonth} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Day Headers */}
      <Grid container sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        {dayNames.map((dayName) => (
          <Grid item xs={12/7} key={dayName}>
            <Box sx={{ 
              p: 1, 
              textAlign: 'center', 
              bgcolor: theme.palette.background.default,
              borderRight: `1px solid ${theme.palette.divider}`,
              '&:last-child': { borderRight: 'none' }
            }}>
              <Typography variant="body2" fontWeight={600} color={theme.palette.text.secondary}>
                {dayName}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Calendar Grid */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {calendarDays.map((week, weekIndex) => (
          <Grid container key={weekIndex} sx={{ minHeight: 100 }}>
            {week.map((day, dayIndex) => (
              <Grid
                item
                xs={12/7}
                key={dayIndex}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderTop: 'none',
                  borderLeft: dayIndex === 0 ? `1px solid ${theme.palette.divider}` : 'none',
                  minHeight: 100,
                  cursor: 'pointer',
                  bgcolor: theme.palette.background.paper,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
                onClick={() => handleDateClick(day.date)}
              >
                <Box sx={{ p: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: day.isCurrentMonth ? theme.palette.text.primary : theme.palette.text.disabled,
                      fontWeight: day.isToday ? 600 : 400,
                      mb: 1,
                      ...(day.isToday && {
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      })
                    }}
                  >
                    {day.date.getDate()}
                  </Typography>
                  
                  {/* Events for this day */}
                  <Stack spacing={0.5}>
                    {day.events.slice(0, 3).map((event, eventIndex) => {
                      const isSelected = selectedEventId === event.id;
                      return (
                        <Chip
                          key={eventIndex}
                          label={getEventDisplayTitle(event)}
                          size="small"
                          data-event-id={event.id}
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: isSelected 
                              ? theme.palette.secondary.main 
                              : (event.backgroundColor || theme.palette.primary.main),
                            color: isSelected 
                              ? theme.palette.secondary.contrastText 
                              : theme.palette.primary.contrastText,
                            cursor: 'pointer',
                            border: isSelected ? `2px solid ${theme.palette.secondary.dark}` : 'none',
                            boxShadow: isSelected ? theme.shadows[4] : 'none',
                            transform: 'scale(1)',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              opacity: 0.8,
                              transform: 'scale(1.05)',
                            },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                        />
                      );
                    })}
                    {day.events.length > 3 && (
                      <Typography variant="caption" color={theme.palette.text.secondary}>
                        +{day.events.length - 3} more
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        ))}
      </Box>

    </Box>
    );
  };
  
  const renderWeekView = () => {
    // Week view implementation
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === day.toDateString();
      });
      
      weekDays.push({ date: day, events: dayEvents });
    }
    
    return (
      <Box sx={{ 
        height, 
        border: `1px solid ${theme.palette.divider}`, 
        borderRadius: 1,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary
      }}>
        <Grid container sx={{ height: '100%' }}>
          {weekDays.map((day, index) => (
            <Grid key={index} item xs={12/7} sx={{ 
              borderRight: index < 6 ? `1px solid ${theme.palette.divider}` : 'none',
              p: 1
            }}>
              <Typography variant="h6" align="center" gutterBottom>
                {dayNames[index]} {day.date.getDate()}
              </Typography>
              <Stack spacing={1}>
                {day.events.map((event, eventIndex) => {
                  const isSelected = selectedEventId === event.id;
                  return (
                    <Chip
                      key={eventIndex}
                      label={getEventDisplayTitle(event)}
                      size="small"
                      data-event-id={event.id}
                      sx={{
                        backgroundColor: isSelected 
                          ? theme.palette.secondary.main 
                          : (event.backgroundColor || theme.palette.primary.main),
                        color: isSelected 
                          ? theme.palette.secondary.contrastText 
                          : theme.palette.primary.contrastText,
                        cursor: 'pointer',
                        border: isSelected ? `2px solid ${theme.palette.secondary.dark}` : 'none',
                        boxShadow: isSelected ? theme.shadows[4] : 'none',
                        transform: 'scale(1)',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          opacity: 0.8,
                          transform: 'scale(1.05)',
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                    />
                  );
                })}
              </Stack>
            </Grid>
          ))}
        </Grid>
        
      </Box>
    );
  };
  
  const renderDayView = () => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === currentDate.toDateString();
    });
    
    return (
      <Box sx={{ 
        height, 
        border: `1px solid ${theme.palette.divider}`, 
        borderRadius: 1,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        p: 3
      }}>
        <Typography variant="h4" gutterBottom>
          {currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>
        
        <Stack spacing={2}>
          {dayEvents.length > 0 ? (
            dayEvents.map((event, index) => {
              const isSelected = selectedEventId === event.id;
              return (
                <Card key={index} sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  bgcolor: isSelected 
                    ? theme.palette.secondary.light 
                    : theme.palette.action.hover,
                  border: isSelected ? `2px solid ${theme.palette.secondary.main}` : `1px solid ${theme.palette.divider}`,
                  boxShadow: isSelected ? theme.shadows[4] : theme.shadows[1],
                  transform: 'scale(1)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: isSelected 
                      ? theme.palette.secondary.light 
                      : theme.palette.action.selected,
                    transform: 'scale(1.02)',
                  }
                }}
                data-event-id={event.id}
                onClick={() => handleEventClick(event)}
                >
                  <Typography variant="h6" sx={{ 
                    color: isSelected ? theme.palette.secondary.contrastText : 'inherit' 
                  }}>
                    {getEventDisplayTitle(event)}
                  </Typography>
                  {event.start && (
                    <Typography variant="body2" color={theme.palette.text.secondary}>
                      {new Date(event.start).toLocaleTimeString()}
                    </Typography>
                  )}
                  {event.extendedProps?.description && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {event.extendedProps.description}
                    </Typography>
                  )}
                </Card>
              );
            })
          ) : (
            <Typography variant="body1" color={theme.palette.text.secondary}>
              No events for this day
            </Typography>
          )}
        </Stack>
        
      </Box>
    );
  };
  
  const renderListView = () => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));
    
    return (
      <Box sx={{ 
        height, 
        border: `1px solid ${theme.palette.divider}`, 
        borderRadius: 1,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        p: 3,
        overflow: 'auto'
      }}>
        <Typography variant="h4" gutterBottom>
          Event List
        </Typography>
        
        <Stack spacing={2}>
          {sortedEvents.length > 0 ? (
            sortedEvents.map((event, index) => {
              const isSelected = selectedEventId === event.id;
              return (
                <Card key={index} sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  bgcolor: isSelected 
                    ? theme.palette.secondary.light 
                    : theme.palette.action.hover,
                  border: isSelected ? `2px solid ${theme.palette.secondary.main}` : `1px solid ${theme.palette.divider}`,
                  boxShadow: isSelected ? theme.shadows[4] : theme.shadows[1],
                  transform: 'scale(1)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: isSelected 
                      ? theme.palette.secondary.light 
                      : theme.palette.action.selected,
                    transform: 'scale(1.02)',
                  }
                }}
                data-event-id={event.id}
                onClick={() => handleEventClick(event)}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ 
                        color: isSelected ? theme.palette.secondary.contrastText : 'inherit' 
                      }}>
                        {getEventDisplayTitle(event)}
                      </Typography>
                      {event.extendedProps?.description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {event.extendedProps.description}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      {event.start && (
                        <Typography variant="body2" color={theme.palette.text.secondary}>
                          {new Date(event.start).toLocaleDateString()}
                        </Typography>
                      )}
                      {event.start && (
                        <Typography variant="body2" color={theme.palette.text.secondary}>
                          {new Date(event.start).toLocaleTimeString()}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Card>
              );
            })
          ) : (
            <Typography variant="body1" color={theme.palette.text.secondary}>
              No events found
            </Typography>
          )}
        </Stack>
        
      </Box>
    );
  };
  
  // Render appropriate view based on view prop
  if (view === 'timeGridWeek') {
    return renderWeekView();
  } else if (view === 'timeGridDay') {
    return renderDayView();
  } else if (view === 'listWeek') {
    return renderListView();
  } else {
    // Default to month view
    return renderMonthView();
  }
};

export default SimpleCalendar;