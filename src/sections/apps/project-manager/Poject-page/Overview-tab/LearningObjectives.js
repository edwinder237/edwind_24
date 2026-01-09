import React, { useState, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Stack,
  Chip,
  List,
  ListItem,
  IconButton,
  Collapse,
  Alert,
  Menu,
  MenuItem,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  School,
  ExpandMore,
  ExpandLess,
  TrendingUp,
  Assignment,
  Psychology,
  Group,
  Add
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useSelector } from 'store';
import { selectCourseCompletionData, selectCourseParticipantRoleDistribution } from 'store/selectors';
import { useAddEventParticipantMutation } from 'store/api/projectApi';

// ==============================|| COURSE CATEGORY ICONS ||============================== //

const getCategoryIcon = (category) => {
  const categoryLower = (category || '').toLowerCase();

  if (categoryLower.includes('crm') || categoryLower.includes('fundamentals')) {
    return <School />;
  } else if (categoryLower.includes('data') || categoryLower.includes('management')) {
    return <Assignment />;
  } else if (categoryLower.includes('sales') || categoryLower.includes('pipeline')) {
    return <TrendingUp />;
  } else if (categoryLower.includes('team') || categoryLower.includes('collaboration')) {
    return <Group />;
  }

  return <School />; // Default icon
};

const getCategoryColor = (index) => {
  const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4'];
  return colors[index % colors.length];
};

// ==============================|| UTILITY FUNCTIONS ||============================== //

/**
 * Safely extracts a string value from nested participant object
 */
const getStringValue = (obj, ...keys) => {
  for (const key of keys) {
    if (typeof obj?.[key] === 'string') {
      return obj[key];
    }
  }
  return '';
};

/**
 * Extracts participant display data from potentially nested structure
 */
const extractParticipantData = (p) => {
  const participant = p.participant || p;

  // Extract role
  const role = participant.role?.title ||
               participant.participantType ||
               'Learner';

  return {
    id: participant.id || p.participantId,
    firstName: getStringValue(participant, 'firstName', 'first_name'),
    lastName: getStringValue(participant, 'lastName', 'last_name'),
    role,
    attendanceRate: p.attendanceRate || 0,
    eventsAttended: p.eventsAttended || 0,
    totalEvents: p.totalEvents || 0,
    isCompleted: p.isCompleted || false,
    sessions: p.sessions || []
  };
};

/**
 * Format date and time for display
 */
const formatSessionDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

// ==============================|| SUB-COMPONENTS ||============================== //

/**
 * Participant Card Component - Compact view showing participant with sessions inline
 */
const ParticipantCard = ({ participantData, isEven, isLast }) => {
  const { firstName, lastName, role, attendanceRate, eventsAttended, totalEvents, isCompleted, sessions } = participantData;
  const fullName = `${firstName || 'Unknown'} ${lastName || 'User'}`;

  return (
    <ListItem
      sx={{
        px: 1.5,
        py: 0.75,
        bgcolor: isEven ? 'action.hover' : 'transparent',
        borderBottom: isLast ? 'none' : '1px solid',
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.selected'
        },
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.5
      }}
    >
      {/* Name and role */}
      <Typography variant="body2" fontWeight={500} sx={{ minWidth: 120 }}>
        {fullName}
      </Typography>
      {role && (
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          ({role})
        </Typography>
      )}

      {/* Attendance stats */}
      <Typography
        variant="caption"
        sx={{
          color: isCompleted ? 'success.main' : 'text.secondary',
          fontWeight: isCompleted ? 600 : 400,
          mr: 1
        }}
      >
        {eventsAttended}/{totalEvents} ({attendanceRate}%)
      </Typography>

      {/* Sessions inline - compact text format */}
      {sessions && sessions.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, flex: 1 }}>
          {sessions.map((session, idx) => (
            <Typography
              key={session.eventId || idx}
              variant="caption"
              sx={{
                px: 0.75,
                py: 0.25,
                borderRadius: 0.5,
                bgcolor: session.isCompleted ? 'action.selected' : 'transparent',
                border: '1px solid',
                borderColor: 'divider',
                fontSize: '0.65rem',
                color: 'text.secondary',
                whiteSpace: 'nowrap'
              }}
            >
              {formatSessionDateTime(session.start)}
            </Typography>
          ))}
        </Box>
      )}
    </ListItem>
  );
};

/**
 * Unscheduled Participant Row - Compact view for participants who should take the course but aren't scheduled
 */
