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
  LinearProgress,
  IconButton,
  Collapse,
  Button
} from '@mui/material';
import {
  School,
  CheckCircle,
  RadioButtonUnchecked,
  ExpandMore,
  ExpandLess,
  TrendingUp,
  Assignment,
  Psychology,
  Group
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

// Mock learning objectives data
const generateLearningObjectives = () => [
  {
    id: 1,
    category: 'CRM Fundamentals',
    icon: <School />,
    color: '#2196F3',
    objectives: [
      {
        id: 101,
        title: 'Understanding CRM system architecture and core components',
        completed: true,
        completionRate: 100,
        participants: 20
      },
      {
        id: 102,
        title: 'Navigate the main CRM interface and dashboard',
        completed: true,
        completionRate: 95,
        participants: 19
      },
      {
        id: 103,
        title: 'Configure user settings and preferences',
        completed: false,
        completionRate: 45,
        participants: 9
      }
    ]
  },
  {
    id: 2,
    category: 'Customer Data Management',
    icon: <Assignment />,
    color: '#4CAF50',
    objectives: [
      {
        id: 201,
        title: 'Create and maintain customer profiles',
        completed: true,
        completionRate: 90,
        participants: 18
      },
      {
        id: 202,
        title: 'Import and export customer data',
        completed: false,
        completionRate: 35,
        participants: 7
      },
      {
        id: 203,
        title: 'Implement data quality best practices',
        completed: false,
        completionRate: 20,
        participants: 4
      }
    ]
  },
  {
    id: 3,
    category: 'Sales Pipeline Management',
    icon: <TrendingUp />,
    color: '#FF9800',
    objectives: [
      {
        id: 301,
        title: 'Create and manage sales opportunities',
        completed: false,
        completionRate: 60,
        participants: 12
      },
      {
        id: 302,
        title: 'Track deals through sales stages',
        completed: false,
        completionRate: 40,
        participants: 8
      },
      {
        id: 303,
        title: 'Generate sales forecasts and reports',
        completed: false,
        completionRate: 15,
        participants: 3
      }
    ]
  },
  {
    id: 4,
    category: 'Team Collaboration',
    icon: <Group />,
    color: '#9C27B0',
    objectives: [
      {
        id: 401,
        title: 'Share leads and opportunities with team members',
        completed: false,
        completionRate: 25,
        participants: 5
      },
      {
        id: 402,
        title: 'Use communication tools within CRM',
        completed: false,
        completionRate: 10,
        participants: 2
      }
    ]
  }
];

const LearningObjectives = ({ project }) => {
  const theme = useTheme();
  const [expandedCategories, setExpandedCategories] = useState([1]); // First category expanded by default
  const objectivesData = generateLearningObjectives();

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Calculate overall progress
  const allObjectives = objectivesData.flatMap(cat => cat.objectives);
  const completedObjectives = allObjectives.filter(obj => obj.completed).length;
  const totalObjectives = allObjectives.length;
  const overallProgress = (completedObjectives / totalObjectives) * 100;

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

      {/* Overall Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Course Progress
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {overallProgress.toFixed(0)}%
          </Typography>
        </Stack>
        <LinearProgress 
          variant="determinate" 
          value={overallProgress} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            bgcolor: alpha(theme.palette.grey[300], 0.3),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: overallProgress >= 75 ? 'success.main' : overallProgress >= 50 ? 'warning.main' : 'error.main'
            }
          }}
        />
      </Box>

      {/* Categories */}
      <Stack spacing={2}>
        {objectivesData.map((category) => {
          const isExpanded = expandedCategories.includes(category.id);
          const categoryCompleted = category.objectives.filter(obj => obj.completed).length;
          const categoryTotal = category.objectives.length;
          const categoryProgress = (categoryCompleted / categoryTotal) * 100;

          return (
            <Box key={category.id}>
              {/* Category Header */}
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
                    borderColor: category.color
                  }
                }}
                onClick={() => toggleCategory(category.id)}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: alpha(category.color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: category.color
                      }}
                    >
                      {category.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {category.category}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          {categoryCompleted}/{categoryTotal} objectives
                        </Typography>
                        <Chip 
                          label={`${categoryProgress.toFixed(0)}%`}
                          size="small"
                          sx={{
                            bgcolor: category.color,
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                  <IconButton size="small">
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Stack>
              </Box>

              {/* Category Objectives */}
              <Collapse in={isExpanded}>
                <Box sx={{ mt: 1, ml: 2, mr: 1 }}>
                  <List sx={{ py: 1 }}>
                    {category.objectives.map((objective) => (
                      <ListItem
                        key={objective.id}
                        sx={{
                          px: 2,
                          py: 1,
                          mb: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: objective.completed ? alpha(theme.palette.success.main, 0.05) : 'background.paper'
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {objective.completed ? (
                            <CheckCircle sx={{ color: 'success.main' }} />
                          ) : (
                            <RadioButtonUnchecked sx={{ color: 'text.disabled' }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={objective.title}
                          secondary={
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {objective.participants}/20 participants ({objective.completionRate}%)
                              </Typography>
                              <Box sx={{ minWidth: 60 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={objective.completionRate} 
                                  size="small"
                                  sx={{ 
                                    height: 4,
                                    bgcolor: alpha(theme.palette.grey[300], 0.3),
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: objective.completed ? 'success.main' : 'primary.main'
                                    }
                                  }}
                                />
                              </Box>
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Stack>

      {/* Actions */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button variant="outlined" size="small">
          View Detailed Progress Report
        </Button>
      </Box>
    </Paper>
  );
};

export default LearningObjectives;