import React, { useState } from 'react';
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
  AvatarGroup
} from '@mui/material';
import { selectAllParticipants } from 'store/entities/participantsSlice';
import {
  Groups,
  EventNote,
  CheckCircle,
  PlayArrow,
  Edit,
  Visibility,
  Analytics,
  Close
} from '@mui/icons-material';
import { useSelector } from 'store';
import MainCard from 'components/MainCard';
import ChartWrapper from 'components/ChartWrapper';
import DailyNotes from './DailyNotes';
import SessionNotes from './SessionNotes';
import LearningObjectives from './LearningObjectives';
import { derivedSelectors } from 'store/selectors';




const ModernOverviewTab = () => {
  // Use normalized participants store instead of old Redux
  const participants = useSelector(selectAllParticipants);
  const hasParticipants = participants && participants.length > 0;

  // Get project info from agenda store (CQRS architecture)
  const project = useSelector((state) => state.projectAgenda?.projectInfo);

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
      )}

      {/* Main Content Grid */}
      <Grid container spacing={3}>

        {/* First Row - Daily Notes (3/4) and Alerts & Recommendations (1/4) */}
        <Grid item xs={12} md={9}>
          <DailyNotes project={project} />
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, bgcolor: 'background.paper', height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Alerts & Recommendations
            </Typography>
            <Stack spacing={2}>
              {dashboardOverview?.alerts?.map((alert, index) => (
                <Alert
                  key={`alert-${index}`}
                  severity={alert.type}
                  variant="outlined"
                  sx={{ py: 0.5 }}
                >
                  <Typography variant="caption" fontWeight={600} display="block">
                    {alert.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {alert.message}
                  </Typography>
                </Alert>
              ))}

              {projectHealth?.recommendations?.map((rec, index) => (
                <Alert
                  key={`rec-${index}`}
                  severity="info"
                  variant="outlined"
                  sx={{ py: 0.5 }}
                >
                  <Typography variant="caption">{rec}</Typography>
                </Alert>
              ))}

              {(!dashboardOverview?.alerts?.length && !projectHealth?.recommendations?.length) && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    All systems running smoothly
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    No alerts at this time
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Second Row - Session Notes (Full Width) */}
        <Grid item xs={12}>
          <SessionNotes project={project} />
        </Grid>

        {/* Third Row - Learning Objectives (Full Width) */}
        <Grid item xs={12}>
          <LearningObjectives project={project} />
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