import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';

// material-ui
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Switch,
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
  DeleteOutlined,
  ExclamationCircleOutlined,
  BankOutlined,
  StopOutlined,
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
  if (status === 'active' || !status) {
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
  if (status === 'inactive') {
    return (
      <Chip
        size="small"
        label="Inactive"
        color="error"
        icon={<StopOutlined />}
        variant="outlined"
      />
    );
  }
  return (
    <Chip
      size="small"
      label={status}
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
    activeSubscriptions: 0,
    deactivatedOrganizations: 0
  });

  // Action state
  const [actionLoading, setActionLoading] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Deactivation dialog
  const [statusDialog, setStatusDialog] = useState({ open: false, org: null, action: null });

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, org: null });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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

  // ── Status toggle ──
  const handleToggleStatus = (org) => {
    const isCurrentlyActive = org.status === 'active' || !org.status;
    setStatusDialog({
      open: true,
      org,
      action: isCurrentlyActive ? 'deactivate' : 'reactivate'
    });
  };

  const handleConfirmStatusChange = async () => {
    const { org, action } = statusDialog;
    setStatusDialog({ open: false, org: null, action: null });
    setActionLoading(org.id);

    try {
      const response = await axios.put(`/api/internal/organizations/${org.id}/status`, {
        isActive: action === 'reactivate'
      });

      setSnackbar({
        open: true,
        message: action === 'deactivate'
          ? `"${org.title}" deactivated. ${response.data.affectedUsers} user(s) affected.`
          : `"${org.title}" reactivated. Users remain deactivated.`,
        severity: 'success'
      });

      fetchOrganizations();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || `Failed to ${action} organization`,
        severity: 'error'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Hard delete ──
  const handleDeleteClick = (org) => {
    setDeleteDialog({ open: true, org });
    setDeleteConfirmText('');
  };

  const handleConfirmDelete = async () => {
    const { org } = deleteDialog;
    setDeleteDialog({ open: false, org: null });
    setDeleteConfirmText('');
    setActionLoading(org.id);

    try {
      const response = await axios.delete(`/api/internal/organizations/${org.id}`, {
        data: { confirmTitle: org.title }
      });

      setSnackbar({
        open: true,
        message: `"${org.title}" permanently deleted. ${response.data.deleted?.members || 0} member(s) removed.`,
        severity: 'success'
      });

      fetchOrganizations();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to delete organization',
        severity: 'error'
      });
    } finally {
      setActionLoading(null);
    }
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
              title="Deactivated"
              value={stats.deactivatedOrganizations || 0}
              icon={<StopOutlined style={{ fontSize: 24, color: theme.palette.error.main }} />}
              color="error"
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
                  <TableCell align="center">Active</TableCell>
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
                ) : organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No organizations found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((org) => {
                    const isActive = org.status === 'active' || !org.status;

                    return (
                      <TableRow
                        key={org.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04)
                          },
                          opacity: org.status === 'inactive' ? 0.6 : 1
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
                              <Typography
                                variant="subtitle2"
                                component={NextLink}
                                href={`/internal/organizations/${org.id}`}
                                sx={{
                                  textDecoration: 'none',
                                  color: 'inherit',
                                  '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                                }}
                              >
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
                          <StatusBadge status={org.status || 'active'} />
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
                          <Tooltip title={isActive ? 'Active - Click to deactivate' : 'Inactive - Click to reactivate'}>
                            <span>
                              <Switch
                                checked={isActive}
                                onChange={() => handleToggleStatus(org)}
                                color="success"
                                size="small"
                                disabled={actionLoading === org.id}
                              />
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                color="primary"
                                component={NextLink}
                                href={`/internal/organizations/${org.id}`}
                              >
                                <EyeOutlined />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Organization">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteClick(org)}
                                  disabled={actionLoading === org.id}
                                >
                                  <DeleteOutlined />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

        {/* ── Deactivation/Reactivation Confirmation Dialog ── */}
        <Dialog
          open={statusDialog.open}
          onClose={() => setStatusDialog({ open: false, org: null, action: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ExclamationCircleOutlined style={{ color: theme.palette.warning.main }} />
            {statusDialog.action === 'deactivate' ? 'Deactivate Organization' : 'Reactivate Organization'}
          </DialogTitle>
          <DialogContent>
            {statusDialog.action === 'deactivate' ? (
              <>
                <DialogContentText>
                  Are you sure you want to deactivate <strong>{statusDialog.org?.title}</strong>?
                </DialogContentText>
                <Alert severity="warning" sx={{ mt: 2 }}>
                  This will:
                  <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                    <li>Deactivate ALL {statusDialog.org?.stats?.members || 0} members - they will lose app access immediately</li>
                    <li>Revoke all active sessions (forced logout)</li>
                    <li>Cancel the Stripe subscription immediately</li>
                  </ul>
                </Alert>
                <Alert severity="info" sx={{ mt: 1 }}>
                  Organization data will be preserved. This action can be reversed.
                </Alert>
              </>
            ) : (
              <>
                <DialogContentText>
                  Are you sure you want to reactivate <strong>{statusDialog.org?.title}</strong>?
                </DialogContentText>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Note: Users will NOT be automatically reactivated. You must reactivate them individually.
                  The subscription must also be re-established separately.
                </Alert>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialog({ open: false, org: null, action: null })}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color={statusDialog.action === 'deactivate' ? 'error' : 'success'}
              onClick={handleConfirmStatusChange}
            >
              {statusDialog.action === 'deactivate' ? 'Deactivate' : 'Reactivate'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Hard Delete Confirmation Dialog ── */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => { setDeleteDialog({ open: false, org: null }); setDeleteConfirmText(''); }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.error.main }}>
            <DeleteOutlined />
            Permanently Delete Organization
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will <strong>permanently delete</strong> <strong>{deleteDialog.org?.title}</strong> and ALL its data.
            </DialogContentText>
            <Alert severity="error" sx={{ mt: 2 }}>
              This action is <strong>irreversible</strong>. The following will be permanently removed:
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li>{deleteDialog.org?.stats?.members || 0} member(s) and their data</li>
                <li>{deleteDialog.org?.stats?.subOrganizations || 0} sub-organization(s)</li>
                <li>{deleteDialog.org?.stats?.projects || 0} project(s) and all related records</li>
                <li>{deleteDialog.org?.stats?.courses || 0} course(s)</li>
                <li>Stripe subscription will be canceled</li>
                <li>WorkOS organization will be deleted</li>
              </ul>
            </Alert>
            <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
              Type <strong>{deleteDialog.org?.title}</strong> to confirm:
            </Typography>
            <TextField
              fullWidth
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deleteDialog.org?.title}
              size="small"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setDeleteDialog({ open: false, org: null }); setDeleteConfirmText(''); }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
              disabled={deleteConfirmText !== deleteDialog.org?.title}
            >
              Delete Permanently
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ── */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Page>
  );
};

InternalOrganizationsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default InternalOrganizationsPage;
