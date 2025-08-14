import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';

// ==============================|| SCROLLABLE GANTT WRAPPER ||============================== //

const ScrollableGantt = ({ 
  children, 
  timelineWidth, 
  columnWidth,
  onScroll 
}) => {
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !onScroll) return;

    const handleScroll = (e) => {
      onScroll(e.target.scrollLeft);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScroll]);

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': {
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'grey.100',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'grey.400',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'grey.600',
          },
        }
      }}
    >
      <Box
        sx={{
          width: timelineWidth,
          minWidth: '100%'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default ScrollableGantt;