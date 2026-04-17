import React, { useState, useMemo, useCallback } from 'react';
import {
  Grid,
  Typography,
  Box,
  Chip,
  Stack,
  Avatar,
  Button,
  IconButton,
  Paper,
  Divider,
  Alert,
  MenuItem,
  TextField,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  InputLabel,
  Tooltip,
  Snackbar
} from '@mui/material';
import { selectAllParticipants } from 'store/entities/participantsSlice';
import { selectAllEvents } from 'store/entities/eventsSlice';
import {
  Groups,
  Analytics,
  Today,
  AccessTime,
  ChevronLeft,
  ChevronRight,
  ContentCopy
} from '@mui/icons-material';
import { useSelector } from 'store';
import DailyNotes from './DailyNotes';
import LearningObjectives from './LearningObjectives';
import { derivedSelectors } from 'store/selectors';
import { useGetNeedsAnalysisQuery, useUpdateNeedsAnalysisMutation } from 'store/api/projectApi';

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

const SECTION_TABS = [
  { key: 'needs-analysis', label: 'Needs Analysis' },
  { key: 'daily-attendance', label: 'Daily Attendance' },
  { key: 'training-journal', label: 'Training Journal' },
  { key: 'course-completion', label: 'Course Completion' },
  { key: 'resources', label: 'Resources & Analytics' }
];

