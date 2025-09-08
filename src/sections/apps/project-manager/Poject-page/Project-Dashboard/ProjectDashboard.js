import PropTypes from 'prop-types';
import React from 'react';
import {
  Box,
  Chip,
  Grid,
  Typography,
  Divider,
  LinearProgress,
  Stack,
  Menu,
  MenuItem,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MainCard from "components/MainCard";
import { PROJECT_STATUS } from "constants";
import { useSelector, useDispatch } from "store";
import { openSnackbar } from 'store/reducers/snackbar';
import { updateProject } from 'store/reducers/projects';
import { CalendarOutlined, DashboardOutlined } from "@ant-design/icons";

// ==============================|| PROJECT DASHBOARD ||============================== //

const ProjectDashboard = ({ project, participants, checklistItems, styles }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { projectSettings } = useSelector((state) => state.projects);
  
  // State for status menu
  const [statusMenuAnchor, setStatusMenuAnchor] = React.useState(null);
  const statusMenuOpen = Boolean(statusMenuAnchor);
  
  // Available project statuses
  const projectStatuses = Object.values(PROJECT_STATUS);

  // Handle status menu open
  const handleStatusMenuOpen = (event) => {
    setStatusMenuAnchor(event.currentTarget);
  };

  // Handle status menu close
  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`/api/projects/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          status: newStatus
        }),
      });

      if (response.ok) {
        // Update project in Redux store
        const updatedProject = { ...project, projectStatus: newStatus };
        dispatch(updateProject(updatedProject));
        
        // Show success notification
        dispatch(openSnackbar({
          open: true,
          message: `Project status updated to ${newStatus}`,
          variant: 'alert',
          alert: {
            color: 'success'
          },
          close: true
        }));

        // Close the status menu
        handleStatusMenuClose();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to update project status',
        variant: 'alert',
        alert: {
          color: 'error'
        },
        close: true
      }));
    }

    handleStatusMenuClose();
  };
  

  // Helper function to format dates
  const formatDate = (dateStr) => {
    return dateStr 
      ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null;
  };

  // Get the actual project dates - check all possible sources
  const getProjectStartDate = () => {
    // Check in order: Redux projectSettings, project.project_settings, project.startDate
    return projectSettings?.startDate || 
           project?.project_settings?.startDate || 
           project?.startDate;
  };

  const getProjectEndDate = () => {
    // Check in order: Redux projectSettings, project.project_settings, project.endDate  
    return projectSettings?.endDate || 
           project?.project_settings?.endDate || 
           project?.endDate;
  };

  // Get the main instructor from project instructors
  const getMainInstructor = () => {
    if (!project?.project_instructors || project.project_instructors.length === 0) {
      return 'TBD';
    }
    
    // Try both field names for compatibility
    const mainInstructor = project.project_instructors.find(
      pi => pi.instructorType === 'main' || pi.role === 'main'
    );
    
    if (mainInstructor?.instructor) {
      const instructor = mainInstructor.instructor;
      return `${instructor.firstName} ${instructor.lastName}`;
    }
    
    // If no main instructor found, return the first instructor as fallback
    const firstInstructor = project.project_instructors[0]?.instructor;
    if (firstInstructor) {
      return `${firstInstructor.firstName} ${firstInstructor.lastName}`;
    }
    
    return 'TBD';
  };

  // Helper function to calculate progress percentage (time elapsed)
  const calculateTimeElapsed = (startDate, endDate) => {
    if (!startDate || !endDate) return 45;
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  };

  // Calculate project progress based on the three metrics according to guidelines
  const calculateProjectProgress = () => {
    // 1. Learning Progress (0-100%) - Currently hardcoded, should be calculated from actual learning data
    const learningProgress = 30; // TODO: Calculate from actual learning metrics
    
    // 2. Technical Setup Progress (0-100%) - Based on checklist completion
    const technicalSetupProgress = checklistItems.length > 0 
      ? Math.round((checklistItems.filter(item => item.completed).length / checklistItems.length) * 100)
      : 0; // Treat as 0% if no checklist items exist
    
    // 3. Attendance Rate (0-100%) - Currently hardcoded, should be calculated from event attendance
    const attendanceRate = 85; // TODO: Calculate from actual attendance data
    
    // Apply the rule: Each metric contributes equally (1/3) to the overall project progress
    // Handle null/undefined values by treating them as 0%
    const safelearningProgress = learningProgress ?? 0;
    const safeTechnicalSetupProgress = technicalSetupProgress ?? 0;
    const safeAttendanceRate = attendanceRate ?? 0;
    
    const projectProgress = (safelearningProgress + safeTechnicalSetupProgress + safeAttendanceRate) / 3;
    
    // Return as float for precision but we'll round for display
    return {
      overall: projectProgress,
      learning: safelearningProgress,
      technical: safeTechnicalSetupProgress,
      attendance: safeAttendanceRate
    };
  };

  // Helper function for status chip styles
  const getStatusChipStyles = (status) => {
    let palette;
    switch (status) {
      case 'Completed':
        palette = theme.palette.success;
        break;
      case 'Active':
        palette = theme.palette.primary;
        break;
      case 'Planning':
        palette = theme.palette.info;
        break;
      case 'On Hold':
        palette = theme.palette.warning;
        break;
      case 'Cancelled':
        palette = theme.palette.error;
        break;
      default:
        palette = theme.palette.primary;
    }
    
    return {
      bgcolor: palette.light,
      color: palette.dark,
      fontWeight: 600,
      '&:hover': {
        bgcolor: palette.main,
        color: palette.contrastText,
      }
    };
  };

  // Progress indicator component
  const ProgressIndicator = ({ label, value, color }) => (
    <Stack spacing={1.5}>
      <Box sx={styles.flexBetween}>
        <Box sx={{ ...styles.flexCenter, gap: 1 }}>
          <Box sx={{ ...styles.colorDot, bgcolor: theme.palette[color].main }} />
          <Typography variant="body2" fontWeight={500}>{label}</Typography>
        </Box>
        <Typography variant="body2" fontWeight={700} color={theme.palette[color].main}>
          {value}%
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={value}
        sx={{ 
          ...styles.progressBar,
          '& .MuiLinearProgress-bar': {
            ...styles.progressBar['& .MuiLinearProgress-bar'],
            backgroundColor: theme.palette[color].main
          }
        }}
      />
    </Stack>
  );


  // Calculate project duration and days left
  const today = new Date();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const projectStartDate = getProjectStartDate();
  const projectEndDate = getProjectEndDate();
  
  const projectDuration = (projectStartDate && projectEndDate)
    ? Math.max(1, Math.ceil((new Date(projectEndDate) - new Date(projectStartDate)) / millisecondsPerDay))
    : 30; // Default to 30 days if no dates are available, ignore project.duration field
    
  const daysLeft = projectEndDate 
    ? Math.ceil((new Date(projectEndDate) - today) / millisecondsPerDay)
    : 0;

  // Get calculated progress metrics
  const progressMetrics = calculateProjectProgress();

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12}>
        <Grid container sx={{ boxShadow: theme.shadows[4] }}>
          <Grid
            item
            xs={12}
            md={8}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${theme.palette.grey[200]} 100%)`,
              position: 'relative',
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 0,
              overflow: 'hidden',
              minHeight: 300
            }}
          >
            <Stack spacing={3} height="100%" justifyContent="space-between">
              {/* Header Section */}
              <Box>
                <Box sx={{ ...styles.flexBetween, gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ ...styles.flexCenter, gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h3" color="text.primary" fontWeight={700} sx={{ letterSpacing: '-0.5px' }}>
                      {project.title}
                    </Typography>
                    {project.training_recipient && (
                      <Chip 
                        label={`for ${project.training_recipient.name}`}
                        size="medium"
                        variant="outlined"
                        sx={{ 
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                          borderColor: theme.palette.divider,
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: 'rgba(0,0,0,0.04)'
                          }
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ ...styles.flexCenter, gap: 1.5, flexWrap: 'wrap' }}>
                    <Chip 
                      label={project.projectStatus || 'Active'} 
                      size="small"
                      onClick={handleStatusMenuOpen}
                      sx={{
                        ...getStatusChipStyles(project.projectStatus),
                        cursor: 'pointer',
                        '&:hover': {
                          ...getStatusChipStyles(project.projectStatus)['&:hover'],
                          transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    />
                    <Menu
                      anchorEl={statusMenuAnchor}
                      open={statusMenuOpen}
                      onClose={handleStatusMenuClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                      }}
                    >
                      {projectStatuses.map((status) => (
                        <MenuItem 
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          selected={status === (project.projectStatus || 'Active')}
                        >
                          {status}
                        </MenuItem>
                      ))}
                    </Menu>
                    <Chip 
                      label={`${projectDuration} days`} 
                      size="small"
                      sx={getStatusChipStyles('Completed')}
                    />
                  </Box>
                </Box>
                
                {/* Date Section */}
                <Box sx={{ 
                  ...styles.flexBetween,
                  gap: 2, 
                  mb: 2, 
                  flexWrap: 'wrap'
                }}>
                  <Box sx={{ 
                    ...styles.flexCenter,
                    gap: 2,
                    p: 1.5,
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 1,
                    boxShadow: 1
                  }}>
                    <Box sx={{ ...styles.flexCenter, gap: 1 }}>
                      <CalendarOutlined style={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography variant="body1" color="text.primary" fontWeight={500}>
                        {formatDate(getProjectStartDate()) || 'TBD'}
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>—</Typography>
                    <Box sx={{ ...styles.flexCenter, gap: 1 }}>
                      <CalendarOutlined style={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography variant="body1" color="text.primary" fontWeight={500}>
                        {formatDate(getProjectEndDate()) || 'TBD'}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Lead: {getMainInstructor()}
                  </Typography>
                </Box>
              </Box>
              
              {/* Footer Section */}
              <Box>
                <Stack spacing={2}>
                  <Box sx={{ ...styles.flexBetween, gap: 3 }}>
                    {/* Project Stats */}
                    <Box sx={{ ...styles.flexCenter, gap: 3 }}>
                      <Box sx={styles.statBox}>
                        <Typography variant="h6" color="text.primary" fontWeight={700}>
                          {participants}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Participants
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem sx={{ bgcolor: theme.palette.divider }} />
                      <Box sx={styles.statBox}>
                        <Typography variant="h6" color="text.primary" fontWeight={700}>
                          {project.events?.length || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sessions
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem sx={{ bgcolor: theme.palette.divider }} />
                      <Box sx={styles.statBox}>
                        <Typography variant="h6" color="text.primary" fontWeight={700}>
                          {project.groups?.length || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Groups
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Progress Text */}
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" color="text.primary" fontWeight={600}>
                        {Math.round(progressMetrics.overall)}% Complete
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {daysLeft > 0 
                          ? `${daysLeft} days left` 
                          : getProjectStartDate() && getProjectEndDate() 
                            ? `${Math.round(calculateTimeElapsed(getProjectStartDate(), getProjectEndDate()))}% elapsed`
                            : 'Timeline TBD'
                        }
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Progress Bar */}
                  <LinearProgress 
                    variant="determinate" 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: theme.palette.action.hover,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.success.main,
                        borderRadius: 5,
                      }
                    }}
                    value={progressMetrics.overall} 
                  />
                </Stack>
              </Box>
              
              {/* Background Decoration */}
              <Box sx={{ 
                position: 'absolute', 
                bottom: -40, 
                right: -40, 
                opacity: 0.08,
                transform: 'rotate(-15deg)'
              }}>
                <DashboardOutlined style={{ fontSize: '200px', color: theme.palette.text.primary }} />
              </Box>
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            <MainCard 
              sx={{ 
                borderRadius: 0,
                height: '100%', 
                mt: { xs: 2, md: 0 },
                p: 3,
                minHeight: 300,
                bgcolor: theme.palette.grey[100],
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Stack spacing={3} height="100%">
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight={600} color="text.primary">
                    Progress Analytics
                  </Typography>
                  <Divider />
                </Box>
                
                {/* Progress Breakdown */}
                <Box sx={{ flex: 1 }}>
                  <Stack spacing={3}>
                    <ProgressIndicator 
                      label="Passing Rate" 
                      value={Math.round(progressMetrics.learning)} 
                      color="primary" 
                    />
                    <ProgressIndicator 
                      label="Technical Setup" 
                      value={Math.round(progressMetrics.technical)} 
                      color="success" 
                    />
                    <ProgressIndicator 
                      label="Attendance Rate" 
                      value={Math.round(progressMetrics.attendance)} 
                      color="warning" 
                    />
                  </Stack>
                </Box>
              </Stack>
            </MainCard>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

ProjectDashboard.propTypes = {
  project: PropTypes.object.isRequired,
  participants: PropTypes.number.isRequired,
  checklistItems: PropTypes.array.isRequired,
  styles: PropTypes.object.isRequired
};

export default ProjectDashboard;