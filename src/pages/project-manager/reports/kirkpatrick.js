import React, { useState, useMemo } from 'react';
import {
  Grid,
  Typography,
  Box,
  Stack,
  Card,
  Chip,
  Alert,
  TextField,
  MenuItem,
  Button,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  IconButton
} from '@mui/material';
import { Download, Refresh, FilterList } from '@mui/icons-material';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import { useGetCurriculumsQuery } from 'store/api/projectApi';

// ==============================|| KIRKPATRICK MODEL ANALYTICS ||============================== //

// Kirkpatrick Level definitions
const kirkpatrickLevels = [
  { level: 1, name: 'Reaction', color: '#5c6bc0' },
  { level: 2, name: 'Learning', color: '#66bb6a' },
  { level: 3, name: 'Behavior', color: '#ffa726' },
  { level: 4, name: 'Results', color: '#ab47bc' }
];

// Sample data - in production this would come from API
const sampleData = {
  overall: {
    level1: 85,
    level2: 78,
    level3: 62,
    level4: 45
  },
  byProject: [
    { id: 1, name: 'Sales Training Q1', instructor: 'John Smith', recipient: 'Sales Team', startDate: '2025-01-15', endDate: '2025-03-15', level1: 92, level2: 85, level3: 70, level4: 55, participants: 45 },
    { id: 2, name: 'Leadership Development', instructor: 'Sarah Johnson', recipient: 'Management', startDate: '2025-02-01', endDate: '2025-04-30', level1: 88, level2: 82, level3: 65, level4: 48, participants: 20 },
    { id: 3, name: 'Technical Certification', instructor: 'Michael Chen', recipient: 'Engineering', startDate: '2025-01-10', endDate: '2025-02-28', level1: 78, level2: 90, level3: 72, level4: 60, participants: 35 },
    { id: 4, name: 'Onboarding Program', instructor: 'John Smith', recipient: 'New Hires', startDate: '2025-03-01', endDate: '2025-03-31', level1: 95, level2: 75, level3: 55, level4: 40, participants: 60 }
  ],
  trends: {
    level1: [80, 82, 84, 85, 85],
    level2: [70, 73, 75, 77, 78],
    level3: [50, 54, 58, 60, 62],
    level4: [35, 38, 40, 43, 45]
  }
};

