import React, { useState, useMemo } from 'react';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Stack,
  Avatar,
  Button,
  IconButton,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  AvatarGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  InputLabel
} from '@mui/material';
import { selectAllParticipants } from 'store/entities/participantsSlice';
import { selectAllEvents } from 'store/entities/eventsSlice';
import {
  Groups,
  EventNote,
  CheckCircle,
  PlayArrow,
  Edit,
  Visibility,
  Analytics,
  Close,
  Today,
  AccessTime,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import { useSelector } from 'store';
import MainCard from 'components/MainCard';
import ChartWrapper from 'components/ChartWrapper';
import DailyNotes from './DailyNotes';
import LearningObjectives from './LearningObjectives';
import { derivedSelectors } from 'store/selectors';

const getStatusColor = (status) => {
  switch (status) {
    case 'present':
      return 'success';
    case 'late':
      return 'warning';
    case 'absent':
      return 'error';
    case 'scheduled':
    default:
      return 'info';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'present':
      return 'Present';
    case 'late':
      return 'Late';
    case 'absent':
      return 'Absent';
    case 'scheduled':
    default:
      return 'Scheduled';
  }
};




const ModernOverviewTab = () => {
  // Use normalized participants store instead of old Redux
  const participants = useSelector(selectAllParticipants);
  const hasParticipants = participants && participants.length > 0;

  // Get all events from normalized store
  const allEvents = useSelector(selectAllEvents);

  // Get project info from derived selector (CQRS architecture)
  const project = useSelector(derivedSelectors.dashboard.selectProjectInfo);

  // Get attendance summary from derived selectors (same logic as ProjectDashboard)
  const attendanceSummary = useSelector(derivedSelectors.attendance.selectAttendanceSummary);

  // Get dashboard data for course completion metrics
  const dashboardData = useSelector(derivedSelectors.dashboard.selectCompleteDashboard);
  const projectProgress = useSelector(derivedSelectors.dashboard.selectProjectProgress);

  // Get project health and alerts/recommendations
  const dashboardOverview = useSelector(derivedSelectors.dashboard.selectDashboardOverview);
  const projectHealth = useSelector(derivedSelectors.dashboard.selectProjectHealth);

  // Get resource utilization data
  const resourceUtilization = useSelector(derivedSelectors.dashboard.selectResourceUtilization);

  // State for attendance report course filter
  const [selectedCourse, setSelectedCourse] = useState('all');

  // State for selected date (for day navigation)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Navigation handlers
  const handlePreviousDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const handleGoToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
  };

  // Check if selected date is today
  const isToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate.getTime() === today.getTime();
  }, [selectedDate]);

  // Get selected day's events and flatten attendance data
  const todaysAttendanceData = useMemo(() => {
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Filter events for selected day
    const dayEvents = allEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= dayStart && eventDate < dayEnd;
    });

    // Flatten event attendees into attendance records
    const attendanceRecords = [];
    dayEvents.forEach(event => {
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : null;
      const timeStr = eventStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        (eventEnd ? ' - ' + eventEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

      // Get instructor name from event_instructors
      const instructorName = event.event_instructors?.[0]?.instructor
        ? `${event.event_instructors[0].instructor.firstName || ''} ${event.event_instructors[0].instructor.lastName || ''}`.trim()
        : 'No Instructor';

      if (event.event_attendees?.length > 0) {
        event.event_attendees.forEach(attendee => {
          const participant = attendee.enrollee?.participant;
          if (participant) {
            attendanceRecords.push({
              id: `${event.id}-${attendee.id}`,
              employeeName: `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || 'Unknown',
              sessionTitle: event.title || event.course?.title || 'Untitled Session',
              sessionTime: timeStr,
              status: attendee.attendance_status || 'scheduled',
              instructor: instructorName,
              eventId: event.id
            });
          }
        });
      }
    });

    return attendanceRecords;
  }, [allEvents, selectedDate]);

  // Get unique courses from today's attendance data for filter dropdown
  const uniqueCourses = useMemo(() => {
    const courses = [...new Set(todaysAttendanceData.map(item => item.sessionTitle))];
    return courses.sort();
  }, [todaysAttendanceData]);

  // Filter attendance data based on selected course
  const filteredAttendance = useMemo(() => {
    if (selectedCourse === 'all') return todaysAttendanceData;
    return todaysAttendanceData.filter(item => item.sessionTitle === selectedCourse);
  }, [selectedCourse, todaysAttendanceData]);

  // Calculate attendance rate
  const attendanceRate = useMemo(() => {
    if (filteredAttendance.length === 0) return null;
    const presentCount = filteredAttendance.filter(a => a.status === 'present').length;
    const lateCount = filteredAttendance.filter(a => a.status === 'late').length;
    // Count present + late as "attended"
    const attendedCount = presentCount + lateCount;
    const rate = Math.round((attendedCount / filteredAttendance.length) * 100);
    return rate;
  }, [filteredAttendance]);

  const handleOpenParticipantDrawer = () => {
    // Trigger the participant drawer opening
    const participantButton = document.querySelector('[aria-label="participants management"]');
    if (participantButton) {
      participantButton.click();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Show alert banner when no participants */}
      {!hasParticipants && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            alignItems: 'center',
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              variant="outlined"
              onClick={handleOpenParticipantDrawer}
              sx={{ 
                whiteSpace: 'nowrap',
                borderColor: 'currentColor',
                '&:hover': {
                  borderColor: 'currentColor',
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Add Participants Now
            </Button>
          }
        >
          <Typography variant="body1" fontWeight="500">
            Get Started: Your project needs participants!
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Add team members to begin tracking progress, scheduling sessions, and managing your training project effectively.
          </Typography>
        </Alert>
      )}

      {/* Attendance & Course Completion Stats - Horizontal Cards */}
      {hasParticipants && (
        <>
          {/* Section Header */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Project Metrics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overall attendance and course progress across all sessions
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Attendance Stats Card */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                    <CheckCircle />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    Attendance Overview
                  </Typography>
                </Stack>

              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {attendanceSummary?.overallStats?.present || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Present</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {attendanceSummary?.overallStats?.late || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Late</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {attendanceSummary?.overallStats?.absent || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Absent</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {attendanceSummary?.overallStats?.scheduled || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Scheduled</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Course Completion Stats Card */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                  <EventNote />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Course Progress
                </Typography>
              </Stack>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {projectProgress?.overview?.totalEvents || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Scheduled</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {projectProgress?.overview?.completedEvents || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Completed</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {projectProgress?.overview?.overallProgress || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Rate</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
        </>
      )}

      {/* Today's Attendance Report */}
      {hasParticipants && (
        <>
          {/* Section Header */}
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Daily Attendance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track participant attendance for each training session by day
            </Typography>
          </Box>

          <Paper sx={{ p: 3, bgcolor: 'background.paper', mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                  <Today />
                </Avatar>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {isToday ? "Today's Attendance Report" : 'Attendance Report'}
                    </Typography>
                  {attendanceRate !== null && (
                    <Chip
                      label={`${attendanceRate}% Attendance`}
                      size="small"
                      color={attendanceRate >= 80 ? 'success' : attendanceRate >= 50 ? 'warning' : 'error'}
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              {/* Day Navigation */}
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <IconButton size="small" onClick={handlePreviousDay} sx={{ bgcolor: 'action.hover' }}>
                  <ChevronLeft />
                </IconButton>
                {!isToday && (
                  <Button size="small" variant="outlined" onClick={handleGoToToday} sx={{ minWidth: 'auto', px: 1.5 }}>
                    Today
                  </Button>
                )}
                <IconButton size="small" onClick={handleNextDay} sx={{ bgcolor: 'action.hover' }}>
                  <ChevronRight />
                </IconButton>
              </Stack>

              {/* Course Filter - only show if there are sessions */}
              {todaysAttendanceData.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="course-filter-label">Filter by Course</InputLabel>
                  <Select
                    labelId="course-filter-label"
                    value={selectedCourse}
                    label="Filter by Course"
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <MenuItem value="all">All Courses</MenuItem>
                    {uniqueCourses.map((course) => (
                      <MenuItem key={course} value={course}>{course}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Stack>

          {todaysAttendanceData.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Today sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Sessions {isToday ? 'Today' : 'on This Day'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                There are no scheduled sessions for {isToday ? 'today' : 'this day'}. Check the agenda for upcoming sessions.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Session</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Instructor</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }} align="center">Attendance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAttendance.map((row) => (
                      <TableRow
                        key={row.id}
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                          '&:last-child td, &:last-child th': { border: 0 }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {row.employeeName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.sessionTitle}</Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {row.sessionTime}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {row.instructor}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={getStatusLabel(row.status)}
                            color={getStatusColor(row.status)}
                            size="small"
                            sx={{ minWidth: 80, fontWeight: 500 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Summary row */}
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={3} justifyContent="flex-end">
                <Typography variant="body2">
                  <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>
                    {filteredAttendance.filter(a => a.status === 'present').length}
                  </Box>
                  {' '}Present
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ color: 'warning.main', fontWeight: 600 }}>
                    {filteredAttendance.filter(a => a.status === 'late').length}
                  </Box>
                  {' '}Late
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ color: 'error.main', fontWeight: 600 }}>
                    {filteredAttendance.filter(a => a.status === 'absent').length}
                  </Box>
                  {' '}Absent
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ color: 'info.main', fontWeight: 600 }}>
                    {filteredAttendance.filter(a => a.status === 'scheduled').length}
                  </Box>
                  {' '}Scheduled
                </Typography>
              </Stack>
            </>
          )}
        </Paper>
        </>
      )}

      {/* Main Content Grid */}
      <Grid container spacing={3}>

        {/* Daily Training Notes Section */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Training Journal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Daily session notes, highlights, and challenges captured by instructors
            </Typography>
          </Box>
          <DailyNotes project={project} />
        </Grid>

        {/* Course Completion Section */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Course Completion
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track participant progress through required curriculum courses
            </Typography>
          </Box>
          <LearningObjectives project={project} />
        </Grid>

        {/* Resources & Analytics Section Header */}
        <Grid item xs={12}>
          <Box sx={{ mb: 1, mt: 1 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Resources & Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Instructor workload, venue usage, and participant group distribution
            </Typography>
          </Box>
        </Grid>

        {/* Fourth Row - Resource Utilization and Group Size Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <Groups />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                Resource Utilization
              </Typography>
            </Stack>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {resourceUtilization?.instructors?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Instructors
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {resourceUtilization?.instructors?.reduce((sum, i) => sum + (i.totalEvents || 0), 0) || 0} total sessions
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="h4" color="secondary.main" fontWeight="bold">
                    {resourceUtilization?.venues?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Training Venues
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {resourceUtilization?.venues?.reduce((sum, v) => sum + (v.totalBookings || 0), 0) || 0} total bookings
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {resourceUtilization?.recommendations && resourceUtilization.recommendations.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Recommendations
                  </Typography>
                  {resourceUtilization.recommendations.slice(0, 2).map((rec, index) => (
                    <Alert key={index} severity="info" variant="outlined" sx={{ py: 0.5 }}>
                      <Typography variant="caption">{rec.message}</Typography>
                    </Alert>
                  ))}
                </Stack>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
              <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                <Analytics />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                Group Size Distribution
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <Box sx={{
                p: 2,
                bgcolor: 'success.lighter',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'success.light'
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Small Groups</Typography>
                    <Typography variant="caption" color="text.secondary">1-5 participants</Typography>
                  </Box>
                  <Chip
                    label={resourceUtilization?.groupDistribution?.small || 0}
                    color="success"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Stack>
              </Box>

              <Box sx={{
                p: 2,
                bgcolor: 'warning.lighter',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'warning.light'
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Medium Groups</Typography>
                    <Typography variant="caption" color="text.secondary">6-15 participants</Typography>
                  </Box>
                  <Chip
                    label={resourceUtilization?.groupDistribution?.medium || 0}
                    color="warning"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Stack>
              </Box>

              <Box sx={{
                p: 2,
                bgcolor: 'error.lighter',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'error.light'
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Large Groups</Typography>
                    <Typography variant="caption" color="text.secondary">16+ participants</Typography>
                  </Box>
                  <Chip
                    label={resourceUtilization?.groupDistribution?.large || 0}
                    color="error"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

    </Box>
  );
};

export default ModernOverviewTab;