const ModernOverviewTab = () => {
  const participants = useSelector(selectAllParticipants);
  const hasParticipants = participants && participants.length > 0;
  const allEvents = useSelector(selectAllEvents);
  const project = useSelector(derivedSelectors.dashboard.selectProjectInfo);
  const attendanceSummary = useSelector(derivedSelectors.attendance.selectAttendanceSummary);
  const projectProgress = useSelector(derivedSelectors.dashboard.selectProjectProgress);
  const resourceUtilization = useSelector(derivedSelectors.dashboard.selectResourceUtilization);

  // Needs Analysis data
  const projectId = useSelector(state => state.settings.currentProjectId);
  const { data: needsAnalysis, isLoading: naLoading } = useGetNeedsAnalysisQuery(projectId, { skip: !projectId });
  const [updateNeedsAnalysis] = useUpdateNeedsAnalysisMutation();

  // Needs Analysis editing state
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingMetricIndex, setEditingMetricIndex] = useState(null);
  const [editingCauseIndex, setEditingCauseIndex] = useState(null);

  const handleStartEdit = useCallback((field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  }, []);

  const handleSaveField = useCallback(async (field) => {
    if (!projectId) return;
    await updateNeedsAnalysis({ projectId, [field]: editValue });
    setEditingField(null);
    setEditValue('');
  }, [projectId, editValue, updateNeedsAnalysis]);

  const handleCancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue('');
    setEditingCauseIndex(null);
    setEditingMetricIndex(null);
  }, []);

  const handleAddRootCause = useCallback(async () => {
    if (!projectId) return;
    const current = needsAnalysis?.rootCauses || [];
    await updateNeedsAnalysis({ projectId, rootCauses: [...current, ''] });
    setEditingCauseIndex(current.length);
    setEditValue('');
  }, [projectId, needsAnalysis, updateNeedsAnalysis]);

  const handleSaveRootCause = useCallback(async (index) => {
    if (!projectId) return;
    const current = [...(needsAnalysis?.rootCauses || [])];
    current[index] = editValue;
    await updateNeedsAnalysis({ projectId, rootCauses: current });
    setEditingCauseIndex(null);
    setEditValue('');
  }, [projectId, needsAnalysis, editValue, updateNeedsAnalysis]);

  const handleRemoveRootCause = useCallback(async (index) => {
    if (!projectId) return;
    const current = [...(needsAnalysis?.rootCauses || [])];
    current.splice(index, 1);
    await updateNeedsAnalysis({ projectId, rootCauses: current });
  }, [projectId, needsAnalysis, updateNeedsAnalysis]);

  const handleAddMetric = useCallback(async () => {
    if (!projectId) return;
    const current = needsAnalysis?.successMetrics || [];
    const newMetric = { label: '', value: '', description: '' };
    await updateNeedsAnalysis({ projectId, successMetrics: [...current, newMetric] });
    setEditingMetricIndex(current.length);
  }, [projectId, needsAnalysis, updateNeedsAnalysis]);

  const handleSaveMetric = useCallback(async (index, metric) => {
    if (!projectId) return;
    const current = [...(needsAnalysis?.successMetrics || [])];
    current[index] = metric;
    await updateNeedsAnalysis({ projectId, successMetrics: current });
    setEditingMetricIndex(null);
  }, [projectId, needsAnalysis, updateNeedsAnalysis]);

  const handleRemoveMetric = useCallback(async (index) => {
    if (!projectId) return;
    const current = [...(needsAnalysis?.successMetrics || [])];
    current.splice(index, 1);
    await updateNeedsAnalysis({ projectId, successMetrics: current });
  }, [projectId, needsAnalysis, updateNeedsAnalysis]);

  const [activeSection, setActiveSection] = useState('needs-analysis');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

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

  const isToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate.getTime() === today.getTime();
  }, [selectedDate]);

  const todaysAttendanceData = useMemo(() => {
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayEvents = allEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= dayStart && eventDate < dayEnd;
    });

    const attendanceRecords = [];
    dayEvents.forEach(event => {
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : null;
      const timeStr = eventStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        (eventEnd ? ' - ' + eventEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

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

  const uniqueCourses = useMemo(() => {
    const courses = [...new Set(todaysAttendanceData.map(item => item.sessionTitle))];
    return courses.sort();
  }, [todaysAttendanceData]);

  const filteredAttendance = useMemo(() => {
    if (selectedCourse === 'all') return todaysAttendanceData;
    return todaysAttendanceData.filter(item => item.sessionTitle === selectedCourse);
  }, [selectedCourse, todaysAttendanceData]);

  const attendanceRate = useMemo(() => {
    if (filteredAttendance.length === 0) return null;
    const presentCount = filteredAttendance.filter(a => a.status === 'present').length;
    const lateCount = filteredAttendance.filter(a => a.status === 'late').length;
    const attendedCount = presentCount + lateCount;
    const rate = Math.round((attendedCount / filteredAttendance.length) * 100);
    return rate;
  }, [filteredAttendance]);

  const handleCopyAttendanceReport = () => {
    if (filteredAttendance.length === 0) return;

    const dateStr = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let reportText = `DAILY ATTENDANCE REPORT\n`;
    reportText += `Date: ${dateStr}\n`;
    if (selectedCourse !== 'all') {
      reportText += `Course: ${selectedCourse}\n`;
    }
    reportText += `\n`;

    const sessionGroups = {};
    filteredAttendance.forEach(row => {
      if (!sessionGroups[row.sessionTitle]) {
        sessionGroups[row.sessionTitle] = {
          time: row.sessionTime,
          instructor: row.instructor,
          attendees: []
        };
      }
      sessionGroups[row.sessionTitle].attendees.push({
        name: row.employeeName,
        status: row.status
      });
    });

    Object.entries(sessionGroups).forEach(([sessionTitle, session]) => {
      reportText += `SESSION: ${sessionTitle}\n`;
      reportText += `Time: ${session.time}\n`;
      reportText += `Instructor: ${session.instructor}\n`;
      reportText += `Attendees:\n`;
      session.attendees.forEach(attendee => {
        const statusLabel = getStatusLabel(attendee.status);
        reportText += `  - ${attendee.name}: ${statusLabel}\n`;
      });
      reportText += `\n`;
    });

    const presentCount = filteredAttendance.filter(a => a.status === 'present').length;
    const lateCount = filteredAttendance.filter(a => a.status === 'late').length;
    const absentCount = filteredAttendance.filter(a => a.status === 'absent').length;
    const scheduledCount = filteredAttendance.filter(a => a.status === 'scheduled').length;

    reportText += `SUMMARY\n`;
    reportText += `Present: ${presentCount}\n`;
    reportText += `Late: ${lateCount}\n`;
    reportText += `Absent: ${absentCount}\n`;
    reportText += `Scheduled: ${scheduledCount}\n`;
    reportText += `Total: ${filteredAttendance.length}\n`;
    if (attendanceRate !== null) {
      reportText += `Attendance Rate: ${attendanceRate}%\n`;
    }

    navigator.clipboard.writeText(reportText).then(() => {
      setCopySnackbarOpen(true);
    }).catch(err => {
      console.error('Failed to copy attendance report:', err);
    });
  };

  const handleOpenParticipantDrawer = () => {
    const participantButton = document.querySelector('[aria-label="participants management"]');
    if (participantButton) {
      participantButton.click();
    }
  };

  // --- Section Content Renderers ---

  const renderNeedsAnalysis = () => {
    if (naLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      );
    }

    const rootCauses = needsAnalysis?.rootCauses || [];
    const successMetrics = needsAnalysis?.successMetrics || [];

    return (
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Needs Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define the problem this training or consultation is designed to address
          </Typography>
        </Box>

        <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Stack spacing={3}>
            {/* Problem Statement */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Problem Statement
              </Typography>
              {editingField === 'problemStatement' ? (
                <Stack spacing={1}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    size="small"
                    placeholder="Describe the core problem or challenge..."
                  />
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" onClick={() => handleSaveField('problemStatement')}>Save</Button>
                    <Button size="small" onClick={handleCancelEdit}>Cancel</Button>
                  </Stack>
                </Stack>
              ) : (
                <Typography
                  variant="body1"
                  onClick={() => handleStartEdit('problemStatement', needsAnalysis?.problemStatement)}
                  sx={{
                    cursor: 'pointer',
                    p: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                    color: needsAnalysis?.problemStatement ? 'text.primary' : 'text.disabled',
                    fontStyle: needsAnalysis?.problemStatement ? 'normal' : 'italic'
                  }}
                >
                  {needsAnalysis?.problemStatement || 'Click to add problem statement...'}
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Root Causes */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Identified Root Causes
                </Typography>
                <Button size="small" onClick={handleAddRootCause}>Add Cause</Button>
              </Stack>
              {rootCauses.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: 'text.disabled', fontStyle: 'italic', p: 1 }}
                >
                  No root causes identified yet. Click "Add Cause" to begin.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {rootCauses.map((cause, index) => (
                    <Box key={index}>
                      {editingCauseIndex === index ? (
                        <Stack spacing={1}>
                          <TextField
                            fullWidth
                            size="small"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                            placeholder="Describe root cause..."
                          />
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="contained" onClick={() => handleSaveRootCause(index)}>Save</Button>
                            <Button size="small" onClick={handleCancelEdit}>Cancel</Button>
                            <Button size="small" color="error" onClick={() => handleRemoveRootCause(index)}>Remove</Button>
                          </Stack>
                        </Stack>
                      ) : (
                        <Typography
                          variant="body2"
                          onClick={() => { setEditingCauseIndex(index); setEditValue(cause); }}
                          sx={{
                            cursor: 'pointer',
                            p: 1,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover' },
                            color: cause ? 'text.primary' : 'text.disabled',
                            fontStyle: cause ? 'normal' : 'italic'
                          }}
                        >
                          {index + 1}. {cause || 'Click to edit...'}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            <Divider />

            {/* Desired Outcome */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Desired Outcome
              </Typography>
              {editingField === 'desiredOutcome' ? (
                <Stack spacing={1}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    size="small"
                    placeholder="Describe the desired outcome..."
                  />
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" onClick={() => handleSaveField('desiredOutcome')}>Save</Button>
                    <Button size="small" onClick={handleCancelEdit}>Cancel</Button>
                  </Stack>
                </Stack>
              ) : (
                <Typography
                  variant="body1"
                  onClick={() => handleStartEdit('desiredOutcome', needsAnalysis?.desiredOutcome)}
                  sx={{
                    cursor: 'pointer',
                    p: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                    color: needsAnalysis?.desiredOutcome ? 'text.primary' : 'text.disabled',
                    fontStyle: needsAnalysis?.desiredOutcome ? 'normal' : 'italic'
                  }}
                >
                  {needsAnalysis?.desiredOutcome || 'Click to add desired outcome...'}
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Success Metrics */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Success Metrics
                </Typography>
                <Button size="small" onClick={handleAddMetric}>Add Metric</Button>
              </Stack>
              {successMetrics.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: 'text.disabled', fontStyle: 'italic', p: 1 }}
                >
                  No success metrics defined yet. Click "Add Metric" to begin.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {successMetrics.map((metric, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      {editingMetricIndex === index ? (
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'primary.main', borderRadius: 1 }}>
                          <Stack spacing={1.5}>
                            <TextField
                              size="small"
                              label="Label"
                              defaultValue={metric.label}
                              inputRef={(el) => { if (el) el.dataset.field = 'label'; }}
                              id={`metric-label-${index}`}
                            />
                            <TextField
                              size="small"
                              label="Value"
                              defaultValue={metric.value}
                              id={`metric-value-${index}`}
                            />
                            <TextField
                              size="small"
                              label="Description"
                              defaultValue={metric.description}
                              id={`metric-desc-${index}`}
                            />
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => {
                                  const label = document.getElementById(`metric-label-${index}`)?.value || '';
                                  const value = document.getElementById(`metric-value-${index}`)?.value || '';
                                  const description = document.getElementById(`metric-desc-${index}`)?.value || '';
                                  handleSaveMetric(index, { label, value, description });
                                }}
                              >
                                Save
                              </Button>
                              <Button size="small" onClick={() => setEditingMetricIndex(null)}>Cancel</Button>
                              <Button size="small" color="error" onClick={() => handleRemoveMetric(index)}>Remove</Button>
                            </Stack>
                          </Stack>
                        </Box>
                      ) : (
                        <Box
                          onClick={() => setEditingMetricIndex(index)}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'primary.main' }
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {metric.label || 'Untitled'}
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {metric.value || '--'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {metric.description || 'No description'}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Stack>
        </Paper>
      </Box>
    );
  };

  const renderDailyAttendance = () => (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Daily Attendance
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track participant attendance for each training session by day
        </Typography>
      </Box>

      {!hasParticipants ? (
        <Paper sx={{ p: 4, bgcolor: 'background.paper', textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Add participants to start tracking attendance.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
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

              {todaysAttendanceData.length > 0 && (
                <Tooltip title="Copy attendance report to clipboard">
                  <IconButton
                    size="small"
                    onClick={handleCopyAttendanceReport}
                    sx={{
                      bgcolor: 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
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
      )}
    </Box>
  );

  const renderTrainingJournal = () => (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Training Journal
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Daily session notes, highlights, and challenges captured by instructors
        </Typography>
      </Box>
      <DailyNotes project={project} />
    </Box>
  );

  const renderCourseCompletion = () => (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Course Completion
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track participant progress through required curriculum courses
        </Typography>
      </Box>
      <LearningObjectives project={project} />
    </Box>
  );

  const renderResources = () => (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Resources & Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Instructor workload, venue usage, and participant group distribution
        </Typography>
      </Box>

      <Grid container spacing={3}>
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

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'needs-analysis':
        return renderNeedsAnalysis();
      case 'daily-attendance':
        return renderDailyAttendance();
      case 'training-journal':
        return renderTrainingJournal();
      case 'course-completion':
        return renderCourseCompletion();
      case 'resources':
        return renderResources();
      default:
        return renderNeedsAnalysis();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* No participants alert */}
      {!hasParticipants && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            alignItems: 'center',
            '& .MuiAlert-message': { width: '100%' }
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

      {/* Project Metrics - Compact summary strip */}
      {hasParticipants && (
        <Paper
          variant="outlined"
          sx={{
            mb: 3,
            px: 3,
            py: 1.5,
            bgcolor: 'background.paper',
            borderColor: 'divider'
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            divider={<Divider orientation="vertical" flexItem />}
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={3}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Attendance
              </Typography>
              <Stack direction="row" spacing={2}>
                <Typography variant="body2">
                  <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>{attendanceSummary?.overallStats?.present || 0}</Box>
                  {' '}Present
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ color: 'warning.main', fontWeight: 700 }}>{attendanceSummary?.overallStats?.late || 0}</Box>
                  {' '}Late
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ color: 'error.main', fontWeight: 700 }}>{attendanceSummary?.overallStats?.absent || 0}</Box>
                  {' '}Absent
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ color: 'info.main', fontWeight: 700 }}>{attendanceSummary?.overallStats?.scheduled || 0}</Box>
                  {' '}Scheduled
                </Typography>
              </Stack>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={3}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Courses
              </Typography>
              <Stack direction="row" spacing={2}>
                <Typography variant="body2">
                  <Box component="span" sx={{ color: 'info.main', fontWeight: 700 }}>{projectProgress?.overview?.totalEvents || 0}</Box>
                  {' '}Scheduled
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>{projectProgress?.overview?.completedEvents || 0}</Box>
                  {' '}Completed
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{projectProgress?.overview?.overallProgress || 0}%</Box>
                  {' '}Rate
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Vertical Tabs + Content Layout */}
      <Stack direction="row" spacing={0} sx={{ minHeight: 500 }}>
        {/* Vertical Navigation */}
        <Box
          sx={{
            width: 200,
            minWidth: 200,
            borderRight: '1px solid',
            borderColor: 'divider',
            pr: 0
          }}
        >
          <Stack spacing={0.5} sx={{ position: 'sticky', top: 16 }}>
            {SECTION_TABS.map((tab) => (
              <Box
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                sx={{
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  borderRadius: '8px 0 0 8px',
                  borderRight: activeSection === tab.key ? '3px solid' : '3px solid transparent',
                  borderRightColor: activeSection === tab.key ? 'primary.main' : 'transparent',
                  bgcolor: activeSection === tab.key ? 'action.selected' : 'transparent',
                  '&:hover': {
                    bgcolor: activeSection === tab.key ? 'action.selected' : 'action.hover'
                  },
                  transition: 'all 0.15s ease'
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={activeSection === tab.key ? 600 : 400}
                  color={activeSection === tab.key ? 'primary.main' : 'text.secondary'}
                >
                  {tab.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Content Area */}
        <Box sx={{ flex: 1, pl: 3 }}>
          {renderActiveSection()}
        </Box>
      </Stack>

      {/* Copy success snackbar */}
      <Snackbar
        open={copySnackbarOpen}
        autoHideDuration={3000}
        onClose={() => setCopySnackbarOpen(false)}
        message="Attendance report copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default ModernOverviewTab;
