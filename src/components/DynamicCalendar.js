import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Client-side only calendar component
const DynamicCalendar = (props) => {
  const [CalendarComponent, setCalendarComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only import on client side
    if (typeof window !== 'undefined') {
      import('./FullCalendarWrapper')
        .then((module) => {
          setCalendarComponent(() => module.default);
          setIsLoading(false);
        })
        .catch((error) => {
          setIsLoading(false);
        });
    }
  }, []);

  if (isLoading || !CalendarComponent) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height={props.height || 400}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <CalendarComponent {...props} />;
};

export default DynamicCalendar;