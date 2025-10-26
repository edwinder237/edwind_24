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
  Button,
  Avatar
} from '@mui/material';
import {
  School,
  ExpandMore,
  ExpandLess,
  TrendingUp,
  Assignment,
  Psychology,
  Group
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useSelector } from 'store';
import { selectAllParticipants } from 'store/entities/participantsSlice';

// ==============================|| COURSE DATA ||============================== //

const COURSES = [
  {
    id: 1,
    category: 'CRM Fundamentals',
    icon: <School />,
    color: '#2196F3',
    totalObjectives: 3
  },
  {
    id: 2,
    category: 'Customer Data Management',
    icon: <Assignment />,
    color: '#4CAF50',
    totalObjectives: 3
  },
  {
    id: 3,
    category: 'Sales Pipeline Management',
    icon: <TrendingUp />,
    color: '#FF9800',
    totalObjectives: 3
  },
  {
    id: 4,
    category: 'Team Collaboration',
    icon: <Group />,
    color: '#9C27B0',
    totalObjectives: 2
  }
];

// ==============================|| UTILITY FUNCTIONS ||============================== //

/**
 * Safely extracts a string value from nested participant object
 * Handles both camelCase and snake_case field names
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

  // Extract role from various possible locations
  const role = getStringValue(p, 'participantRole', 'role') ||
               getStringValue(participant, 'role', 'participantRole') ||
               'Learner'; // Default role if not specified

  return {
    id: p.id || participant?.id,
    firstName: getStringValue(participant, 'firstName', 'first_name'),
    lastName: getStringValue(participant, 'lastName', 'last_name'),
    role,
    groupName: getStringValue(p, 'groupName', 'group_name') || p.group?.name || ''
  };
};

// ==============================|| SUB-COMPONENTS ||============================== //

/**
 * Participant Card Component
 */
const ParticipantCard = ({ participantData, categoryColor }) => {
  const { id, firstName, lastName, role, groupName } = participantData;
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
        }
      }}
    >
      <ListItemIcon sx={{ minWidth: 48 }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: categoryColor,
            fontSize: '0.875rem'
          }}
        >
          {initials}
        </Avatar>
      </ListItemIcon>
      <ListItemText
        primary={
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
          </Stack>
        }
        secondary={
          groupName ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Group:
              </Typography>
              <Chip
                label={groupName}
                size="small"
                variant="outlined"
                sx={{
                  height: 18,
                  fontSize: '0.65rem'
                }}
              />
            </Stack>
          ) : null
        }
      />
    </ListItem>
  );
};

// ==============================|| MAIN COMPONENT ||============================== //

const LearningObjectives = ({ project }) => {
  const theme = useTheme();
  const [expandedCategories, setExpandedCategories] = useState([1]);

  // Get participants from normalized Redux store
  const participants = useSelector(selectAllParticipants);

  // Toggle course expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Calculate overall progress metrics
  const totalObjectives = COURSES.reduce((sum, course) => sum + course.totalObjectives, 0);
  const completedObjectives = 3; // TODO: Connect to real completion data
  const overallProgress = (completedObjectives / totalObjectives) * 100;

  // Calculate role distribution
  const roleDistribution = participants.reduce((acc, p) => {
    const participantData = extractParticipantData(p);
    const role = participantData.role || 'Learner';
    if (!acc[role]) {
      acc[role] = { role, count: 0 };
    }
    acc[role].count++;
    return acc;
  }, {});

  const roleStats = Object.values(roleDistribution).map((r, index) => ({
    ...r,
    percentage: participants.length > 0 ? Math.round((r.count / participants.length) * 100) : 0,
    color: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4'][index % 6]
  }));

  return (
    <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Psychology sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">Learning Objectives</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Chip
            label={`${completedObjectives}/${totalObjectives} completed`}
            size="small"
            color={overallProgress >= 50 ? 'success' : 'warning'}
            variant="outlined"
          />
          <Typography variant="caption" color="text.secondary">
            {overallProgress.toFixed(0)}% overall progress
          </Typography>
        </Stack>
      </Stack>

      {/* Role Breakdown */}
      {roleStats.length > 0 && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
            Role Breakdown
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {roleStats.map((roleStat, index) => (
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

      {/* Course Sections */}
      <Stack spacing={2}>
        {COURSES.map((course) => {
          const isExpanded = expandedCategories.includes(course.id);
          const courseParticipants = participants.slice(0, 5); // TODO: Filter by actual course enrollment

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
                    borderColor: course.color
                  }
                }}
                onClick={() => toggleCategory(course.id)}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={2}>
                    {/* Course Icon */}
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: alpha(course.color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: course.color
                      }}
                    >
                      {course.icon}
                    </Box>

                    {/* Course Info */}
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {course.category}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          {course.totalObjectives} objectives
                        </Typography>
                        <Chip
                          label={`${courseParticipants.length} participants`}
                          size="small"
                          sx={{
                            bgcolor: course.color,
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20
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
                          key={extractParticipantData(p).id}
                          participantData={extractParticipantData(p)}
                          categoryColor={course.color}
                        />
                      ))
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          No participants enrolled in this course
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

    </Paper>
  );
};

export default LearningObjectives;