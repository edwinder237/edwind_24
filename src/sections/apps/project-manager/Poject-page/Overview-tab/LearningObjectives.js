import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Collapse,
  Avatar,
  Alert
} from '@mui/material';
import {
  School,
  ExpandMore,
  ExpandLess,
  TrendingUp,
  Assignment,
  Psychology,
  Group,
  InfoCircleOutlined
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useSelector } from 'store';
import { selectCourseCompletionData, selectCourseParticipantRoleDistribution } from 'store/selectors';

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
 * Participant Card Component - Shows unique participant with sessions inline
 */
const ParticipantCard = ({ participantData, categoryColor }) => {
  const { firstName, lastName, role, attendanceRate, eventsAttended, totalEvents, isCompleted, sessions } = participantData;
  const initials = `${firstName?.[0] || 'U'}${lastName?.[0] || 'U'}`;
  const fullName = `${firstName || 'Unknown'} ${lastName || 'User'}`;

  return (
    <ListItem
      sx={{
        px: 2,
        py: 1.5,
        mb: 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        '&:hover': {
          bgcolor: 'action.hover'
        },
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: isCompleted ? '#4caf50' : categoryColor,
            fontSize: '0.875rem'
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" fontWeight={500}>
              {fullName}
            </Typography>
            {role && (
              <Chip
                label={role}
                size="small"
                color="primary"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600
                }}
              />
            )}
            <Chip
              label={`${eventsAttended}/${totalEvents} sessions (${attendanceRate}%)`}
              size="small"
              color={isCompleted ? 'success' : attendanceRate >= 70 ? 'primary' : 'warning'}
              variant="outlined"
              sx={{
                height: 18,
                fontSize: '0.65rem'
              }}
            />
          </Stack>
        </Box>
      </Stack>

      {/* Sessions inline */}
      {sessions && sessions.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 1,
            ml: 5.5,
            flexWrap: 'wrap',
            gap: 0.5
          }}
        >
          {sessions.map((session, idx) => (
            <Chip
              key={session.eventId || idx}
              label={formatSessionDateTime(session.start)}
              size="small"
              color={session.isCompleted ? 'success' : 'default'}
              variant={session.isCompleted ? 'filled' : 'outlined'}
              sx={{
                height: 22,
                fontSize: '0.7rem',
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          ))}
        </Stack>
      )}
    </ListItem>
  );
};

// ==============================|| MAIN COMPONENT ||============================== //

const CourseCompletionTracker = ({ project }) => {
  const theme = useTheme();
  const [expandedCourses, setExpandedCourses] = useState([]);

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
                              {course.totalEvents} event{course.totalEvents !== 1 ? 's' : ''}
                            </Typography>
                            <Chip
                              label={`${courseParticipants.length} participants`}
                              size="small"
                              sx={{
                                bgcolor: 'action.selected',
                                color: 'text.secondary',
                                fontSize: '0.65rem',
                                height: 20,
                                fontWeight: 500
                              }}
                            />
                            <Chip
                              label={`${course.completedParticipants}/${courseParticipants.length} completed`}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                fontWeight: 500,
                                borderColor: 'divider',
                                color: 'text.secondary'
                              }}
                            />
                            <Chip
                              label={`${course.averageAttendanceRate}% avg attendance`}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                fontWeight: 500,
                                borderColor: 'divider',
                                color: 'text.secondary'
                              }}
                            />
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
                      <List sx={{ py: 1 }}>
                        {courseParticipants.length > 0 ? (
                          courseParticipants.map((p) => (
                            <ParticipantCard
                              key={p.participantId || p.participant?.id}
                              participantData={extractParticipantData(p)}
                              categoryColor={courseColor}
                            />
                          ))
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              No participants assigned to this course
                            </Typography>
                          </Box>
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
