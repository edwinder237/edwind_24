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







// Recent activity component
const RecentActivity = ({ project }) => (
  <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
    <Stack direction="row" alignItems="center" justifyContent="between" mb={3}>
      <Typography variant="h6" fontWeight="bold">Recent Activity</Typography>
      <Button size="small" endIcon={<Visibility />}>View All</Button>
    </Stack>
    
    <List sx={{ py: 0 }}>
      <ListItem sx={{ px: 0 }}>
        <ListItemIcon>
          <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
            <CheckCircle fontSize="small" />
          </Avatar>
        </ListItemIcon>
        <ListItemText
          primary="JavaScript Fundamentals - Session 1 completed"
          secondary="2 hours ago • 18 participants attended"
        />
      </ListItem>
      <Divider sx={{ my: 1 }} />
      
      <ListItem sx={{ px: 0 }}>
        <ListItemIcon>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <EventNote fontSize="small" />
          </Avatar>
        </ListItemIcon>
        <ListItemText
          primary="New event scheduled: UI/UX Workshop"
          secondary="5 hours ago • Tomorrow at 2:00 PM"
        />
      </ListItem>
      <Divider sx={{ my: 1 }} />
      
      <ListItem sx={{ px: 0 }}>
        <ListItemIcon>
          <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
            <Groups fontSize="small" />
          </Avatar>
        </ListItemIcon>
        <ListItemText
          primary="3 new participants added to Frontend Group"
          secondary="1 day ago • Alice Johnson, Bob Smith, Carol Davis"
        />
      </ListItem>
    </List>
  </Paper>
);

// Attendance Chart Component
const AttendanceChart = () => {
  const [value, setValue] = useState('week');
  
  const status = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  return (
    <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
      <Grid container alignItems="center" justifyContent="space-between" mb={3}>
        <Grid item>
          <Typography variant="h6" fontWeight="bold">Session Attendance</Typography>
        </Grid>
        <Grid item>
          <TextField
            id="attendance-period-select"
            size="small"
            select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.875rem' } }}
          >
            {status.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
      
      <ChartWrapper
        options={{
          chart: {
            type: 'bar',
            height: 300,
            toolbar: { show: false },
            background: 'transparent'
          },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '55%',
              endingShape: 'rounded'
            }
          },
          dataLabels: { enabled: false },
          stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
          },
          xaxis: {
            categories: ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5'],
            title: { text: 'Sessions' },
            labels: {
              style: {
                colors: '#666'
              }
            }
          },
          yaxis: {
            title: { text: 'Participants' },
            labels: {
              style: {
                colors: '#666'
              }
            }
          },
          fill: { 
            opacity: 1,
            colors: ['#2196F3', '#4CAF50']
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
          tooltip: {
            shared: true,
            intersect: false,
            theme: 'dark',
            style: {
              fontSize: '12px'
            },
            custom: function({series, seriesIndex, dataPointIndex, w}) {
              const scheduled = series[0][dataPointIndex];
              const attended = series[1][dataPointIndex];
              const sessionName = w.globals.labels[dataPointIndex];
              
              return `
                <div style="background: rgba(0,0,0,0.8); color: white; padding: 12px; border-radius: 6px; font-size: 12px;">
                  <div style="font-weight: bold; margin-bottom: 8px;">${sessionName}</div>
                  <div style="margin-bottom: 4px;">
                    <span style="color: #2196F3;">●</span> Scheduled: ${scheduled} participants
                  </div>
                  <div>
                    <span style="color: #4CAF50;">●</span> Attended: ${attended} participants
                  </div>
                  <div style="margin-top: 4px; font-size: 11px; opacity: 0.8;">
                    Attendance Rate: ${Math.round((attended/scheduled) * 100)}%
                  </div>
                </div>
              `;
            }
          },
          colors: ['#2196F3', '#4CAF50'],
          legend: {
            position: 'top',
            horizontalAlign: 'right',
            labels: {
              colors: '#666'
            }
          },
          grid: {
            borderColor: '#f1f1f1'
          }
        }}
        series={[
          {
            name: 'Scheduled',
            data: [20, 18, 22, 19, 21]
          },
          {
            name: 'Attended',
            data: [18, 16, 20, 17, 19]
          }
        ]}
        type="bar"
        height={300}
      />
    </Paper>
  );
};

// Upcoming events component
const UpcomingEvents = () => (
  <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
      <Typography variant="h6" fontWeight="bold">Upcoming Events</Typography>
      <Button size="small" endIcon={<PlayArrow />}>Schedule</Button>
    </Stack>
    
    <Stack spacing={2}>
      <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle2" fontWeight="bold">Leadership Workshop - Session 2</Typography>
          <Chip label="Tomorrow" size="small" color="primary" />
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={1}>
          2:00 PM - 5:00 PM • Executive Conference Room
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label="5 participants" size="small" variant="outlined" />
          <Chip label="Michael Chen" size="small" variant="outlined" />
        </Stack>
      </Box>
      
      <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle2" fontWeight="bold">JavaScript Functions Deep Dive</Typography>
          <Chip label="Monday" size="small" color="success" />
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={1}>
          9:00 AM - 12:00 PM • Classroom A
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label="12 participants" size="small" variant="outlined" />
          <Chip label="Sarah Martinez" size="small" variant="outlined" />
        </Stack>
      </Box>
    </Stack>
  </Paper>
);


const ModernOverviewTab = () => {
  const { singleProject: project } = useSelector((state) => state.projects);

  return (
    <Box sx={{ p: 3 }}>


      {/* Main Content Grid */}
      <Grid container spacing={3}>

        {/* First Row - Upcoming Events and Recent Activity */}
        <Grid item xs={12} md={6}>
          <UpcomingEvents />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <RecentActivity project={project} />
        </Grid>

        {/* Second Row - Attendance Chart */}
        <Grid item xs={12}>
          <AttendanceChart />
        </Grid>

        {/* Third Row - Alerts & Notifications */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>Alerts & Notifications</Typography>
            <Stack spacing={2}>
              <Alert severity="warning" variant="outlined">
                <Typography variant="body2">
                  3 participants have missed 2+ consecutive sessions
                </Typography>
              </Alert>
              <Alert severity="info" variant="outlined">
                <Typography variant="body2">
                  Weekly progress report is ready for review
                </Typography>
              </Alert>
              <Alert severity="success" variant="outlined">
                <Typography variant="body2">
                  All assignments submitted on time this week
                </Typography>
              </Alert>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

    </Box>
  );
};

export default ModernOverviewTab;