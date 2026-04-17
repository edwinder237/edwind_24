import { useState, useEffect } from 'react';
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
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme
} from '@mui/material';

// icons
import {
  ArrowLeftOutlined,
  CopyOutlined,
  TeamOutlined,
  ApartmentOutlined,
  ProjectOutlined,
  BookOutlined,
  UserOutlined,
  CrownOutlined,
  StarOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  BarChartOutlined,
  StopOutlined,
  BankOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  LinkOutlined,
  SaveOutlined
} from '@ant-design/icons';

// project imports
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';

// ==============================|| TAB PANEL ||============================== //

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`org-detail-tabpanel-${index}`}
      aria-labelledby={`org-detail-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `org-detail-tab-${index}`,
    'aria-controls': `org-detail-tabpanel-${index}`
  };
}

// ==============================|| COPYABLE ID ||============================== //

const CopyableId = ({ label, value }) => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>
        {label}:
      </Typography>
      {value ? (
        <>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              px: 1,
              py: 0.25,
              borderRadius: 0.5
            }}
          >
            {value}
          </Typography>
          <Tooltip title={copied ? 'Copied!' : 'Copy'}>
            <IconButton size="small" onClick={handleCopy}>
              <CopyOutlined style={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        <Typography variant="body2" color="text.disabled">
          Not set
        </Typography>
      )}
    </Stack>
  );
};

// ==============================|| STAT CARD (small) ||============================== //

const StatCard = ({ title, value, icon, color = 'primary' }) => {
  const theme = useTheme();

  return (
    <Card sx={{ borderLeft: `3px solid ${theme.palette[color].main}`, height: '100%' }}>
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4">{value}</Typography>
            <Typography variant="caption" color="text.secondary">{title}</Typography>
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 1.5,
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
  const config = {
    enterprise: { color: 'warning', icon: <CrownOutlined /> },
    professional: { color: 'primary', icon: <StarOutlined /> },
    essential: { color: 'default', icon: <RocketOutlined /> }
  };
  const c = config[planId] || config.essential;
  return <Chip size="small" label={planName || planId || 'No Plan'} color={c.color} icon={c.icon} variant="filled" />;
};

// ==============================|| STATUS BADGE ||============================== //

const StatusBadge = ({ status }) => {
  if (status === 'active' || !status) {
    return <Chip size="small" label="Active" color="success" icon={<CheckCircleOutlined />} variant="outlined" />;
  }
  if (status === 'inactive') {
    return <Chip size="small" label="Inactive" color="error" icon={<StopOutlined />} variant="outlined" />;
  }
  return <Chip size="small" label={status} color="default" icon={<CloseCircleOutlined />} variant="outlined" />;
};

// ==============================|| ORGANIZATION DETAIL PAGE ||============================== //

const OrganizationDetailPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: userLoading } = useUser();

  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // User management state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, member: null });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [editDialog, setEditDialog] = useState({ open: false, member: null });
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', isActive: true, sub_organizationId: '' });
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [reactivatingSubscription, setReactivatingSubscription] = useState(false);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);

  const isOwner = user?.role?.toLowerCase() === 'owner';

  const fetchOrg = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/internal/organizations/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch organization');
      }
      const data = await res.json();
      setOrg(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || !isOwner) return;
    fetchOrg();
  }, [id, isOwner]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setActionError('');
    setActionSuccess('');
  };

  // ── User Edit ──
  const handleEditOpen = (member) => {
    setEditForm({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      isActive: member.isActive !== false,
      sub_organizationId: member.subOrganization?.id || ''
    });
    setEditDialog({ open: true, member });
    setActionError('');
    setActionSuccess('');
  };

  const handleEditSave = async () => {
    const { member } = editDialog;
    setActionLoading(member.id);
    setActionError('');

    try {
      const res = await fetch(`/api/internal/organizations/${id}/users/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }

      setEditDialog({ open: false, member: null });
      setActionSuccess('User updated successfully');
      await fetchOrg();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ── User Delete ──
  const handleDeleteOpen = (member) => {
    setDeleteDialog({ open: true, member });
    setDeleteConfirmText('');
    setActionError('');
    setActionSuccess('');
  };

  const handleConfirmDelete = async () => {
    const { member } = deleteDialog;
    setDeleteDialog({ open: false, member: null });
    setActionLoading(member.id);
    setActionError('');

    try {
      const res = await fetch(`/api/internal/organizations/${id}/users/${member.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setActionSuccess(`User "${member.name || member.email}" permanently deleted`);
      await fetchOrg();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reactivate Subscription ──
  const handleReactivateSubscription = async () => {
    setReactivatingSubscription(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/internal/organizations/${id}/reactivate-subscription`, {
        method: 'PUT'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reactivate subscription');
      }
      setActionSuccess('Subscription reactivated successfully');
      await fetchOrg();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setReactivatingSubscription(false);
    }
  };

  // ── Change Plan ──
  const handleOpenChangePlan = async () => {
    setChangePlanDialogOpen(true);
    setPlansLoading(true);
    try {
      const res = await fetch('/api/subscriptions/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleChangePlan = async (planId) => {
    setChangingPlan(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`/api/internal/organizations/${id}/change-plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change plan');
      }
      setActionSuccess(data.message || 'Plan changed successfully');
      setChangePlanDialogOpen(false);
      await fetchOrg();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setChangingPlan(false);
    }
  };

  // Loading
  if (userLoading || !id) {
    return (
      <Page title="Organization Details">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  // Not owner
  if (!isOwner) {
    return (
      <Page title="Organization Details">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <MainCard>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CrownOutlined style={{ fontSize: '4rem', color: theme.palette.warning.main, marginBottom: 16 }} />
              <Typography variant="h4" gutterBottom>Owner Access Required</Typography>
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
    <Page title={org ? `${org.title} - Organization` : 'Organization Details'}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Back button + header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Button
            component={NextLink}
            href="/internal/organizations"
            startIcon={<ArrowLeftOutlined />}
            variant="text"
            color="inherit"
          >
            All Organizations
          </Button>
        </Stack>

        {/* Loading skeleton */}
        {loading && (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={60} />
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Grid item xs={6} sm={4} md={2} key={i}>
                  <Skeleton variant="rounded" height={80} />
                </Grid>
              ))}
            </Grid>
            <Skeleton variant="rounded" height={400} />
          </Stack>
        )}

        {/* Error */}
        {error && !loading && (
          <MainCard>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h5" color="error" gutterBottom>{error}</Typography>
              <Button variant="outlined" onClick={() => router.reload()} sx={{ mt: 2 }}>
                Retry
              </Button>
            </Box>
          </MainCard>
        )}

        {/* Content */}
        {org && !loading && (
          <>
            {/* Org header */}
            <MainCard sx={{ mb: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  {org.logoUrl ? (
                    <Box
                      component="img"
                      src={org.logoUrl}
                      alt={org.title}
                      sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <BankOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
                    </Box>
                  )}
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="h4">{org.title}</Typography>
                      <StatusBadge status={org.status} />
                      {org.subscription && (
                        <PlanBadge planId={org.subscription.planId} planName={org.subscription.planName} />
                      )}
                    </Stack>
                    {org.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {org.description}
                      </Typography>
                    )}
                  </Box>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Created {new Date(org.createdAt).toLocaleDateString()}
                </Typography>
              </Stack>
            </MainCard>

            {/* Stat cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={4} md={2}>
                <StatCard
                  title="Members"
                  value={org.stats?.members || 0}
                  icon={<TeamOutlined style={{ fontSize: 20, color: theme.palette.primary.main }} />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <StatCard
                  title="Sub-Orgs"
                  value={org.stats?.subOrganizations || 0}
                  icon={<ApartmentOutlined style={{ fontSize: 20, color: theme.palette.info.main }} />}
                  color="info"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <StatCard
                  title="Projects"
                  value={org.stats?.projects || 0}
                  icon={<ProjectOutlined style={{ fontSize: 20, color: theme.palette.success.main }} />}
                  color="success"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <StatCard
                  title="Courses"
                  value={org.stats?.courses || 0}
                  icon={<BookOutlined style={{ fontSize: 20, color: theme.palette.warning.main }} />}
                  color="warning"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <StatCard
                  title="Users"
                  value={org.stats?.users || 0}
                  icon={<UserOutlined style={{ fontSize: 20, color: theme.palette.secondary.main }} />}
                  color="secondary"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <StatCard
                  title="Instructors"
                  value={org.stats?.instructors || 0}
                  icon={<BarChartOutlined style={{ fontSize: 20, color: theme.palette.error.main }} />}
                  color="error"
                />
              </Grid>
            </Grid>

            {/* Tabs */}
            <MainCard>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="Overview" icon={<BankOutlined />} iconPosition="start" {...a11yProps(0)} />
                  <Tab label="Users" icon={<TeamOutlined />} iconPosition="start" {...a11yProps(1)} />
                  <Tab label="Subscription & Billing" icon={<CreditCardOutlined />} iconPosition="start" {...a11yProps(2)} />
                  <Tab label="Sub-Organizations" icon={<ApartmentOutlined />} iconPosition="start" {...a11yProps(3)} />
                </Tabs>
              </Box>

              {/* ── Overview Tab ── */}
              <TabPanel value={activeTab} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Organization Info</Typography>
                    <CopyableId label="Organization ID" value={org.id} />
                    <CopyableId label="WorkOS Org ID" value={org.workosOrgId} />
                    <CopyableId label="Stripe Customer ID" value={org.subscription?.stripeCustomerId} />
                    <CopyableId label="Stripe Subscription ID" value={org.subscription?.stripeSubscriptionId} />

                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>Status:</Typography>
                      <StatusBadge status={org.status} />
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>Type:</Typography>
                      <Typography variant="body2">{org.type || 'N/A'}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>Created:</Typography>
                      <Typography variant="body2">{new Date(org.createdAt).toLocaleString()}</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {/* Deactivation / reactivation metadata */}
                    {org.info?.deactivatedAt && (
                      <Alert severity={org.status === 'inactive' ? 'error' : 'info'} sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>Deactivated:</strong> {new Date(org.info.deactivatedAt).toLocaleString()}
                          {org.info.deactivatedUserCount !== undefined && ` (${org.info.deactivatedUserCount} users affected)`}
                        </Typography>
                        {org.info.reactivatedAt && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            <strong>Reactivated:</strong> {new Date(org.info.reactivatedAt).toLocaleString()}
                          </Typography>
                        )}
                      </Alert>
                    )}

                    {org.subscription && (
                      <>
                        <Typography variant="h6" sx={{ mb: 2 }}>Subscription Summary</Typography>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Plan:</Typography>
                          <PlanBadge planId={org.subscription.planId} planName={org.subscription.planName} />
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Status:</Typography>
                          <Chip
                            size="small"
                            label={org.subscription.status || 'unknown'}
                            color={org.subscription.status === 'active' ? 'success' : org.subscription.status === 'trialing' ? 'info' : 'default'}
                            variant="outlined"
                          />
                        </Stack>
                        {org.subscription.trialEnd && (
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Trial Ends:</Typography>
                            <Typography variant="body2">{new Date(org.subscription.trialEnd).toLocaleDateString()}</Typography>
                          </Stack>
                        )}
                        {org.subscription.currentPeriodEnd && (
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Period Ends:</Typography>
                            <Typography variant="body2">{new Date(org.subscription.currentPeriodEnd).toLocaleDateString()}</Typography>
                          </Stack>
                        )}
                        {org.subscription.canceledAt && (
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Canceled:</Typography>
                            <Typography variant="body2" color="error">{new Date(org.subscription.canceledAt).toLocaleString()}</Typography>
                          </Stack>
                        )}
                        {['canceled', 'suspended'].includes(org.subscription.status) && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={handleReactivateSubscription}
                            disabled={reactivatingSubscription}
                            startIcon={reactivatingSubscription ? <CircularProgress size={16} /> : <CheckCircleOutlined />}
                            sx={{ mt: 2 }}
                          >
                            {reactivatingSubscription ? 'Reactivating...' : 'Reactivate Subscription'}
                          </Button>
                        )}
                      </>
                    )}
                  </Grid>
                </Grid>
              </TabPanel>

              {/* ── Users Tab ── */}
              <TabPanel value={activeTab} index={1}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Members ({org.members?.length || 0})
                </Typography>

                {actionError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>
                    {actionError}
                  </Alert>
                )}
                {actionSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionSuccess('')}>
                    {actionSuccess}
                  </Alert>
                )}

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Sub-Organization</TableCell>
                        <TableCell>WorkOS User ID</TableCell>
                        <TableCell>Joined</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!org.members?.length ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">No members found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        org.members.map((member) => (
                          <TableRow key={member.id || member.email}>
                            <TableCell>
                              <Typography variant="body2">
                                {member.firstName && member.lastName
                                  ? `${member.firstName} ${member.lastName}`
                                  : member.name || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{member.email}</Typography>
                            </TableCell>
                            <TableCell>
                              {member.status === 'no_membership' ? (
                                <Chip
                                  size="small"
                                  label="No membership"
                                  color="warning"
                                  variant="outlined"
                                />
                              ) : (
                                <Chip
                                  size="small"
                                  label={member.role || 'member'}
                                  color={member.role === 'owner' ? 'warning' : member.role === 'admin' ? 'primary' : 'default'}
                                  variant="outlined"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={member.isActive ? 'Active' : 'Inactive'}
                                color={member.isActive ? 'success' : 'error'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {member.subOrganization?.title || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                {member.workosUserId ? `${member.workosUserId.slice(0, 16)}...` : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                {actionLoading === member.id ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <>
                                    <Tooltip title="Edit User">
                                      <IconButton size="small" onClick={() => handleEditOpen(member)}>
                                        <EditOutlined style={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete User">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteOpen(member)}
                                      >
                                        <DeleteOutlined style={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* ── Subscription & Billing Tab ── */}
              <TabPanel value={activeTab} index={2}>
                {actionError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>
                    {actionError}
                  </Alert>
                )}
                {actionSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionSuccess('')}>
                    {actionSuccess}
                  </Alert>
                )}
                {!org.subscription ? (
                  <Alert severity="info">This organization has no subscription.</Alert>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                      <Typography variant="h6" sx={{ mb: 2 }}>Subscription Details</Typography>
                      <Stack spacing={1.5}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>Plan:</Typography>
                          <PlanBadge planId={org.subscription.planId} planName={org.subscription.planName} />
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>Status:</Typography>
                          <Chip
                            size="small"
                            label={org.subscription.status}
                            color={org.subscription.status === 'active' ? 'success' : org.subscription.status === 'trialing' ? 'info' : 'default'}
                            variant="outlined"
                          />
                        </Stack>
                        <CopyableId label="Stripe Customer ID" value={org.subscription.stripeCustomerId} />
                        <CopyableId label="Stripe Sub ID" value={org.subscription.stripeSubscriptionId} />
                        {org.subscription.trialStart && (
                          <Stack direction="row" spacing={1}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>Trial Period:</Typography>
                            <Typography variant="body2">
                              {new Date(org.subscription.trialStart).toLocaleDateString()} — {new Date(org.subscription.trialEnd).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        )}
                        {org.subscription.currentPeriodStart && (
                          <Stack direction="row" spacing={1}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>Billing Period:</Typography>
                            <Typography variant="body2">
                              {new Date(org.subscription.currentPeriodStart).toLocaleDateString()} — {new Date(org.subscription.currentPeriodEnd).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        )}
                        {org.subscription.canceledAt && (
                          <Stack direction="row" spacing={1}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>Canceled At:</Typography>
                            <Typography variant="body2" color="error">
                              {new Date(org.subscription.canceledAt).toLocaleString()}
                            </Typography>
                          </Stack>
                        )}
                        {['canceled', 'suspended'].includes(org.subscription.status) && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={handleReactivateSubscription}
                            disabled={reactivatingSubscription}
                            startIcon={reactivatingSubscription ? <CircularProgress size={16} /> : <CheckCircleOutlined />}
                            sx={{ mt: 2 }}
                          >
                            {reactivatingSubscription ? 'Reactivating...' : 'Reactivate Subscription'}
                          </Button>
                        )}
                        {['active', 'trialing'].includes(org.subscription.status) && (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={handleOpenChangePlan}
                            startIcon={<EditOutlined />}
                            sx={{ mt: 2 }}
                          >
                            Change Plan
                          </Button>
                        )}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={7}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Invoices ({org.invoices?.length || 0})
                      </Typography>
                      {!org.invoices?.length ? (
                        <Alert severity="info">No invoices found.</Alert>
                      ) : (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="center">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {org.invoices.map((inv) => (
                                <TableRow key={inv.id}>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {new Date(inv.created).toLocaleDateString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">{inv.description}</Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      ${inv.amount?.toFixed(2)} {inv.currency}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      label={inv.status}
                                      color={inv.status === 'paid' ? 'success' : inv.status === 'open' ? 'warning' : 'default'}
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    <Stack direction="row" spacing={0.5} justifyContent="center">
                                      {inv.invoicePdf && (
                                        <Tooltip title="Download PDF">
                                          <IconButton
                                            size="small"
                                            component="a"
                                            href={inv.invoicePdf}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <DownloadOutlined style={{ fontSize: 16 }} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {inv.hostedInvoiceUrl && (
                                        <Tooltip title="View in Stripe">
                                          <IconButton
                                            size="small"
                                            component="a"
                                            href={inv.hostedInvoiceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <LinkOutlined style={{ fontSize: 16 }} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Grid>
                  </Grid>
                )}

                {/* Subscription History */}
                {org.subscription?.history?.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Subscription History</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Event</TableCell>
                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                            <TableCell>Reason</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {org.subscription.history.map((h, i) => (
                            <TableRow key={h.id || i}>
                              <TableCell>
                                <Typography variant="body2">
                                  {new Date(h.changedAt).toLocaleString()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip size="small" label={h.eventType} variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">{h.fromStatus || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{h.toStatus || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">{h.reason || '—'}</Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </TabPanel>

              {/* ── Sub-Organizations Tab ── */}
              <TabPanel value={activeTab} index={3}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Sub-Organizations ({org.subOrganizations?.length || 0})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell align="center">Projects</TableCell>
                        <TableCell align="center">Users</TableCell>
                        <TableCell align="center">Instructors</TableCell>
                        <TableCell align="center">Courses</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!org.subOrganizations?.length ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">No sub-organizations found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        org.subOrganizations.map((so) => (
                          <TableRow key={so.id}>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <ApartmentOutlined style={{ fontSize: 16, color: theme.palette.info.main }} />
                                <Typography variant="body2">{so.title}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              <Chip size="small" label={so.stats?.projects || 0} variant="outlined" />
                            </TableCell>
                            <TableCell align="center">
                              <Chip size="small" label={so.stats?.users || 0} variant="outlined" />
                            </TableCell>
                            <TableCell align="center">
                              <Chip size="small" label={so.stats?.instructors || 0} variant="outlined" />
                            </TableCell>
                            <TableCell align="center">
                              <Chip size="small" label={so.stats?.courses || 0} variant="outlined" />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </MainCard>
          </>
        )}
        {/* ── Change Plan Dialog ── */}
        <Dialog
          open={changePlanDialogOpen}
          onClose={() => !changingPlan && setChangePlanDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Change Subscription Plan</DialogTitle>
          <DialogContent>
            {actionError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>
                {actionError}
              </Alert>
            )}
            {plansLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={2} sx={{ mt: 1 }}>
                {plans.map((plan) => {
                  const isCurrent = plan.planId === org?.subscription?.planId;
                  const iconMap = {
                    enterprise: <CrownOutlined style={{ fontSize: 24 }} />,
                    professional: <StarOutlined style={{ fontSize: 24 }} />,
                    essential: <RocketOutlined style={{ fontSize: 24 }} />
                  };
                  return (
                    <Paper
                      key={plan.planId}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderColor: isCurrent ? 'primary.main' : 'divider',
                        borderWidth: isCurrent ? 2 : 1,
                        opacity: changingPlan && !isCurrent ? 0.6 : 1
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.primary.main, 0.1)
                            }}
                          >
                            {iconMap[plan.planId] || iconMap.essential}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {plan.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {plan.description || `${plan.planId} plan`}
                            </Typography>
                          </Box>
                        </Stack>
                        {isCurrent ? (
                          <Chip label="Current Plan" color="primary" size="small" variant="outlined" />
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleChangePlan(plan.planId)}
                            disabled={changingPlan}
                            startIcon={changingPlan ? <CircularProgress size={14} /> : null}
                          >
                            {changingPlan ? 'Changing...' : 'Select'}
                          </Button>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setChangePlanDialogOpen(false)} disabled={changingPlan}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Edit User Dialog ── */}
        <Dialog
          open={editDialog.open}
          onClose={() => !actionLoading && setEditDialog({ open: false, member: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Edit User: {editDialog.member?.name || editDialog.member?.email}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {actionError && (
                <Grid item xs={12}>
                  <Alert severity="error">{actionError}</Alert>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Sub-Organization</InputLabel>
                  <Select
                    value={editForm.sub_organizationId}
                    label="Sub-Organization"
                    onChange={(e) => setEditForm(prev => ({ ...prev, sub_organizationId: e.target.value }))}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {org?.subOrganizations?.map((so) => (
                      <MenuItem key={so.id} value={so.id}>
                        {so.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      color="success"
                    />
                  }
                  label={editForm.isActive ? 'Active' : 'Inactive'}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setEditDialog({ open: false, member: null })}
              disabled={!!actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleEditSave}
              disabled={!!actionLoading}
              startIcon={actionLoading ? <CircularProgress size={16} /> : <SaveOutlined />}
            >
              {actionLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete User Confirmation Dialog ── */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, member: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: 'error.main' }}>
            <DeleteOutlined style={{ marginRight: 8 }} />
            Delete User Permanently
          </DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              This action is irreversible. The user will be permanently removed from WorkOS and the database.
            </Alert>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Name:</strong> {deleteDialog.member?.name || `${deleteDialog.member?.firstName || ''} ${deleteDialog.member?.lastName || ''}`.trim() || '—'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Email:</strong> {deleteDialog.member?.email}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>WorkOS ID:</strong> {deleteDialog.member?.workosUserId || 'None'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Type the user&apos;s email <strong>{deleteDialog.member?.email}</strong> to confirm:
            </Typography>
            <TextField
              fullWidth
              placeholder={deleteDialog.member?.email}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoFocus
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteDialog({ open: false, member: null })}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
              disabled={deleteConfirmText !== deleteDialog.member?.email}
              startIcon={<DeleteOutlined />}
            >
              Delete Permanently
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Page>
  );
};

OrganizationDetailPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default OrganizationDetailPage;
