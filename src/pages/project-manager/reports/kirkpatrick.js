import React, { useState, useMemo } from 'react';
import {
  Grid,
  Typography,
  Box,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  TextField,
  MenuItem,
  Button,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  SentimentSatisfiedAlt,
  School,
  TrendingUp,
  Assessment,
  FilterList,
  Download,
  Refresh,
  Info,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import { useGetCurriculumsQuery } from 'store/api/projectApi';

// ==============================|| KIRKPATRICK MODEL ANALYTICS ||============================== //

// Kirkpatrick Level definitions
const kirkpatrickLevels = [
  {
    level: 1,
    name: 'Reaction',
    description: 'How participants felt about the training experience',
    icon: SentimentSatisfiedAlt,
    color: '#2196f3',
    metrics: ['Satisfaction Score', 'Engagement Rate', 'Net Promoter Score']
  },
  {
    level: 2,
    name: 'Learning',
    description: 'Knowledge and skills acquired during training',
    icon: School,
    color: '#4caf50',
    metrics: ['Assessment Scores', 'Skill Proficiency', 'Knowledge Retention']
  },
  {
    level: 3,
    name: 'Behavior',
    description: 'How behavior changed after returning to work',
    icon: TrendingUp,
    color: '#ff9800',
    metrics: ['Application Rate', 'Behavior Change Index', 'Manager Feedback']
  },
  {
    level: 4,
    name: 'Results',
    description: 'Business impact and return on investment',
    icon: Assessment,
    color: '#9c27b0',
    metrics: ['ROI', 'Performance Improvement', 'Business KPIs']
  }
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
    { id: 1, name: 'Sales Training Q1', level1: 92, level2: 85, level3: 70, level4: 55, participants: 45 },
    { id: 2, name: 'Leadership Development', level1: 88, level2: 82, level3: 65, level4: 48, participants: 20 },
    { id: 3, name: 'Technical Certification', level1: 78, level2: 90, level3: 72, level4: 60, participants: 35 },
    { id: 4, name: 'Onboarding Program', level1: 95, level2: 75, level3: 55, level4: 40, participants: 60 }
  ],
  trends: {
    level1: [80, 82, 84, 85, 85],
    level2: [70, 73, 75, 77, 78],
    level3: [50, 54, 58, 60, 62],
    level4: [35, 38, 40, 43, 45]
  }
};

const KirkpatrickLevelCard = ({ levelData, score, expanded, onToggle }) => {
  const Icon = levelData.icon;

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Card
      sx={{
        height: '100%',
        border: '2px solid',
        borderColor: levelData.color,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: levelData.color,
                  width: 48,
                  height: 48
                }}
              >
                <Icon />
              </Avatar>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Level {levelData.level}
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {levelData.name}
                </Typography>
              </Box>
            </Stack>
            <Chip
              label={`${score}%`}
              color={getScoreColor(score)}
              size="medium"
              sx={{ fontWeight: 'bold', fontSize: '1rem' }}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {levelData.description}
          </Typography>

          <Box>
            <LinearProgress
              variant="determinate"
              value={score}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: `${levelData.color}20`,
                '& .MuiLinearProgress-bar': {
                  bgcolor: levelData.color,
                  borderRadius: 5
                }
              }}
            />
          </Box>

          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ cursor: 'pointer' }}
              onClick={onToggle}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Key Metrics
              </Typography>
              <IconButton size="small">
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Stack>

            {expanded && (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {levelData.metrics.map((metric, idx) => (
                  <Stack
                    key={idx}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      p: 1,
                      bgcolor: 'background.default',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body2">{metric}</Typography>
                    <Typography variant="body2" fontWeight="medium" color={levelData.color}>
                      {Math.round(score + (Math.random() * 10 - 5))}%
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const ProjectComparisonTable = ({ projects }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'background.default' }}>
            <TableCell><Typography fontWeight="bold">Project</Typography></TableCell>
            <TableCell align="center"><Typography fontWeight="bold">Participants</Typography></TableCell>
            <TableCell align="center">
              <Tooltip title="Reaction">
                <Typography fontWeight="bold" color="#2196f3">L1</Typography>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Learning">
                <Typography fontWeight="bold" color="#4caf50">L2</Typography>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Behavior">
                <Typography fontWeight="bold" color="#ff9800">L3</Typography>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Results">
                <Typography fontWeight="bold" color="#9c27b0">L4</Typography>
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
              <TableCell align="center">
                <Chip label={project.participants} size="small" variant="outlined" />
              </TableCell>
              <TableCell align="center">
                <Typography fontWeight="medium" color={getScoreColor(project.level1)}>
                  {project.level1}%
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography fontWeight="medium" color={getScoreColor(project.level2)}>
                  {project.level2}%
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography fontWeight="medium" color={getScoreColor(project.level3)}>
                  {project.level3}%
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography fontWeight="medium" color={getScoreColor(project.level4)}>
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
  const [expandedLevels, setExpandedLevels] = useState({});

  // Fetch curriculums for the filter
  const { data: curriculums = [] } = useGetCurriculumsQuery();

  const toggleLevel = (level) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

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
        {/* Header */}
        <Grid item xs={12}>
          <MainCard>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
            >
              <Box>
                <Typography variant="h4" gutterBottom>
                  Kirkpatrick Model Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Evaluate training effectiveness across all four levels of the Kirkpatrick Model
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  size="small"
                  label="Curriculum"
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  sx={{ minWidth: 200 }}
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
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  size="small"
                >
                  Export
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  size="small"
                >
                  Refresh
                </Button>
              </Stack>
            </Stack>
          </MainCard>
        </Grid>

        {/* Overall Score Card */}
        <Grid item xs={12}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <CardContent>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
              >
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="h2" fontWeight="bold">
                      {overallScore}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      Overall Training Effectiveness
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Weighted score across all Kirkpatrick levels
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={4}>
                  {kirkpatrickLevels.map((level) => (
                    <Box key={level.level} sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight="bold">
                        {sampleData.overall[`level${level.level}`]}%
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        L{level.level}: {level.name}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Info Alert */}
        <Grid item xs={12}>
          <Alert
            severity="info"
            icon={<Info />}
            sx={{ '& .MuiAlert-message': { width: '100%' } }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  About the Kirkpatrick Model
                </Typography>
                <Typography variant="body2">
                  The Kirkpatrick Model evaluates training effectiveness at four levels: Reaction (satisfaction),
                  Learning (knowledge gained), Behavior (on-job application), and Results (business impact).
                </Typography>
              </Box>
            </Stack>
          </Alert>
        </Grid>

        {/* Level Cards */}
        {kirkpatrickLevels.map((levelData) => (
          <Grid item xs={12} sm={6} md={3} key={levelData.level}>
            <KirkpatrickLevelCard
              levelData={levelData}
              score={sampleData.overall[`level${levelData.level}`]}
              expanded={expandedLevels[levelData.level]}
              onToggle={() => toggleLevel(levelData.level)}
            />
          </Grid>
        ))}

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
