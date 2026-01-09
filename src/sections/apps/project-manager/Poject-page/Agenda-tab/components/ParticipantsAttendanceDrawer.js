import React, { useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Avatar,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import { Close, Person, CheckCircle, Cancel, Schedule, Warning } from '@mui/icons-material';

// Mock participant attendance data
const MOCK_PARTICIPANTS = [
  {
    id: 1,
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    role: 'Sales Manager',
    avatar: null,
    attendance: {
      present: 8,
      absent: 1,
      late: 1,
      scheduled: 2,
      total: 12,
      percentage: 75
    }
  },
  {
    id: 2,
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@example.com',
    role: 'Account Executive',
    avatar: null,
    attendance: {
      present: 10,
      absent: 0,
      late: 2,
      scheduled: 0,
      total: 12,
      percentage: 100
    }
  },
  {
    id: 3,
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@example.com',
    role: 'Sales Representative',
    avatar: null,
    attendance: {
      present: 6,
      absent: 3,
      late: 1,
      scheduled: 2,
      total: 12,
      percentage: 58
    }
  },
  {
    id: 4,
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@example.com',
    role: 'Business Development',
    avatar: null,
    attendance: {
      present: 9,
      absent: 1,
      late: 0,
      scheduled: 2,
      total: 12,
      percentage: 83
    }
  },
  {
    id: 5,
    firstName: 'Jessica',
    lastName: 'Williams',
    email: 'jessica.williams@example.com',
    role: 'Sales Manager',
    avatar: null,
    attendance: {
      present: 11,
      absent: 0,
      late: 1,
      scheduled: 0,
      total: 12,
      percentage: 100
    }
  },
  {
    id: 6,
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.taylor@example.com',
    role: 'Account Executive',
    avatar: null,
    attendance: {
      present: 7,
      absent: 2,
      late: 1,
      scheduled: 2,
      total: 12,
      percentage: 67
    }
  },
  {
    id: 7,
    firstName: 'Amanda',
    lastName: 'Brown',
    email: 'amanda.brown@example.com',
    role: 'Sales Representative',
    avatar: null,
    attendance: {
      present: 5,
      absent: 4,
      late: 1,
      scheduled: 2,
      total: 12,
      percentage: 50
    }
  },
  {
    id: 8,
    firstName: 'Christopher',
    lastName: 'Martinez',
    email: 'christopher.martinez@example.com',
    role: 'Business Development',
    avatar: null,
    attendance: {
      present: 10,
      absent: 0,
      late: 0,
      scheduled: 2,
      total: 12,
      percentage: 100
    }
  }
];

const getAttendanceColor = (percentage) => {
  if (percentage >= 90) return 'success';
  if (percentage >= 70) return 'warning';
  return 'error';
};

const getProgressColor = (percentage, theme) => {
  if (percentage >= 90) return theme.palette.success.main;
  if (percentage >= 70) return theme.palette.warning.main;
  return theme.palette.error.main;
};

const AttendanceStatusChip = ({ status, count }) => {
  const theme = useTheme();

  const statusConfig = {
    present: { icon: <CheckCircle sx={{ fontSize: 14 }} />, color: 'success', label: 'Present' },
    absent: { icon: <Cancel sx={{ fontSize: 14 }} />, color: 'error', label: 'Absent' },
    late: { icon: <Warning sx={{ fontSize: 14 }} />, color: 'warning', label: 'Late' },
    scheduled: { icon: <Schedule sx={{ fontSize: 14 }} />, color: 'default', label: 'Scheduled' }
  };

  const config = statusConfig[status];

  return (
    <Chip
      size="small"
      icon={config.icon}
      label={count}
      color={config.color}
      variant="outlined"
      sx={{
        minWidth: 50,
        '& .MuiChip-label': { px: 0.5 }
      }}
    />
  );
};

const ParticipantsAttendanceDrawer = ({ open, onClose }) => {
  const theme = useTheme();

  const summaryStats = useMemo(() => {
    const totals = MOCK_PARTICIPANTS.reduce((acc, p) => ({
      present: acc.present + p.attendance.present,
      absent: acc.absent + p.attendance.absent,
      late: acc.late + p.attendance.late,
      scheduled: acc.scheduled + p.attendance.scheduled,
      total: acc.total + p.attendance.total
    }), { present: 0, absent: 0, late: 0, scheduled: 0, total: 0 });

    return {
      ...totals,
      avgAttendance: Math.round(
        MOCK_PARTICIPANTS.reduce((acc, p) => acc + p.attendance.percentage, 0) / MOCK_PARTICIPANTS.length
      )
    };
  }, []);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 500, md: 600 },
          bgcolor: theme.palette.background.paper
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.dark, 0.05)} 100%)`
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 40,
                height: 40
              }}
            >
              <Person />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                Participants Attendance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {MOCK_PARTICIPANTS.length} participants enrolled
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ p: 2, bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Overall Summary
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Box sx={{ textAlign: 'center', minWidth: 70 }}>
            <Typography variant="h4" color="success.main" fontWeight={600}>
              {summaryStats.present}
            </Typography>
            <Typography variant="caption" color="text.secondary">Present</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: 70 }}>
            <Typography variant="h4" color="error.main" fontWeight={600}>
              {summaryStats.absent}
            </Typography>
            <Typography variant="caption" color="text.secondary">Absent</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: 70 }}>
            <Typography variant="h4" color="warning.main" fontWeight={600}>
              {summaryStats.late}
            </Typography>
            <Typography variant="caption" color="text.secondary">Late</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: 70 }}>
            <Typography variant="h4" color="text.secondary" fontWeight={600}>
              {summaryStats.scheduled}
            </Typography>
            <Typography variant="caption" color="text.secondary">Scheduled</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: 80 }}>
            <Typography variant="h4" color="primary.main" fontWeight={600}>
              {summaryStats.avgAttendance}%
            </Typography>
            <Typography variant="caption" color="text.secondary">Avg Rate</Typography>
          </Box>
        </Stack>
      </Box>

      <Divider />

      {/* Participants Table */}
      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, bgcolor: theme.palette.background.paper }}>
                Participant
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, bgcolor: theme.palette.background.paper }}>
                Attendance
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, bgcolor: theme.palette.background.paper, minWidth: 200 }}>
                Status Breakdown
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_PARTICIPANTS.map((participant) => (
              <TableRow
                key={participant.id}
                hover
                sx={{ '&:last-child td': { border: 0 } }}
              >
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      {participant.firstName[0]}{participant.lastName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {participant.firstName} {participant.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {participant.role}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Stack spacing={0.5} alignItems="center">
                    <Chip
                      size="small"
                      label={`${participant.attendance.percentage}%`}
                      color={getAttendanceColor(participant.attendance.percentage)}
                      sx={{ fontWeight: 600, minWidth: 55 }}
                    />
                    <LinearProgress
                      variant="determinate"
                      value={participant.attendance.percentage}
                      sx={{
                        width: 60,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.grey[500], 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getProgressColor(participant.attendance.percentage, theme),
                          borderRadius: 2
                        }
                      }}
                    />
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" useFlexGap>
                    <AttendanceStatusChip status="present" count={participant.attendance.present} />
                    <AttendanceStatusChip status="absent" count={participant.attendance.absent} />
                    <AttendanceStatusChip status="late" count={participant.attendance.late} />
                    <AttendanceStatusChip status="scheduled" count={participant.attendance.scheduled} />
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.grey[500], 0.02)
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Attendance data is updated in real-time as events are completed.
        </Typography>
      </Box>
    </Drawer>
  );
};

export default ParticipantsAttendanceDrawer;
