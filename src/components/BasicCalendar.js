import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';

const BasicCalendar = (props) => {
  const [isClient, setIsClient] = useState(false);
  const [Calendar, setCalendar] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      
      Promise.all([
        import('@fullcalendar/react'),
        import('@fullcalendar/daygrid'),
        import('@fullcalendar/timegrid'),
        import('@fullcalendar/interaction'),
        import('@fullcalendar/list')
      ])
        .then(([
          { default: FullCalendar },
          { default: dayGridPlugin },
          { default: timeGridPlugin },
          { default: interactionPlugin },
          { default: listPlugin }
        ]) => {
          
          // Create a wrapper component with plugins built-in
          const CalendarComponent = (calendarProps) => (
            <FullCalendar
              {...calendarProps}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            />
          );
          
          setCalendar(() => CalendarComponent);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load calendar');
        });
    }
  }, [isClient]);

  if (!isClient) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <div>Error loading calendar: {error}</div>
      </Box>
    );
  }

  if (!Calendar) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
      </Box>
    );
  }

  // Render the calendar with minimal props
  return (
    <Calendar
      initialView={props.view || 'dayGridMonth'}
      events={props.events || []}
      height={props.height || 720}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      }}
    />
  );
};

export default BasicCalendar;