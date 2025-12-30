// material-ui
import { List, ListItemButton, ListItemText, Stack, Typography, Chip, Box } from '@mui/material';
import { CalendarMonth } from '@mui/icons-material';

// project import
import MainCard from 'components/MainCard';

// ==============================|| ATTENDANCE HISTORY ||============================== //

function AttendanceHistory({ attendanceHistory = [], getStatusColor }) {
  if (!attendanceHistory || attendanceHistory.length === 0) {
    return (
      <MainCard content={false}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CalendarMonth sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No attendance records found
          </Typography>
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard content={false}>
      <List sx={{ p: 0, '& .MuiListItemButton-root': { py: 2 } }}>
        {attendanceHistory.map((record, index) => (
          <ListItemButton
            key={`${record.eventId}-${index}`}
            divider={index < attendanceHistory.length - 1}
          >
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" fontWeight={500}>
                    {new Date(record.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Typography>
                </Stack>
              }
              secondary={
                <Typography color="textSecondary" sx={{ display: 'inline' }}>
                  {record.eventTitle || 'Event'}
                </Typography>
              }
            />
            <Stack alignItems="flex-end" spacing={0.5}>
              <Chip
                size="small"
                label={record.status.toUpperCase()}
                color={getStatusColor(record.status)}
                sx={{ height: 22, minWidth: 80, fontWeight: 600 }}
              />
              {record.checkIn && (
                <Typography variant="caption" color="text.secondary">
                  {record.checkIn}
                </Typography>
              )}
              {record.checkOut && (
                <Typography variant="caption" color="text.secondary">
                  {record.checkOut}
                </Typography>
              )}
            </Stack>
          </ListItemButton>
        ))}
      </List>
    </MainCard>
  );
}

export default AttendanceHistory;
