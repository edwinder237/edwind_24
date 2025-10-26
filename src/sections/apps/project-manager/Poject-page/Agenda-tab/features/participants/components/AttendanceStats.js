import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

/**
 * AttendanceStats - Displays attendance statistics with color-coded indicators
 * Pure presentational component for attendance summary
 */
const AttendanceStats = ({ attendanceStats }) => {
  const statItems = [
    { 
      key: 'present', 
      label: 'present', 
      color: 'success.main', 
      count: attendanceStats.present 
    },
    { 
      key: 'scheduled', 
      label: 'scheduled', 
      color: 'info.main', 
      count: attendanceStats.scheduled 
    },
    { 
      key: 'late', 
      label: 'late', 
      color: 'warning.main', 
      count: attendanceStats.late 
    },
    { 
      key: 'absent', 
      label: 'absent', 
      color: 'error.main', 
      count: attendanceStats.absent 
    }
  ];

  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 0.5 }}>
      {statItems.map(({ key, label, color, count }) => 
        count > 0 && (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
              {count} {label}
            </Typography>
          </Box>
        )
      )}
    </Stack>
  );
};

export default AttendanceStats;