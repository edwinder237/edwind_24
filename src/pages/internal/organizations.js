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
  Grid,
  IconButton,
  InputAdornment,
  Paper,
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
  ApartmentOutlined,
  TeamOutlined,
  ProjectOutlined,
  BookOutlined,
  CrownOutlined,
  StarOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  BankOutlined
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

// ==============================|| PLAN BADGE ||============================== //

const PlanBadge = ({ planId, planName }) => {
  const planConfig = {
    enterprise: { color: 'warning', icon: <CrownOutlined /> },
    professional: { color: 'primary', icon: <StarOutlined /> },
    essential: { color: 'default', icon: <RocketOutlined /> }
  };

  const config = planConfig[planId] || planConfig.essential;

  return (
    <Chip
      size="small"
      label={planName || planId || 'No Plan'}
      color={config.color}
      icon={config.icon}
      variant="filled"
    />
  );
};

// ==============================|| STATUS BADGE ||============================== //

const StatusBadge = ({ status }) => {
  if (status === 'active') {
    return (
      <Chip
        size="small"
        label="Active"
        color="success"
        icon={<CheckCircleOutlined />}
        variant="outlined"
      />
    );
  }
  return (
    <Chip
      size="small"
      label={status || 'Unknown'}
      color="default"
      icon={<CloseCircleOutlined />}
      variant="outlined"
    />
  );
};

// ==============================|| INTERNAL - ORGANIZATIONS PAGE ||============================== //

const InternalOrganizationsPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { user, isLoading: userLoading, isAuthenticated } = useUser();

  // State
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    activeSubscriptions: 0
  });

  // Check if current user is owner
  const isOwner = user?.role?.toLowerCase() === 'owner';

  // Fetch organizations
  const fetchOrganizations = useCallback(async () => {
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

      const response = await axios.get(`/api/internal/organizations?${params.toString()}`);
      setOrganizations(response.data.organizations);
      setTotalCount(response.data.pagination.total);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      if (err.response?.status === 403) {
        setError('Access denied. Owner privileges required.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch organizations');
      }
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    if (isAuthenticated && isOwner) {
      fetchOrganizations();
    }
  }, [isAuthenticated, isOwner, fetchOrganizations]);

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
      <Page title="All Organizations">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  // Not owner
  if (!isOwner) {
    return (
      <Page title="All Organizations">
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
    <Page title="All Organizations">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Organizations"
              value={stats.totalOrganizations || 0}
              icon={<BankOutlined style={{ fontSize: 24, color: theme.palette.primary.main }} />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Subscriptions"
              value={stats.activeSubscriptions || 0}
              icon={<CheckCircleOutlined style={{ fontSize: 24, color: theme.palette.success.main }} />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Projects"
              value={organizations.reduce((acc, org) => acc + (org.stats?.projects || 0), 0)}
              icon={<ProjectOutlined style={{ fontSize: 24, color: theme.palette.info.main }} />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Courses"
              value={organizations.reduce((acc, org) => acc + (org.stats?.courses || 0), 0)}
              icon={<BookOutlined style={{ fontSize: 24, color: theme.palette.warning.main }} />}
              color="warning"
            />
          </Grid>
        </Grid>

        {/* Main Card */}
        <MainCard
          title="All Organizations"
          secondary={
            <Button
              variant="outlined"
              startIcon={<ReloadOutlined />}
              onClick={fetchOrganizations}
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
          </Grid>

          {/* Error Alert */}
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {/* Organizations Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Organization</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Sub-Orgs</TableCell>
                  <TableCell align="center">Members</TableCell>
                  <TableCell align="center">Projects</TableCell>
                  <TableCell align="center">Courses</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No organizations found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((org) => (
                    <TableRow
                      key={org.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04)
                        }
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          {org.logoUrl ? (
                            <Box
                              component="img"
                              src={org.logoUrl}
                              alt={org.title}
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1,
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <BankOutlined style={{ fontSize: 20, color: theme.palette.primary.main }} />
                            </Box>
                          )}
                          <Box>
                            <Typography variant="subtitle2">
                              {org.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {org.id?.slice(0, 8)}...
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {org.subscription ? (
                          <PlanBadge
                            planId={org.subscription.planId}
                            planName={org.subscription.planName}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No subscription
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={org.subscription?.status} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={org.stats?.subOrganizations || 0}
                          icon={<ApartmentOutlined />}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={org.stats?.members || 0}
                          icon={<TeamOutlined />}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={org.stats?.projects || 0}
                          icon={<ProjectOutlined />}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={org.stats?.courses || 0}
                          icon={<BookOutlined />}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/internal/organizations/${org.id}`)}
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

InternalOrganizationsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default InternalOrganizationsPage;
