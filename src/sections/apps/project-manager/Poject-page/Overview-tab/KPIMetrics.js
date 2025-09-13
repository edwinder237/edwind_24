import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Stack,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  School,
  Timer,
  CheckCircle,
  Group,
  Assessment,
  EmojiEvents,
  Warning,
  Schedule
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

// Mock KPI data
const generateKPIData = () => ({
  // Primary KPIs
  primary: [
    {
      id: 1,
      title: 'Course Completion Rate',
      value: 38,
      unit: '%',
      target: 80,
      trend: 'up',
      change: '+12%',
      description: 'Participants who completed all modules',
      icon: <School />,
      color: 'primary',
      status: 'below-target'
    },
    {
      id: 2,
      title: 'Average Assessment Score',
      value: 87,
      unit: '%',
      target: 85,
      trend: 'up',
      change: '+5%',
      description: 'Mean score across all assessments',
      icon: <Assessment />,
      color: 'success',
      status: 'on-target'
    },
    {
      id: 3,
      title: 'Attendance Rate',
      value: 92,
      unit: '%',
      target: 95,
      trend: 'down',
      change: '-3%',
      description: 'Session attendance consistency',
      icon: <Group />,
      color: 'warning',
      status: 'below-target'
    },
    {
      id: 4,
      title: 'Engagement Score',
      value: 78,
      unit: '/100',
      target: 80,
      trend: 'up',
      change: '+8%',
      description: 'Participant interaction and participation',
      icon: <EmojiEvents />,
      color: 'info',
      status: 'below-target'
    }
  ],
  // Secondary KPIs
  secondary: [
    {
      id: 5,
      title: 'Time to Complete',
      value: 14.5,
      unit: 'days',
      target: 15,
      trend: 'flat',
      change: '0%',
      description: 'Average completion time per module',
      icon: <Timer />,
      color: 'success'
    },
    {
      id: 6,
      title: 'Certification Rate',
      value: 25,
      unit: '%',
      target: 70,
      trend: 'up',
      change: '+15%',
      description: 'Participants earning certification',
      icon: <CheckCircle />,
      color: 'warning'
    },
    {
      id: 7,
      title: 'Drop-out Rate',
      value: 5,
      unit: '%',
      target: 10,
      trend: 'down',
      change: '-2%',
      description: 'Participants leaving before completion',
      icon: <Warning />,
      color: 'success'
    },
    {
      id: 8,
      title: 'Session Duration',
      value: 118,
      unit: 'min',
      target: 120,
      trend: 'flat',
      change: '0%',
      description: 'Average session length',
      icon: <Schedule />,
      color: 'info'
    }
  ]
});

const KPIMetrics = ({ project }) => {
  const theme = useTheme();
  const kpiData = generateKPIData();

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up':
        return <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'down':
        return <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />;
      default:
        return <TrendingFlat sx={{ fontSize: 16, color: 'text.secondary' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'on-target':
        return 'success';
      case 'below-target':
        return 'warning';
      case 'above-target':
        return 'info';
      default:
        return 'default';
    }
  };

  const KPICard = ({ kpi, isSecondary = false }) => (
    <Card 
      sx={{ 
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: `${kpi.color}.main`,
          transform: 'translateY(-2px)',
          boxShadow: 2
        }
      }}
    >
      <CardContent sx={{ p: isSecondary ? 2 : 3 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box
            sx={{
              width: isSecondary ? 36 : 44,
              height: isSecondary ? 36 : 44,
              borderRadius: 1,
              bgcolor: alpha(theme.palette[kpi.color].main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: `${kpi.color}.main`
            }}
          >
            {kpi.icon}
          </Box>
          {!isSecondary && kpi.status && (
            <Chip 
              label={kpi.status.replace('-', ' ')}
              size="small"
              color={getStatusColor(kpi.status)}
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />
          )}
        </Stack>

        <Typography 
          variant={isSecondary ? "subtitle2" : "h4"} 
          fontWeight="bold" 
          color="text.primary"
          gutterBottom
        >
          {kpi.value}{kpi.unit}
        </Typography>

        <Typography 
          variant={isSecondary ? "caption" : "body2"} 
          color="text.secondary" 
          sx={{ mb: isSecondary ? 1 : 2 }}
        >
          {kpi.title}
        </Typography>

        {!isSecondary && (
          <>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary">
                Target: {kpi.target}{kpi.unit}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {getTrendIcon(kpi.trend)}
                <Typography 
                  variant="caption" 
                  color={kpi.trend === 'up' ? 'success.main' : kpi.trend === 'down' ? 'error.main' : 'text.secondary'}
                  fontWeight="bold"
                >
                  {kpi.change}
                </Typography>
              </Stack>
            </Stack>
            
            <LinearProgress 
              variant="determinate" 
              value={(kpi.value / kpi.target) * 100} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                bgcolor: alpha(theme.palette.grey[300], 0.3),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  bgcolor: `${kpi.color}.main`
                }
              }}
            />
          </>
        )}

        {isSecondary && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {getTrendIcon(kpi.trend)}
            <Typography 
              variant="caption" 
              color={kpi.trend === 'up' ? 'success.main' : kpi.trend === 'down' ? 'error.main' : 'text.secondary'}
              fontWeight="bold"
            >
              {kpi.change}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              vs target: {kpi.target}{kpi.unit}
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Analytics sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">Training KPIs</Typography>
        </Stack>
        <Chip 
          label="Week 1 Performance"
          size="small" 
          color="primary"
          variant="outlined"
        />
      </Stack>

      {/* Primary KPIs */}
      <Box mb={4}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
          Primary Metrics
        </Typography>
        <Grid container spacing={3}>
          {kpiData.primary.map((kpi) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.id}>
              <KPICard kpi={kpi} />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Secondary KPIs */}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
          Secondary Metrics
        </Typography>
        <Grid container spacing={2}>
          {kpiData.secondary.map((kpi) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.id}>
              <KPICard kpi={kpi} isSecondary />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Summary */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Performance Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Stack alignItems="center">
              <Typography variant="h6" color="success.main" fontWeight="bold">2</Typography>
              <Typography variant="caption" color="text.secondary">On Target</Typography>
            </Stack>
          </Grid>
          <Grid item xs={4}>
            <Stack alignItems="center">
              <Typography variant="h6" color="warning.main" fontWeight="bold">2</Typography>
              <Typography variant="caption" color="text.secondary">Needs Attention</Typography>
            </Stack>
          </Grid>
          <Grid item xs={4}>
            <Stack alignItems="center">
              <Typography variant="h6" color="error.main" fontWeight="bold">0</Typography>
              <Typography variant="caption" color="text.secondary">Critical</Typography>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default KPIMetrics;