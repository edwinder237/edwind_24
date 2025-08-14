import { useState, useEffect } from 'react';
import { Grid, Typography, Paper, Box, Stack, MenuItem, Select, TextField } from '@mui/material';
import { DashboardOutlined, ProjectOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// project import
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import AnalyticsDataCard from 'components/cards/statistics/AnalyticsDataCard';
import UsersCardChart from 'sections/dashboard/analytics/UsersCardChart';
import OrdersCardChart from 'sections/dashboard/analytics/OrdersCardChart';
import SalesCardChart from 'sections/dashboard/analytics/SalesCardChart';
import MarketingCardChart from 'sections/dashboard/analytics/MarketingCardChart';
import IncomeChart from 'sections/dashboard/analytics/IncomeChart';
import ReportChart from 'sections/dashboard/analytics/ReportChart';

// ==============================|| PROJECT MANAGER DASHBOARD ||============================== //

const ProjectManagerDashboard = () => {
  const [slot, setSlot] = useState('week');
  const [quantity, setQuantity] = useState('By volume');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleQuantity = (e) => {
    setQuantity(e.target.value);
  };

  useEffect(() => {
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
  }, [startDate, endDate]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Page title="Project Manager Dashboard">
        <Grid container spacing={3}>
          {/* Header Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center', mb: 2 }}>
              <Box sx={{ mb: 2 }}>
                <DashboardOutlined style={{ fontSize: '48px', color: '#1976d2' }} />
              </Box>
              <Typography variant="h4" gutterBottom>
                Project Manager Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor projects, resources, and training progress
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => {
                    setStartDate(newValue);
                  }}
                  renderInput={(params) => <TextField {...params} />}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => {
                    setEndDate(newValue);
                  }}
                  renderInput={(params) => <TextField {...params} />}
                />
              </Stack>
            </Paper>
          </Grid>

          {/* KPI Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <AnalyticsDataCard title="Active Projects" count="24" percentage={15.2}>
              <UsersCardChart />
            </AnalyticsDataCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnalyticsDataCard title="Total Participants" count="1,247" percentage={8.7}>
              <OrdersCardChart />
            </AnalyticsDataCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnalyticsDataCard title="Training Hours" count="3,456" percentage={23.1}>
              <SalesCardChart />
            </AnalyticsDataCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnalyticsDataCard title="Completion Rate" count="89.5%" percentage={5.3}>
              <MarketingCardChart />
            </AnalyticsDataCard>
          </Grid>

          {/* Charts Section */}
          <Grid item xs={12} md={8}>
            <MainCard content={false}>
              <Box sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h5">Project Progress Overview</Typography>
                  <Select value={quantity} onChange={handleQuantity} size="small">
                    <MenuItem value="By volume">By Progress</MenuItem>
                    <MenuItem value="By margin">By Timeline</MenuItem>
                    <MenuItem value="By sales">By Budget</MenuItem>
                  </Select>
                </Stack>
              </Box>
              <Box sx={{ pt: 1 }}>
                <IncomeChart slot={slot} quantity={quantity} />
              </Box>
            </MainCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <MainCard content={false}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>Project Analytics</Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Projects On Track</Typography>
                    <Typography variant="h6" color="success.main">18</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Behind Schedule</Typography>
                    <Typography variant="h6" color="warning.main">4</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Critical Issues</Typography>
                    <Typography variant="h6" color="error.main">2</Typography>
                  </Box>
                </Stack>
              </Box>
              <ReportChart />
            </MainCard>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <MainCard>
              <Typography variant="h5" sx={{ mb: 2 }}>Recent Activity</Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ProjectOutlined style={{ color: '#1976d2' }} />
                  <Box>
                    <Typography variant="body2">New project "Web Development Training" created</Typography>
                    <Typography variant="caption" color="text.secondary">2 hours ago</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TeamOutlined style={{ color: '#1976d2' }} />
                  <Box>
                    <Typography variant="body2">15 participants enrolled in "React Fundamentals"</Typography>
                    <Typography variant="caption" color="text.secondary">4 hours ago</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarOutlined style={{ color: '#1976d2' }} />
                  <Box>
                    <Typography variant="body2">Training session completed for "Database Design"</Typography>
                    <Typography variant="caption" color="text.secondary">1 day ago</Typography>
                  </Box>
                </Box>
              </Stack>
            </MainCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <MainCard>
              <Typography variant="h5" sx={{ mb: 2 }}>Upcoming Deadlines</Typography>
              <Stack spacing={2}>
                <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">Project Alpha - Final Review</Typography>
                  <Typography variant="caption" color="error.main">Due in 2 days</Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">Training Materials Update</Typography>
                  <Typography variant="caption" color="warning.main">Due in 1 week</Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">Quarterly Assessment</Typography>
                  <Typography variant="caption" color="success.main">Due in 3 weeks</Typography>
                </Box>
              </Stack>
            </MainCard>
          </Grid>
        </Grid>
      </Page>
    </LocalizationProvider>
  );
};

ProjectManagerDashboard.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ProjectManagerDashboard;