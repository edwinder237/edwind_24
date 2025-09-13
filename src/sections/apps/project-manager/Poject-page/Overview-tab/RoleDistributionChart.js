import React from 'react';
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
  Grid
} from '@mui/material';
import {
  PieChart,
  AccountCircle,
  SupervisorAccount,
  BusinessCenter,
  Group,
  TrendingUp
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ChartWrapper from 'components/ChartWrapper';

// Mock role distribution data
const generateRoleDistribution = () => [
  {
    role: 'Sales Rep',
    count: 12,
    color: '#2196F3', // Blue
    icon: <AccountCircle />,
    percentage: 60
  },
  {
    role: 'Sales Manager',
    count: 4,
    color: '#4CAF50', // Green
    icon: <SupervisorAccount />,
    percentage: 20
  },
  {
    role: 'F&I Specialist',
    count: 3,
    color: '#FF9800', // Orange
    icon: <BusinessCenter />,
    percentage: 15
  },
  {
    role: 'Team Lead',
    count: 1,
    color: '#9C27B0', // Purple
    icon: <Group />,
    percentage: 5
  }
];

const RoleDistributionChart = ({ project }) => {
  const theme = useTheme();
  const roleData = generateRoleDistribution();
  const totalParticipants = roleData.reduce((sum, role) => sum + role.count, 0);

  // Prepare chart data
  const chartSeries = roleData.map(role => role.count);
  const chartLabels = roleData.map(role => role.role);
  const chartColors = roleData.map(role => role.color);

  const chartOptions = {
    chart: {
      type: 'pie',
      height: 300,
      toolbar: { show: false },
      background: 'transparent'
    },
    labels: chartLabels,
    colors: chartColors,
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return Math.round(val) + '%';
      },
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#fff']
      },
      dropShadow: {
        enabled: true,
        blur: 2,
        opacity: 0.8
      }
    },
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size: '0%'
        }
      }
    },
    legend: {
      show: false // We'll create custom legend
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      style: {
        fontSize: '12px'
      },
      y: {
        formatter: function (value, { seriesIndex }) {
          const role = roleData[seriesIndex];
          return `${value} participants (${role.percentage}%)`;
        }
      }
    },
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.1
        }
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: 'darken',
          value: 0.1
        }
      }
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['#ffffff']
    }
  };

  return (
    <Paper sx={{ p: 3, bgcolor: 'background.paper', height: '100%' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PieChart sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">Role Distribution</Typography>
        </Stack>
        <Chip 
          label={`${totalParticipants} total`} 
          size="small" 
          color="primary"
          variant="outlined"
        />
      </Stack>

      <Grid container spacing={3}>
        {/* Pie Chart */}
        <Grid item xs={12} md={7}>
          <Box sx={{ position: 'relative', height: 300 }}>
            <ChartWrapper
              options={chartOptions}
              series={chartSeries}
              type="pie"
              height={300}
            />
          </Box>
        </Grid>

        {/* Legend and Details */}
        <Grid item xs={12} md={5}>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
              Role Breakdown
            </Typography>
            <List sx={{ py: 0 }}>
              {roleData.map((role, index) => (
                <ListItem 
                  key={index}
                  sx={{ 
                    px: 0,
                    py: 1,
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: role.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight="500">
                          {role.role}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            {role.count}
                          </Typography>
                          <Chip 
                            label={`${role.percentage}%`}
                            size="small"
                            sx={{
                              bgcolor: role.color,
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20,
                              minWidth: 40
                            }}
                          />
                        </Stack>
                      </Stack>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {role.count === 1 ? '1 participant' : `${role.count} participants`}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            {/* Summary Stats */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Training Composition
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Most Common Role:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    Sales Rep (60%)
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Role Diversity:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {roleData.length} different roles
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Management Ratio:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    25% ({roleData.filter(r => r.role.includes('Manager') || r.role.includes('Lead')).reduce((sum, r) => sum + r.count, 0)} people)
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default RoleDistributionChart;