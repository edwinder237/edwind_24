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
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MainCard from "components/MainCard";
import { PROJECT_STATUS } from "constants";
import { useSelector, useDispatch } from "store";
import { openSnackbar } from 'store/reducers/snackbar';
import { updateProjectInfo } from 'store/reducers/project/settings';
import { CalendarOutlined, DashboardOutlined } from "@ant-design/icons";
import { derivedSelectors } from 'store/selectors';

// ==============================|| PROJECT DASHBOARD ||============================== //

const ProjectDashboard = ({ project, styles }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));
  const matchDownMD = useMediaQuery(theme.breakpoints.down('md'));

  // Use derived selectors as single source of truth (no API call needed)
  const dashboardData = useSelector(derivedSelectors.dashboard.selectCompleteDashboard);
  const attendanceSummary = useSelector(derivedSelectors.attendance.selectAttendanceSummary);

  // Use computed project data, fallback to prop
  const currentProject = dashboardData?.projectInfo || project;

  // State for status menu (must be before early return)
  const [statusMenuAnchor, setStatusMenuAnchor] = React.useState(null);
  const statusMenuOpen = Boolean(statusMenuAnchor);

  // Early return if no project data (after all hooks)
  if (!project && !dashboardData?.projectInfo) {
    return <Box sx={{ p: 3 }}><Typography>Loading project...</Typography></Box>;
  }
  
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
          projectId: currentProject?.id || project?.id,
          status: newStatus
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update projectSettings store with new status
        // This will automatically update the derived selectors
        dispatch(updateProjectInfo({
          status: data.project.projectStatus,
          projectStatus: data.project.projectStatus,
          lastUpdated: data.project.lastUpdated
        }));

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

  // Get the actual project dates - ONLY use dashboard data
  const getProjectStartDate = () => {
    // Check in order: dashboardData metrics, dashboardData projectInfo, fallback to prop
    return dashboardData?.metrics?.projectDates?.startDate ||
           dashboardData?.projectInfo?.startDate ||
           project?.startDate;
  };

  const getProjectEndDate = () => {
    // Check in order: dashboardData metrics, dashboardData projectInfo, fallback to prop
    return dashboardData?.metrics?.projectDates?.endDate ||
           dashboardData?.projectInfo?.endDate ||
           project?.endDate;
  };

  // Get the main instructor from dashboard data or fallback to project data
  const getMainInstructor = () => {
    // Use dashboard data if available
    if (dashboardData?.metrics?.projectLeadInstructor) {
      const instructor = dashboardData.metrics.projectLeadInstructor;
      return `${instructor.firstName} ${instructor.lastName}`;
    }
    
    // Fallback to project data
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

  // Get progress metrics from dashboard data
  const getProgressMetrics = () => {
    // Use attendance from derived selector
    const attendanceRate = Math.round(attendanceSummary?.attendanceRate || 0);

    // Use dashboard data if available for other metrics
    if (dashboardData?.metrics) {
      const { overallCompletion, technicalCompletion } = dashboardData.metrics;

      const learning = overallCompletion?.breakdown?.learning ?? 30;
      const technical = technicalCompletion?.completionPercentage ?? 0;

      // Calculate overall progress from learning, technical, and attendance
      const overall = (learning + technical + attendanceRate) / 3;

      return {
        overall: Math.round(overall),
        learning,
        technical,
        attendance: attendanceRate
      };
    }

    // Fallback calculation (legacy logic for when dashboard data is not available)
    const learningProgress = 30;
    const technicalSetupProgress = 0; // No checklist data available

    const projectProgress = (learningProgress + technicalSetupProgress + attendanceRate) / 3;

    return {
      overall: Math.round(projectProgress),
      learning: learningProgress,
      technical: technicalSetupProgress,
      attendance: attendanceRate
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


  // Get metrics from dashboard data or calculate fallbacks
  const getProjectMetrics = () => {
    if (dashboardData?.metrics) {
      return {
        participants: dashboardData.metrics.participantsCount || 0,
        sessions: dashboardData.metrics.sessionsCount || 0,
        groups: dashboardData.metrics.groupsCount || 0,
        duration: dashboardData.metrics.projectDates?.duration || 30
      };
    }
    
    // Fallback to project data
    return {
      participants: project?.participants?.length || 0,
      sessions: project?.events?.length || 0,
      groups: project?.groups?.length || 0,
      duration: 30
    };
  };

  // Calculate project duration and days left
  const today = new Date();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const projectStartDate = getProjectStartDate();
  const projectEndDate = getProjectEndDate();
  
  const projectMetrics = getProjectMetrics();
  const projectDuration = (projectStartDate && projectEndDate)
    ? Math.max(1, Math.ceil((new Date(projectEndDate) - new Date(projectStartDate)) / millisecondsPerDay) + 1)
    : projectMetrics.duration;
    
  const daysLeft = projectEndDate 
    ? Math.ceil((new Date(projectEndDate) - today) / millisecondsPerDay)
    : 0;

  // Get calculated progress metrics
  const progressMetrics = getProgressMetrics();

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
              p: matchDownSM ? 1.5 : { xs: 2.5, md: 3.5 },
              borderRadius: 0,
              overflow: 'hidden',
              minHeight: matchDownSM ? 'auto' : 300
            }}
          >
            <Stack spacing={matchDownSM ? 1.5 : 3} height="100%" justifyContent="space-between">
              {/* Header Section */}
              <Box>
                <Box sx={{ 
                  ...styles.flexBetween, 
                  gap: matchDownSM ? 0.5 : 2, 
                  mb: matchDownSM ? 1 : 2, 
                  flexWrap: 'wrap',
                  flexDirection: matchDownSM ? 'column' : 'row',
                  alignItems: matchDownSM ? 'flex-start' : 'center'
                }}>
                  <Box sx={{
                    ...styles.flexCenter,
                    gap: matchDownSM ? 0.5 : 2,
                    flexWrap: 'wrap',
                    flexDirection: matchDownSM ? 'column' : 'row',
                    alignItems: matchDownSM ? 'flex-start' : 'center',
                    width: matchDownSM ? '100%' : 'auto'
                  }}>
                    <Typography variant={matchDownSM ? "h6" : "h3"} color="text.primary" fontWeight={700} sx={{ letterSpacing: '-0.5px', fontSize: matchDownSM ? '1.1rem' : 'inherit' }}>
                      {project?.title || 'Loading...'}
                    </Typography>
                    {currentProject.training_recipient && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          display: matchDownSM ? 'block' : 'none',
                          mt: 0.5
                        }}
                      >
                        for {currentProject.training_recipient.name}
                      </Typography>
                    )}
                    {currentProject.training_recipient && (
                      <Chip 
                        label={`for ${currentProject.training_recipient.name}`}
                        size="medium"
                        variant="outlined"
                        component="a"
                        href={`/project-manager/training-recipients/${currentProject.training_recipient.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        clickable
                        sx={{ 
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                          borderColor: theme.palette.divider,
                          textDecoration: 'none',
                          cursor: 'pointer',
                          display: matchDownSM ? 'none' : 'inline-flex',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: 'rgba(0,0,0,0.04)',
                            transform: 'scale(1.02)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ 
                    ...styles.flexCenter, 
                    gap: 1, 
                    flexWrap: 'wrap',
                    marginTop: matchDownSM ? 0.5 : 0,
                    alignSelf: matchDownSM ? 'flex-start' : 'center'
                  }}>
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
                
                {/* Date Section - Hide on mobile */}
                {!matchDownSM && (
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
                )}
              </Box>
              
              {/* Footer Section */}
              <Box>
                <Stack spacing={matchDownSM ? 1 : 2}>
                  <Box sx={{ ...styles.flexBetween, gap: matchDownSM ? 2 : 3, flexWrap: matchDownSM ? 'wrap' : 'nowrap' }}>
                    {/* Project Stats - Hide on mobile */}
                    {!matchDownSM && (
                      <Box sx={{ ...styles.flexCenter, gap: 3 }}>
                        <Box sx={styles.statBox}>
                          <Typography variant="h6" color="text.primary" fontWeight={700}>
                            {projectMetrics.participants}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Participants
                          </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ bgcolor: theme.palette.divider }} />
                        <Box sx={styles.statBox}>
                          <Typography variant="h6" color="text.primary" fontWeight={700}>
                            {projectMetrics.sessions}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sessions
                          </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ bgcolor: theme.palette.divider }} />
                        <Box sx={styles.statBox}>
                          <Typography variant="h6" color="text.primary" fontWeight={700}>
                            {projectMetrics.groups}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Groups
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    {/* Progress Text - Hide on mobile */}
                    {!matchDownSM && (
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
                    )}
                  </Box>
                  
                  {/* Progress Bar */}
                  <LinearProgress 
                    variant="determinate" 
                    sx={{ 
                      height: matchDownSM ? 6 : 10, 
                      borderRadius: matchDownSM ? 3 : 5,
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
              
              {/* Background Decoration - Hide on mobile */}
              {!matchDownSM && (
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: -40, 
                  right: -40, 
                  opacity: 0.08,
                  transform: 'rotate(-15deg)'
                }}>
                  <DashboardOutlined style={{ fontSize: '200px', color: theme.palette.text.primary }} />
                </Box>
              )}
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
  styles: PropTypes.object.isRequired
};

export default ProjectDashboard;