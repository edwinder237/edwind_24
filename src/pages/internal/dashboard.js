import { useState } from 'react';

// material-ui
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
  useTheme
} from '@mui/material';

// icons
import {
  DollarOutlined,
  TeamOutlined,
  RiseOutlined,
  FallOutlined,
  BankOutlined,
  ProjectOutlined,
  BookOutlined,
  CrownOutlined,
  StarOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';

// project imports
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';

// ==============================|| MOCK DATA ||============================== //

const mockData = {
  // Revenue metrics
  revenue: {
    mrr: 12450,
    mrrChange: 8.5,
    arr: 149400,
    arrChange: 12.3,
    avgRevenuePerOrg: 415,
    ltv: 4980
  },

  // Subscription stats
  subscriptions: {
    total: 30,
    active: 27,
    trialing: 2,
    pastDue: 1,
    canceled: 0,
    byPlan: {
      essential: 12,
      professional: 15,
      enterprise: 3
    }
  },

  // Organization stats
  organizations: {
    total: 30,
    newThisMonth: 4,
    growthRate: 15.4
  },

  // Usage stats
  usage: {
    totalProjects: 156,
    totalUsers: 892,
    totalCourses: 78,
    totalInstructors: 124,
    activeProjectsThisMonth: 42
  },

  // Recent activity
  recentSubscriptions: [
    { id: 1, org: 'Acme Corporation', plan: 'professional', status: 'active', date: '2026-01-30', amount: 49 },
    { id: 2, org: 'TechStart Inc', plan: 'enterprise', status: 'active', date: '2026-01-28', amount: 199 },
    { id: 3, org: 'Learning Hub', plan: 'essential', status: 'trialing', date: '2026-01-27', amount: 29 },
    { id: 4, org: 'Global Training Co', plan: 'professional', status: 'active', date: '2026-01-25', amount: 49 },
    { id: 5, org: 'EduFirst Academy', plan: 'professional', status: 'past_due', date: '2026-01-22', amount: 49 }
  ],

  // Top organizations by usage
  topOrganizations: [
    { name: 'Acme Corporation', projects: 24, users: 156, plan: 'professional' },
    { name: 'TechStart Inc', projects: 18, users: 89, plan: 'enterprise' },
    { name: 'Global Training Co', projects: 15, users: 72, plan: 'professional' },
    { name: 'EduFirst Academy', projects: 12, users: 64, plan: 'professional' },
    { name: 'Learning Hub', projects: 10, users: 45, plan: 'essential' }
  ],

  // Monthly trends (last 6 months)
  monthlyTrends: [
    { month: 'Aug', revenue: 8200, orgs: 18 },
    { month: 'Sep', revenue: 9100, orgs: 21 },
    { month: 'Oct', revenue: 10300, orgs: 24 },
    { month: 'Nov', revenue: 11200, orgs: 26 },
    { month: 'Dec', revenue: 11800, orgs: 28 },
    { month: 'Jan', revenue: 12450, orgs: 30 }
  ]
};

// ==============================|| METRIC CARD ||============================== //

const MetricCard = ({ title, value, change, changeLabel, icon, color = 'primary', prefix = '', suffix = '' }) => {
  const theme = useTheme();
  const isPositive = change >= 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ mb: 1 }}>
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </Typography>
            {change !== undefined && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {isPositive ? (
                  <ArrowUpOutlined style={{ color: theme.palette.success.main, fontSize: 14 }} />
                ) : (
                  <ArrowDownOutlined style={{ color: theme.palette.error.main, fontSize: 14 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{ color: isPositive ? 'success.main' : 'error.main', fontWeight: 600 }}
                >
                  {Math.abs(change)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {changeLabel || 'vs last month'}
                </Typography>
              </Stack>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette[color].main, 0.1)
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ==============================|| PLAN DISTRIBUTION ||============================== //

const PlanDistribution = ({ data }) => {
  const theme = useTheme();
  const total = data.essential + data.professional + data.enterprise;

  const plans = [
    { name: 'Essential', count: data.essential, color: theme.palette.grey[500], icon: <RocketOutlined /> },
    { name: 'Professional', count: data.professional, color: theme.palette.primary.main, icon: <StarOutlined /> },
    { name: 'Enterprise', count: data.enterprise, color: theme.palette.warning.main, icon: <CrownOutlined /> }
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3 }}>Plan Distribution</Typography>
        <Stack spacing={2}>
          {plans.map((plan) => (
            <Box key={plan.name}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ color: plan.color }}>{plan.icon}</Box>
                  <Typography variant="body2">{plan.name}</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600}>
                  {plan.count} ({Math.round((plan.count / total) * 100)}%)
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(plan.count / total) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(plan.color, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: plan.color,
                    borderRadius: 4
                  }
                }}
              />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ==============================|| SUBSCRIPTION STATUS ||============================== //

const SubscriptionStatus = ({ data }) => {
  const theme = useTheme();

  const statuses = [
    { label: 'Active', value: data.active, color: 'success', icon: <CheckCircleOutlined /> },
    { label: 'Trialing', value: data.trialing, color: 'info', icon: <ClockCircleOutlined /> },
    { label: 'Past Due', value: data.pastDue, color: 'warning', icon: <ExclamationCircleOutlined /> },
    { label: 'Canceled', value: data.canceled, color: 'error', icon: <ExclamationCircleOutlined /> }
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3 }}>Subscription Status</Typography>
        <Grid container spacing={2}>
          {statuses.map((status) => (
            <Grid item xs={6} key={status.label}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderColor: alpha(theme.palette[status.color].main, 0.3)
                }}
              >
                <Box sx={{ color: `${status.color}.main`, mb: 1 }}>
                  {status.icon}
                </Box>
                <Typography variant="h4">{status.value}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {status.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// ==============================|| RECENT SUBSCRIPTIONS TABLE ||============================== //

const RecentSubscriptionsTable = ({ subscriptions }) => {
  const theme = useTheme();

  const getPlanChip = (plan) => {
    const config = {
      essential: { color: 'default', icon: <RocketOutlined /> },
      professional: { color: 'primary', icon: <StarOutlined /> },
      enterprise: { color: 'warning', icon: <CrownOutlined /> }
    };
    const c = config[plan] || config.essential;
    return <Chip size="small" label={plan} color={c.color} icon={c.icon} />;
  };

  const getStatusChip = (status) => {
    const config = {
      active: { color: 'success', label: 'Active' },
      trialing: { color: 'info', label: 'Trialing' },
      past_due: { color: 'warning', label: 'Past Due' },
      canceled: { color: 'error', label: 'Canceled' }
    };
    const c = config[status] || config.active;
    return <Chip size="small" label={c.label} color={c.color} variant="outlined" />;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Recent Subscriptions</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Organization</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">MRR</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{sub.org}</Typography>
                  </TableCell>
                  <TableCell>{getPlanChip(sub.plan)}</TableCell>
                  <TableCell>{getStatusChip(sub.status)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>${sub.amount}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(sub.date).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// ==============================|| TOP ORGANIZATIONS ||============================== //

const TopOrganizations = ({ organizations }) => {
  const theme = useTheme();

  const getPlanIcon = (plan) => {
    const icons = {
      essential: <RocketOutlined style={{ color: theme.palette.grey[500] }} />,
      professional: <StarOutlined style={{ color: theme.palette.primary.main }} />,
      enterprise: <CrownOutlined style={{ color: theme.palette.warning.main }} />
    };
    return icons[plan] || icons.essential;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Top Organizations by Usage</Typography>
        <List disablePadding>
          {organizations.map((org, index) => (
            <Box key={org.name}>
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      color: 'primary.main'
                    }}
                  >
                    {index + 1}
                  </Box>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" fontWeight={500}>{org.name}</Typography>
                      {getPlanIcon(org.plan)}
                    </Stack>
                  }
                  secondary={
                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        <ProjectOutlined /> {org.projects} projects
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <TeamOutlined /> {org.users} users
                      </Typography>
                    </Stack>
                  }
                />
              </ListItem>
              {index < organizations.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// ==============================|| MONTHLY REVENUE CHART (Simple) ||============================== //

const MonthlyRevenueChart = ({ data }) => {
  const theme = useTheme();
  const maxRevenue = Math.max(...data.map(d => d.revenue));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3 }}>Monthly Revenue</Typography>
        <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ height: 200 }}>
          {data.map((item) => (
            <Box key={item.month} sx={{ flex: 1, textAlign: 'center' }}>
              <Box
                sx={{
                  height: (item.revenue / maxRevenue) * 160,
                  bgcolor: 'primary.main',
                  borderRadius: '4px 4px 0 0',
                  mb: 1,
                  minHeight: 20,
                  transition: 'height 0.3s ease'
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {item.month}
              </Typography>
              <Typography variant="caption" display="block" fontWeight={600}>
                ${(item.revenue / 1000).toFixed(1)}k
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ==============================|| INTERNAL - DASHBOARD PAGE ||============================== //

const InternalDashboardPage = () => {
  const theme = useTheme();
  const { user, isLoading } = useUser();

  // Check if current user is owner
  const isOwner = user?.role?.toLowerCase() === 'owner';

  // Loading state
  if (isLoading) {
    return (
      <Page title="Internal Dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Page>
    );
  }

  // Not owner
  if (!isOwner) {
    return (
      <Page title="Internal Dashboard">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <MainCard>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CrownOutlined style={{ fontSize: '4rem', color: theme.palette.warning.main, marginBottom: 16 }} />
              <Typography variant="h4" gutterBottom>
                Owner Access Required
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This page is only accessible to platform owners.
              </Typography>
            </Box>
          </MainCard>
        </Container>
      </Page>
    );
  }

  return (
    <Page title="Internal Dashboard">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4">Internal Dashboard</Typography>
            <Typography variant="body2" color="text.secondary">
              Platform overview and key metrics
            </Typography>
          </Box>
          <Chip
            icon={<CrownOutlined />}
            label="Owner Only"
            color="warning"
            variant="outlined"
          />
        </Stack>

        {/* Revenue Metrics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Monthly Recurring Revenue"
              value={mockData.revenue.mrr}
              change={mockData.revenue.mrrChange}
              prefix="$"
              icon={<DollarOutlined style={{ fontSize: 24, color: theme.palette.success.main }} />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Annual Recurring Revenue"
              value={mockData.revenue.arr}
              change={mockData.revenue.arrChange}
              prefix="$"
              icon={<RiseOutlined style={{ fontSize: 24, color: theme.palette.primary.main }} />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Organizations"
              value={mockData.organizations.total}
              change={mockData.organizations.growthRate}
              icon={<BankOutlined style={{ fontSize: 24, color: theme.palette.info.main }} />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Active Projects"
              value={mockData.usage.totalProjects}
              icon={<ProjectOutlined style={{ fontSize: 24, color: theme.palette.warning.main }} />}
              color="warning"
            />
          </Grid>
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <MonthlyRevenueChart data={mockData.monthlyTrends} />
          </Grid>
          <Grid item xs={12} md={4}>
            <PlanDistribution data={mockData.subscriptions.byPlan} />
          </Grid>
        </Grid>

        {/* Status & Usage Row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <SubscriptionStatus data={mockData.subscriptions} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>Platform Usage</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <TeamOutlined style={{ fontSize: 24, color: theme.palette.primary.main }} />
                      <Typography variant="h4" sx={{ my: 1 }}>{mockData.usage.totalUsers}</Typography>
                      <Typography variant="caption" color="text.secondary">Total Users</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <ProjectOutlined style={{ fontSize: 24, color: theme.palette.success.main }} />
                      <Typography variant="h4" sx={{ my: 1 }}>{mockData.usage.totalProjects}</Typography>
                      <Typography variant="caption" color="text.secondary">Total Projects</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <BookOutlined style={{ fontSize: 24, color: theme.palette.info.main }} />
                      <Typography variant="h4" sx={{ my: 1 }}>{mockData.usage.totalCourses}</Typography>
                      <Typography variant="caption" color="text.secondary">Total Courses</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <TeamOutlined style={{ fontSize: 24, color: theme.palette.warning.main }} />
                      <Typography variant="h4" sx={{ my: 1 }}>{mockData.usage.totalInstructors}</Typography>
                      <Typography variant="caption" color="text.secondary">Instructors</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tables Row */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <RecentSubscriptionsTable subscriptions={mockData.recentSubscriptions} />
          </Grid>
          <Grid item xs={12} md={5}>
            <TopOrganizations organizations={mockData.topOrganizations} />
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
};

InternalDashboardPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default InternalDashboardPage;