const TrainingEffectivenessDashboard = ({ levels, scores, overallScore }) => {
  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header with overall score */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h2" fontWeight="bold" color="primary">
            {overallScore}%
          </Typography>
          <Box>
            <Typography variant="h6">Overall Training Effectiveness</Typography>
            <Typography variant="body2" color="text.secondary">
              Weighted score across all Kirkpatrick levels
            </Typography>
          </Box>
        </Stack>

        {/* Level scores in a row */}
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
          {levels.map((level) => {
            const score = scores[`level${level.level}`];
            return (
              <Box
                key={level.level}
                sx={{
                  flex: 1,
                  minWidth: 160,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  borderLeft: `3px solid ${level.color}`
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  L{level.level}: {level.name}
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {score}%
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
};

const ProjectComparisonTable = ({ projects }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'background.default' }}>
            <TableCell><Typography variant="caption" fontWeight="bold">Project</Typography></TableCell>
            <TableCell><Typography variant="caption" fontWeight="bold">Instructor</Typography></TableCell>
            <TableCell><Typography variant="caption" fontWeight="bold">Recipient</Typography></TableCell>
            <TableCell><Typography variant="caption" fontWeight="bold">Dates</Typography></TableCell>
            <TableCell align="center"><Typography variant="caption" fontWeight="bold">Participants</Typography></TableCell>
            <TableCell align="center">
              <Tooltip title="Reaction">
                <Typography variant="caption" fontWeight="bold" color="#5c6bc0">L1</Typography>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Learning">
                <Typography variant="caption" fontWeight="bold" color="#66bb6a">L2</Typography>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Behavior">
                <Typography variant="caption" fontWeight="bold" color="#ffa726">L3</Typography>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Results">
                <Typography variant="caption" fontWeight="bold" color="#ab47bc">L4</Typography>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {project.name}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{project.instructor}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{project.recipient}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip label={project.participants} size="small" variant="outlined" />
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="medium" color={getScoreColor(project.level1)}>
                  {project.level1}%
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="medium" color={getScoreColor(project.level2)}>
                  {project.level2}%
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="medium" color={getScoreColor(project.level3)}>
                  {project.level3}%
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="medium" color={getScoreColor(project.level4)}>
                  {project.level4}%
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const Kirkpatrick = () => {
  const [timeRange, setTimeRange] = useState('quarter');
  const [curriculum, setCurriculum] = useState('all');
  const [project, setProject] = useState('all');
  const [instructor, setInstructor] = useState('all');

  // Fetch curriculums for the filter
  const { data: curriculums = [] } = useGetCurriculumsQuery();

  // Calculate overall effectiveness score (weighted average of all levels)
  const overallScore = useMemo(() => {
    const weights = { level1: 0.15, level2: 0.25, level3: 0.30, level4: 0.30 };
    return Math.round(
      sampleData.overall.level1 * weights.level1 +
      sampleData.overall.level2 * weights.level2 +
      sampleData.overall.level3 * weights.level3 +
      sampleData.overall.level4 * weights.level4
    );
  }, []);

  return (
    <Page title="Kirkpatrick Model Analytics">
      <Grid container spacing={3}>
        {/* Training Effectiveness Dashboard */}
        <Grid item xs={12}>
          <TrainingEffectivenessDashboard
            levels={kirkpatrickLevels}
            scores={sampleData.overall}
            overallScore={overallScore}
          />
        </Grid>

        {/* Filters Section */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Stack spacing={2}>
              {/* Header Row */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <FilterList fontSize="small" color="action" />
                  <Typography variant="subtitle2" fontWeight="medium">
                    Filters
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" startIcon={<Download />} size="small">
                    Export
                  </Button>
                  <IconButton size="small" color="primary">
                    <Refresh fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>

              <Divider />

              {/* Filter Controls */}
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <TextField
                  select
                  size="small"
                  label="Curriculum"
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="all">All Curriculums</MenuItem>
                  {curriculums.map((curr) => (
                    <MenuItem key={curr.id} value={curr.id}>
                      {curr.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Project"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="all">All Projects</MenuItem>
                  {sampleData.byProject.map((proj) => (
                    <MenuItem key={proj.id} value={proj.id}>
                      {proj.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Instructor"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="all">All Instructors</MenuItem>
                  <MenuItem value="1">John Smith</MenuItem>
                  <MenuItem value="2">Sarah Johnson</MenuItem>
                  <MenuItem value="3">Michael Chen</MenuItem>
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Time Range"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="quarter">This Quarter</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </TextField>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        {/* Project Comparison */}
        <Grid item xs={12}>
          <MainCard
            title="Project Comparison"
            secondary={
              <Chip
                label={`${sampleData.byProject.length} Projects`}
                size="small"
                color="primary"
                variant="outlined"
              />
            }
          >
            <ProjectComparisonTable projects={sampleData.byProject} />
          </MainCard>
        </Grid>

        {/* Insights & Recommendations */}
        <Grid item xs={12} md={6}>
          <MainCard title="Key Insights">
            <Stack spacing={2}>
              <Alert severity="success" sx={{ py: 0.5 }}>
                <Typography variant="body2">
                  <strong>Level 1 (Reaction):</strong> Consistently high satisfaction scores (85%+) indicate engaging training content.
                </Typography>
              </Alert>
              <Alert severity="warning" sx={{ py: 0.5 }}>
                <Typography variant="body2">
                  <strong>Level 3 (Behavior):</strong> Gap between learning and behavior suggests need for better transfer support.
                </Typography>
              </Alert>
              <Alert severity="info" sx={{ py: 0.5 }}>
                <Typography variant="body2">
                  <strong>Level 4 (Results):</strong> Technical Certification shows highest ROI correlation with business outcomes.
                </Typography>
              </Alert>
            </Stack>
          </MainCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <MainCard title="Recommendations">
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Improve Learning Transfer (L3)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Implement follow-up coaching sessions and manager involvement to increase behavior change application by 15-20%.
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Enhance ROI Tracking (L4)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Define clear KPIs before training and track 30/60/90 day metrics to better measure business impact.
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Standardize Assessments (L2)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create pre/post assessment framework across all programs for consistent learning measurement.
                </Typography>
              </Paper>
            </Stack>
          </MainCard>
        </Grid>
      </Grid>
    </Page>
  );
};

Kirkpatrick.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default Kirkpatrick;
