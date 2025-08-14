import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { CalendarOutlined } from '@ant-design/icons';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import InstructorAvailability from 'components/InstructorAvailability';

// redux
import { useDispatch, useSelector } from 'store';
import { getProjects } from 'store/reducers/projects';

// ==============================|| INSTRUCTOR AVAILABILITY PAGE ||============================== //

const InstructorAvailabilityPage = () => {
  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector((state) => state.projects);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLocalError(null);
        await dispatch(getProjects());
      } catch (err) {
        setLocalError('Failed to load projects.');
        console.error('Error fetching projects:', err);
      }
    };

    fetchProjects();
  }, [dispatch]);

  // Filter projects with valid data
  const validProjects = Array.isArray(projects) 
    ? projects.filter(project => 
        project && 
        typeof project === 'object' && 
        !project.error &&
        project.id
      )
    : [];

  const hasError = localError || 
    (typeof error === 'string' ? error : null) || 
    (projects && typeof projects === 'object' && projects.error && typeof projects.error === 'string' ? projects.error : null);

  if (loading) {
    return (
      <Page title="Instructor Availability">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={40} />
            <Typography variant="body2">Loading instructor availability...</Typography>
          </Stack>
        </Box>
      </Page>
    );
  }

  if (hasError) {
    return (
      <Page title="Instructor Availability">
        <Alert severity="error" sx={{ mb: 3 }}>
          {hasError}
        </Alert>
      </Page>
    );
  }

  return (
    <Page title="Instructor Availability">
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Instructor Availability
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor instructor schedules and availability across all projects
            </Typography>
          </Box>
          
          {validProjects.length > 0 && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Project Filter</InputLabel>
              <Select
                value={selectedProjectId}
                label="Project Filter"
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <MenuItem value="all">All Projects</MenuItem>
                {validProjects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </Paper>

      {/* Instructor Availability Component */}
      {validProjects.length > 0 ? (
        <InstructorAvailability 
          projectId={selectedProjectId === 'all' ? validProjects[0]?.id : selectedProjectId}
          viewMode="week"
          height={600}
          showFilters={true}
        />
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 2 }}>
            <CalendarOutlined style={{ fontSize: '48px', color: '#1976d2' }} />
          </Box>
          <Typography variant="h5" gutterBottom>
            No Projects Available
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create projects to view instructor availability and schedules.
          </Typography>
        </Paper>
      )}
    </Page>
  );
};

InstructorAvailabilityPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default InstructorAvailabilityPage;