const UnscheduledParticipantRow = ({ participant, enrolleeId, courseEvents, isEven, isLast, onSchedule, isScheduling }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const fullName = `${participant?.firstName || 'Unknown'} ${participant?.lastName || 'User'}`;
  const role = participant?.role?.title || 'No Role';

  const handleScheduleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEventSelect = async (eventId) => {
    setAnchorEl(null);
    if (onSchedule) {
      await onSchedule(enrolleeId, eventId);
    }
  };

  const formatEventOption = (event) => {
    const date = new Date(event.start);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  };

  return (
    <ListItem
      sx={{
        px: 1.5,
        py: 0.75,
        bgcolor: isEven ? 'warning.lighter' : alpha('#ff9800', 0.04),
        borderBottom: isLast ? 'none' : '1px solid',
        borderColor: 'divider',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 0.5
      }}
    >
      <Typography variant="body2" fontWeight={500} sx={{ minWidth: 120 }}>
        {fullName}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
        ({role})
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: 'warning.dark',
          fontWeight: 500,
          flex: 1
        }}
      >
        Not scheduled
      </Typography>

      {/* Schedule button */}
      {courseEvents?.length > 0 && (
        <>
          <Tooltip title="Schedule to event">
            <IconButton
              size="small"
              onClick={handleScheduleClick}
              disabled={isScheduling}
              sx={{
                bgcolor: 'warning.lighter',
                '&:hover': { bgcolor: 'warning.light' },
                width: 24,
                height: 24
              }}
            >
              {isScheduling ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <Add sx={{ fontSize: 16, color: 'warning.dark' }} />
              )}
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Select event to schedule:
            </MenuItem>
            {courseEvents.map(event => (
              <MenuItem
                key={event.id}
                onClick={() => handleEventSelect(event.id)}
                sx={{ fontSize: '0.8rem' }}
              >
                {formatEventOption(event)}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </ListItem>
  );
};

// ==============================|| MAIN COMPONENT ||============================== //

const CourseCompletionTracker = ({ project }) => {
  const theme = useTheme();
  const [expandedCourses, setExpandedCourses] = useState([]);
  const [schedulingParticipant, setSchedulingParticipant] = useState(null);

  // RTK Query mutation for adding participant to event
  const [addEventParticipant] = useAddEventParticipantMutation();

  // Get course completion data from normalized Redux store
  const completionData = useSelector(selectCourseCompletionData);
  const roleDistribution = useSelector(selectCourseParticipantRoleDistribution);

  // Extract data
  const { curriculums, totalCourses, totalObjectives, completedObjectives, overallCompletionRate } = completionData;

  // Toggle course expansion
  const toggleCourse = (courseId) => {
    setExpandedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Handle scheduling an unscheduled participant to an event
  const handleScheduleParticipant = useCallback(async (enrolleeId, eventId) => {
    setSchedulingParticipant(enrolleeId);
    try {
      await addEventParticipant({
        eventId,
        participantId: enrolleeId,
        attendance_status: 'scheduled',
        projectId: project?.id
      }).unwrap();
      // RTK Query auto-invalidates and refetches
    } catch (error) {
      console.error('Failed to schedule participant:', error);
    } finally {
      setSchedulingParticipant(null);
    }
  }, [addEventParticipant, project?.id]);

  // Empty state
  if (curriculums.length === 0) {
    return (
      <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <Psychology sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">Course Completion Tracker</Typography>
        </Stack>
        <Alert severity="info" sx={{ mt: 2 }}>
          No curriculums assigned to this project. Assign curriculums to groups to track course completion.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Psychology sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">Course Completion Tracker</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Chip
            label={`${completedObjectives}/${totalObjectives} completed`}
            size="small"
            color={overallCompletionRate >= 50 ? 'success' : 'warning'}
            variant="outlined"
          />
          <Typography variant="caption" color="text.secondary">
            {overallCompletionRate}% overall progress
          </Typography>
        </Stack>
      </Stack>

      {/* Role Breakdown */}
      {roleDistribution.length > 0 && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
            Role Breakdown
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {roleDistribution.map((roleStat, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: roleStat.color
                  }}
                />
                <Typography variant="body2" fontWeight={500}>
                  {roleStat.role}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {roleStat.count}
                </Typography>
                <Chip
                  label={`${roleStat.percentage}%`}
                  size="small"
                  sx={{
                    bgcolor: roleStat.color,
                    color: 'white',
                    fontSize: '0.65rem',
                    height: 18,
                    minWidth: 35
                  }}
                />
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Curriculum Sections */}
      {curriculums.map((curriculum, curriculumIndex) => (
        <Box key={curriculum.id} sx={{ mb: 3 }}>
          {/* Curriculum Header */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {curriculum.title}
            </Typography>
            {curriculum.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {curriculum.description}
              </Typography>
            )}
            <Stack direction="row" spacing={1}>
              <Chip
                label={`${curriculum.courseCount} courses`}
                size="small"
                color="primary"
                variant="outlined"
              />
              {curriculum.assignedGroups.length > 0 && (
                <Chip
                  label={`Assigned to ${curriculum.assignedGroups.length} group${curriculum.assignedGroups.length > 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>

          {/* Course Sections */}
          <Stack spacing={2}>
            {curriculum.courses.map((course, courseIndex) => {
              const isExpanded = expandedCourses.includes(course.id);
              const courseParticipants = course.participants || [];
              const courseColor = getCategoryColor(curriculumIndex * 10 + courseIndex);

              return (
                <Box key={course.id}>
                  {/* Course Header */}
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: courseColor
                      }
                    }}
                    onClick={() => toggleCourse(course.id)}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={2}>
                        {/* Course Icon */}
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            bgcolor: alpha(courseColor, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: courseColor
                          }}
                        >
                          {getCategoryIcon(course.courseCategory)}
                        </Box>

                        {/* Course Info */}
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                            <Typography variant="subtitle1" fontWeight="bold">
                              {course.title}
                            </Typography>
                            {course.code && (
                              <Chip
                                label={course.code}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  fontWeight: 500,
                                  borderColor: 'divider',
                                  color: 'text.secondary',
                                  bgcolor: 'background.paper'
                                }}
                              />
                            )}
                            {course.version && (
                              <Chip
                                label={`v${course.version}`}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  bgcolor: 'action.hover',
                                  color: 'text.secondary',
                                  fontWeight: 500
                                }}
                              />
                            )}
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {course.totalEvents} event{course.totalEvents !== 1 ? 's' : ''} · {course.completedParticipants}/{courseParticipants.length} completed
                            </Typography>
                            {course.unscheduledParticipants?.length > 0 && (
                              <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 500 }}>
                                · {course.unscheduledParticipants.length} not scheduled
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      </Stack>

                      {/* Expand/Collapse Icon */}
                      <IconButton size="small">
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Stack>
                  </Box>

                  {/* Participants List (Collapsible) */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ mt: 1, ml: 2, mr: 1 }}>
                      <List sx={{
                        py: 0,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)'
                      }}>
                        {/* Scheduled Participants */}
                        {courseParticipants.length > 0 ? (
                          courseParticipants.map((p, idx) => (
                            <ParticipantCard
                              key={p.participantId || p.participant?.id}
                              participantData={extractParticipantData(p)}
                              isEven={idx % 2 === 0}
                              isLast={idx === courseParticipants.length - 1 && (!course.unscheduledParticipants || course.unscheduledParticipants.length === 0)}
                            />
                          ))
                        ) : !course.unscheduledParticipants?.length ? (
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              No participants assigned to this course
                            </Typography>
                          </Box>
                        ) : null}

                        {/* Unscheduled Required Participants */}
                        {course.unscheduledParticipants?.length > 0 && (
                          <>
                            <Box sx={{
                              px: 1.5,
                              py: 0.5,
                              bgcolor: 'warning.lighter',
                              borderTop: courseParticipants.length > 0 ? '1px solid' : 'none',
                              borderBottom: '1px solid',
                              borderColor: 'divider'
                            }}>
                              <Typography variant="caption" color="warning.dark" fontWeight={600}>
                                Not Scheduled ({course.unscheduledParticipants.length})
                              </Typography>
                            </Box>
                            {course.unscheduledParticipants.map((p, idx) => (
                              <UnscheduledParticipantRow
                                key={p.participantId}
                                participant={p.participant}
                                enrolleeId={p.enrolleeId}
                                courseEvents={course.events}
                                isEven={idx % 2 === 0}
                                isLast={idx === course.unscheduledParticipants.length - 1}
                                onSchedule={handleScheduleParticipant}
                                isScheduling={schedulingParticipant === p.enrolleeId}
                              />
                            ))}
                          </>
                        )}
                      </List>
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Stack>
        </Box>
      ))}
    </Paper>
  );
};

export default CourseCompletionTracker;
