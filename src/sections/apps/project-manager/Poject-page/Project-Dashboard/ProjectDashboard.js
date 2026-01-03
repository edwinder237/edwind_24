import PropTypes from 'prop-types';
import React from 'react';
import {
  Box,
  Button,
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
import { useGetProjectDashboardQuery, useGetProjectChecklistQuery, useGetProjectSettingsQuery } from 'store/api/projectApi';
import { derivedSelectors } from 'store/selectors';
import { selectProjectSettings, selectProjectInfo, selectProjectInstructors } from 'store/reducers/project/settings';

// ==============================|| PROJECT DASHBOARD ||============================== //

const ProjectDashboard = ({ project, styles }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));
  const matchDownMD = useMediaQuery(theme.breakpoints.down('md'));

  // HYBRID APPROACH: API for fast initial load + Selectors for real-time updates

  // 1. Use RTK Query for initial fast load (metadata, counts, dates)
  const {
    data: dashboardResponse,
    isLoading: dashboardLoading,
    error: dashboardError
  } = useGetProjectDashboardQuery(project?.id, {
    skip: !project?.id
  });

  // Extract dashboard data from API response
  const dashboardData = dashboardResponse?.data;

  // 2. Initialize checklist query to populate RTK cache for selectors
  useGetProjectChecklistQuery(project?.id, {
    skip: !project?.id
  });

  // 2b. Initialize project settings query to populate settings cache
  useGetProjectSettingsQuery(project?.id, {
    skip: !project?.id
  });

  // 3. Use CQRS selectors for LIVE reactive updates
  const technicalCompletion = useSelector(derivedSelectors.dashboard.selectTechnicalCompletion);
  const attendanceSummary = useSelector(derivedSelectors.attendance.selectAttendanceSummary);
  const courseCompletionRate = useSelector(derivedSelectors.dashboard.selectCourseCompletionRate);
  const dashboardOverview = useSelector(derivedSelectors.dashboard.selectDashboardOverview);

  // 4. Use settings selectors for dates and instructors (CQRS pattern)
  const projectSettings = useSelector(selectProjectSettings);
  const projectInfo = useSelector(selectProjectInfo);
  const projectInstructors = useSelector(selectProjectInstructors);

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

  // Get the actual project dates - Use CQRS settings state first
  const getProjectStartDate = () => {
    // PRIORITY 1: Project settings state (CQRS)
    if (projectSettings?.startDate) return projectSettings.startDate;

    // PRIORITY 2: Project info state (CQRS)
    if (projectInfo?.startDate) return projectInfo.startDate;

    // PRIORITY 3: Dashboard API data (fallback)
    if (dashboardData?.metrics?.projectDates?.startDate) return dashboardData.metrics.projectDates.startDate;
    if (dashboardData?.projectInfo?.startDate) return dashboardData.projectInfo.startDate;

    // PRIORITY 4: Props (last resort)
    return project?.startDate;
  };

  const getProjectEndDate = () => {
    // PRIORITY 1: Project settings state (CQRS)
    if (projectSettings?.endDate) return projectSettings.endDate;

    // PRIORITY 2: Project info state (CQRS)
    if (projectInfo?.endDate) return projectInfo.endDate;

    // PRIORITY 3: Dashboard API data (fallback)
    if (dashboardData?.metrics?.projectDates?.endDate) return dashboardData.metrics.projectDates.endDate;
    if (dashboardData?.projectInfo?.endDate) return dashboardData.projectInfo.endDate;

    // PRIORITY 4: Props (last resort)
    return project?.endDate;
  };

  // Get the lead instructor - Use CQRS settings state first
  const getMainInstructor = () => {
    // PRIORITY 1: Project instructors from settings state (CQRS)
    if (projectInstructors && projectInstructors.length > 0) {
      // Find lead instructor (instructorType: 'lead', 'main', or first instructor)
      const leadInstructor = projectInstructors.find(
        pi => pi.instructorType === 'lead' || pi.instructorType === 'main' || pi.role === 'lead' || pi.role === 'main'
      ) || projectInstructors[0];

      if (leadInstructor?.instructor) {
        const instructor = leadInstructor.instructor;
        return instructor.fullName || `${instructor.firstName} ${instructor.lastName}`;
      }
    }

    // PRIORITY 2: Dashboard API data (fallback)
    if (dashboardData?.metrics?.projectLeadInstructor) {
      const instructor = dashboardData.metrics.projectLeadInstructor;
      return `${instructor.firstName} ${instructor.lastName}`;
    }

    // PRIORITY 3: Props (last resort)
    if (project?.project_instructors && project.project_instructors.length > 0) {
      const mainInstructor = project.project_instructors.find(
        pi => pi.instructorType === 'lead' || pi.instructorType === 'main' || pi.role === 'lead' || pi.role === 'main'
      ) || project.project_instructors[0];

      if (mainInstructor?.instructor) {
        const instructor = mainInstructor.instructor;
        return `${instructor.firstName} ${instructor.lastName}`;
      }
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

  // Get progress metrics with HYBRID approach
  const getProgressMetrics = () => {
    // PRIORITY 1: Use LIVE CQRS selectors for reactive metrics
    const liveTechnical = technicalCompletion?.completionPercentage;
    const liveAttendance = Math.round(attendanceSummary?.attendanceRate || 0);
    const liveCourseCompletion = courseCompletionRate; // NEW: Real course completion from CQRS

    // PRIORITY 2: Fallback to API data for initial load
    const apiTechnical = dashboardData?.metrics?.technicalCompletion?.completionPercentage;
    const apiAttendance = dashboardData?.metrics?.attendanceRate?.attendancePercentage;
    const apiLearning = dashboardData?.metrics?.overallCompletion?.breakdown?.learning;

    // Use selectors if they have data (total items > 0), otherwise use API data
    // Check if selector has actual checklist data (not just computed 0% from empty list)
    const hasSelectorData = technicalCompletion?.totalChecklistItems > 0;
    const technical = hasSelectorData ? liveTechnical : (apiTechnical ?? 0);

    // For attendance, use selector if we have attendance data
    const hasAttendanceData = attendanceSummary?.attendanceRate !== undefined;
    const attendance = hasAttendanceData ? liveAttendance : (apiAttendance ?? 0);

    // For course completion, use selector if data exists, otherwise fallback to API
    const hasCourseCompletionData = courseCompletionRate !== undefined;
    const learning = hasCourseCompletionData ? liveCourseCompletion : (apiLearning ?? 0);

    // Calculate overall progress
    const overall = (learning + technical + attendance) / 3;

    return {
      overall: Math.round(overall),
      learning,
      technical,
      attendance
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


  // Get metrics from live selectors (primary) with API/prop fallbacks
  const getProjectMetrics = () => {
    // Use live selector data as primary source (updates in real-time when participants/events/groups change)
    const liveParticipants = dashboardOverview?.keyMetrics?.totalParticipants;
    const liveEvents = dashboardOverview?.keyMetrics?.totalEvents;
    const liveGroups = dashboardOverview?.keyMetrics?.totalGroups;

    // Fallback chain: live selector → API response → project prop → 0
    return {
      participants: liveParticipants ?? dashboardData?.metrics?.participantsCount ?? project?.participants?.length ?? 0,
      sessions: liveEvents ?? dashboardData?.metrics?.sessionsCount ?? project?.events?.length ?? 0,
      groups: liveGroups ?? dashboardData?.metrics?.groupsCount ?? project?.groups?.length ?? 0,
      duration: dashboardData?.metrics?.projectDates?.duration || 30
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
                      label="Courses Completion"
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