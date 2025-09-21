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
  Grid,
  Button
} from '@mui/material';
import {
  PieChart,
  AccountCircle,
  SupervisorAccount,
  BusinessCenter,
  Group,
  TrendingUp,
  PersonAddAlt1,
  Upload
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useSelector, useDispatch } from 'store';
import { openDrawer } from 'store/reducers/menu';
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
  const dispatch = useDispatch();
  const { project_participants } = useSelector((state) => state.projects);
  
  // Check if there are actual participants
  const hasParticipants = project_participants && project_participants.length > 0;
  
  // Use mock data for demo or real participant data
  const roleData = hasParticipants ? generateRoleDistribution() : [];
  const totalParticipants = hasParticipants ? roleData.reduce((sum, role) => sum + role.count, 0) : 0;
  
  const handleOpenParticipantDrawer = () => {
    // Trigger the participant drawer opening
    const participantButton = document.querySelector('[aria-label="participants management"]');
    if (participantButton) {
      participantButton.click();
    }
  };

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
        {hasParticipants && (
          <Chip 
            label={`${totalParticipants} total`} 
            size="small" 
            color="primary"
            variant="outlined"
          />
        )}
      </Stack>

      {!hasParticipants ? (
        // Empty state with prominent call to action
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 350,
            py: 4
          }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              bgcolor: 'primary.50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3
            }}
          >
            <Group sx={{ fontSize: 60, color: 'primary.main' }} />
          </Box>
          <Typography variant="h5" fontWeight="600" gutterBottom>
            No Participants Yet
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            textAlign="center" 
            sx={{ maxWidth: 400, mb: 4 }}
          >
            Start building your training project by adding participants. You can add them individually or import multiple participants at once.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PersonAddAlt1 />}
              onClick={handleOpenParticipantDrawer}
              sx={{ px: 3 }}
            >
              Add Participants
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Upload />}
              onClick={handleOpenParticipantDrawer}
              sx={{ px: 3 }}
            >
              Import CSV
            </Button>
          </Stack>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 3, textAlign: 'center' }}
          >
            Tip: You can also use the team icon in the top navigation to manage participants
          </Typography>
        </Box>
      ) : (
        <Box>
          {/* Pie Chart */}
          <Box sx={{ position: 'relative', height: 300, mb: 3 }}>
            <ChartWrapper
              options={chartOptions}
              series={chartSeries}
              type="pie"
              height={300}
            />
          </Box>

          {/* Role Breakdown Below Chart */}
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
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default RoleDistributionChart;