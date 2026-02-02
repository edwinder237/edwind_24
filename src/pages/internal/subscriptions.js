import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

// material-ui
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme
} from '@mui/material';

// icons
import {
  SearchOutlined,
  ReloadOutlined,
  DollarOutlined,
  TeamOutlined,
  ProjectOutlined,
  ApartmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  StarOutlined,
  RocketOutlined,
  EyeOutlined
} from '@ant-design/icons';

// project imports
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';
import axios from 'utils/axios';

// ==============================|| STAT CARD ||============================== //

const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        borderLeft: `4px solid ${theme.palette[color].main}`,
        height: '100%'
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h3" sx={{ mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
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

// ==============================|| STATUS CHIP ||============================== //

const StatusChip = ({ status }) => {
  const statusConfig = {
    active: { label: 'Active', color: 'success', icon: <CheckCircleOutlined /> },
    trialing: { label: 'Trialing', color: 'info', icon: <ClockCircleOutlined /> },
    past_due: { label: 'Past Due', color: 'warning', icon: <ExclamationCircleOutlined /> },
    canceled: { label: 'Canceled', color: 'error', icon: <CloseCircleOutlined /> },
    paused: { label: 'Paused', color: 'default', icon: <ClockCircleOutlined /> }
  };

  const config = statusConfig[status] || statusConfig.active;

  return (
    <Chip
      size="small"
      label={config.label}
      color={config.color}
      icon={config.icon}
      variant="outlined"
    />
  );
};

// ==============================|| PLAN CHIP ||============================== //

const PlanChip = ({ planId }) => {
  const planConfig = {
    enterprise: { label: 'Enterprise', color: 'warning', icon: <CrownOutlined /> },
    professional: { label: 'Professional', color: 'primary', icon: <StarOutlined /> },
    essential: { label: 'Essential', color: 'default', icon: <RocketOutlined /> },
    free: { label: 'Free', color: 'default', icon: <RocketOutlined /> }
  };

  const config = planConfig[planId] || planConfig.essential;

  return (
    <Chip
      size="small"
      label={config.label}
      color={config.color}
      icon={config.icon}
      variant="filled"
    />
  );
};

// ==============================|| INTERNAL - SUBSCRIPTIONS PAGE ||============================== //

const InternalSubscriptionsPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { user, isLoading: userLoading, isAuthenticated } = useUser();

  // State
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [stats, setStats] = useState({
    byPlan: {},
    byStatus: {},
    total: 0
  });

  // Check if current user is owner
  const isOwner = user?.role?.toLowerCase() === 'owner';

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString()
      });

      if (search) {
        params.append('search', search);
      }

      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      if (filterPlan !== 'all') {
        params.append('planId', filterPlan);
      }

      const response = await axios.get(`/api/internal/subscriptions?${params.toString()}`);
      setSubscriptions(response.data.subscriptions);
      setTotalCount(response.data.pagination.total);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      if (err.response?.status === 403) {
        setError('Access denied. Owner privileges required.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch subscriptions');
      }
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, filterStatus, filterPlan]);

  useEffect(() => {
    if (isAuthenticated && isOwner) {
      fetchSubscriptions();
    }
  }, [isAuthenticated, isOwner, fetchSubscriptions]);

  // Handle search
  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Loading state
  if (userLoading) {
    return (
      <Page title="Subscription Management">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  // Not owner
  if (!isOwner) {
    return (
      <Page title="Subscription Management">
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
    <Page title="Subscription Management">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Subscriptions"
              value={stats.total || 0}
              icon={<DollarOutlined style={{ fontSize: 24, color: theme.palette.primary.main }} />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active"
              value={stats.byStatus?.active || 0}
              icon={<CheckCircleOutlined style={{ fontSize: 24, color: theme.palette.success.main }} />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Professional Plans"
              value={stats.byPlan?.professional || 0}
              icon={<StarOutlined style={{ fontSize: 24, color: theme.palette.info.main }} />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Enterprise Plans"
              value={stats.byPlan?.enterprise || 0}
              icon={<CrownOutlined style={{ fontSize: 24, color: theme.palette.warning.main }} />}
              color="warning"
            />
          </Grid>
        </Grid>

        {/* Main Card */}
        <MainCard
          title="All Subscriptions"
          secondary={
            <Button
              variant="outlined"
              startIcon={<ReloadOutlined />}
              onClick={fetchSubscriptions}
              disabled={loading}
            >
              Refresh
            </Button>
          }
        >
          {/* Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search organizations..."
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="trialing">Trialing</MenuItem>
                  <MenuItem value="past_due">Past Due</MenuItem>
                  <MenuItem value="canceled">Canceled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <FormControl fullWidth>
                <InputLabel>Plan</InputLabel>
                <Select
                  value={filterPlan}
                  label="Plan"
                  onChange={(e) => {
                    setFilterPlan(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Plans</MenuItem>
                  <MenuItem value="essential">Essential</MenuItem>
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Error Alert */}
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {/* Subscriptions Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Organization</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Projects</TableCell>
                  <TableCell align="center">Users</TableCell>
                  <TableCell align="center">Sub-Orgs</TableCell>
                  <TableCell>Stripe ID</TableCell>
                  <TableCell>Period End</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No subscriptions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((sub) => (
                    <TableRow
                      key={sub.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04)
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="subtitle2">
                          {sub.organizationName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sub.organizationId?.slice(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <PlanChip planId={sub.planId} />
                      </TableCell>
                      <TableCell>
                        <StatusChip status={sub.status} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={sub.usage?.projects || 0}
                          icon={<ProjectOutlined />}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={sub.usage?.users || 0}
                          icon={<TeamOutlined />}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={sub.usage?.subOrganizations || 0}
                          icon={<ApartmentOutlined />}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {sub.stripeCustomerId ? sub.stripeCustomerId.slice(0, 15) + '...' : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {sub.currentPeriodEnd
                            ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                            : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/internal/subscriptions/${sub.id}`)}
                          >
                            <EyeOutlined />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </MainCard>
      </Container>
    </Page>
  );
};

InternalSubscriptionsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default InternalSubscriptionsPage;
