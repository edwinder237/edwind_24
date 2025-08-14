import { useState, useEffect } from 'react';
import { Grid, Typography, Paper, Box, Alert, CircularProgress, Stack, Button } from '@mui/material';
import { CalendarOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import GanttChart from 'components/GanttChart';
import InstructorAvailability from 'components/InstructorAvailability';

// redux
import { useDispatch, useSelector } from 'store';
import { getProjects } from 'store/reducers/projects';

// ==============================|| PROJECTS TIMELINE ||============================== //

const ProjectsTimeline = () => {
  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector((state) => state.projects);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLocalError(null);
        await dispatch(getProjects());
      } catch (err) {
        setLocalError('Failed to load projects for timeline view.');
        console.error('Error fetching projects:', err);
      }
    };

    fetchProjects();
  }, [dispatch]);

  const handleProjectUpdate = (updatedProjects) => {
    // Handle project reordering or updates
    console.log('Projects updated:', updatedProjects);
    // You can dispatch an action here to update the project order in the backend
  };

  const handleRefresh = () => {
    dispatch(getProjects());
  };

  // Filter projects with valid dates for timeline
  const timelineProjects = Array.isArray(projects) 
    ? projects.filter(project => 
        project && 
        typeof project === 'object' && 
        !project.error &&
        project.project_settings &&
        (project.project_settings.startDate || project.project_settings.endDate)
      ).map(project => ({
        ...project,
        // Map the dates from project_settings to the main project object for compatibility
        startDate: project.project_settings?.startDate,
        endDate: project.project_settings?.endDate
      }))
    : [];

  const hasError = localError || 
    (typeof error === 'string' ? error : null) || 
    (projects && typeof projects === 'object' && projects.error && typeof projects.error === 'string' ? projects.error : null);

  if (loading) {
    return (
      <Page title="Projects Timeline">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={40} />
            <Typography variant="body2">Loading projects timeline...</Typography>
          </Stack>
        </Box>
      </Page>
    );
  }

  if (hasError) {
    return (
      <Page title="Projects Timeline">
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRefresh}
              startIcon={<ReloadOutlined />}
            >
              Retry
            </Button>
          }
        >
          {hasError}
        </Alert>
      </Page>
    );
  }

  return (
    <Page title="Projects Timeline">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {timelineProjects.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ mb: 2 }}>
                <CalendarOutlined style={{ fontSize: '48px', color: '#1976d2' }} />
              </Box>
              <Typography variant="h5" gutterBottom>
                No Timeline Data Available
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Projects need start and end dates to appear in the timeline view.
                Create projects with proper dates to see them on the Gantt chart.
              </Typography>
              <Button
                variant="contained"
                startIcon={<PlusOutlined />}
                onClick={() => window.location.href = '/projects'}
              >
                Go to Projects
              </Button>
            </Paper>
          ) : (
            <Box>
              {/* Header */}
              <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h4" gutterBottom>
                      Projects Timeline
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Interactive Gantt chart showing {timelineProjects.length} project{timelineProjects.length !== 1 ? 's' : ''} with timeline data
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      startIcon={<ReloadOutlined />}
                      onClick={handleRefresh}
                      disabled={loading}
                    >
                      Refresh
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<PlusOutlined />}
                      onClick={() => window.location.href = '/projects'}
                    >
                      Manage Projects
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              {/* Gantt Chart */}
              <GanttChart 
                projects={timelineProjects}
                onProjectUpdate={handleProjectUpdate}
                height={600}
              />
            </Box>
          )}
        </Grid>
        
        {/* Instructor Availability Section */}
        {timelineProjects.length > 0 && (
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
              <Typography variant="h5" gutterBottom>
                Instructor Availability
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View instructor schedules and availability across all projects
              </Typography>
              <InstructorAvailability 
                projectId={timelineProjects[0]?.id} // Use first project's ID, or make this configurable
                viewMode="week"
                height={400}
                showFilters={true}
              />
            </Paper>
          </Grid>
        )}
      </Grid>
    </Page>
  );
};

ProjectsTimeline.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ProjectsTimeline;