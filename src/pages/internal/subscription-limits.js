import { useState, useEffect, useCallback } from 'react';

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
  LinearProgress,
  Paper,
  Skeleton,
  Snackbar,
  Alert,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme
} from '@mui/material';

// icons
import {
  CrownOutlined,
  StarOutlined,
  RocketOutlined,
  SaveOutlined,
  UndoOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';

// project imports
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';

// Ordered list of limit keys for display
const LIMIT_KEYS = [
  'maxProjects',
  'maxProjectsPerMonth',
  'maxParticipants',
  'maxInstructors',
  'maxSubOrganizations',
  'maxCourses',
  'maxCurriculums',
  'maxCustomRoles',
  'maxStorageGB',
  'maxEmailsPerMonth',
  'maxAiSummarizationsPerMonth'
];

const LIMIT_LABELS = {
  maxProjects: { label: 'Max Projects', description: 'Total active projects allowed' },
  maxProjectsPerMonth: { label: 'Max Projects / Month', description: 'Projects that can be created per month' },
  maxParticipants: { label: 'Max Users (Participants)', description: 'Total unique participants across all projects' },
  maxInstructors: { label: 'Max Instructors', description: 'Total instructors in the organization' },
  maxSubOrganizations: { label: 'Max Sub-Organizations', description: 'Number of sub-organizations allowed' },
  maxCourses: { label: 'Max Courses', description: 'Total courses that can be created' },
  maxCurriculums: { label: 'Max Curriculums', description: 'Total curriculums that can be created' },
  maxCustomRoles: { label: 'Max Custom Roles', description: 'Custom participant roles per organization' },
  maxStorageGB: { label: 'Max Storage (GB)', description: 'File storage quota in gigabytes' },
  maxEmailsPerMonth: { label: 'Max Emails / Month', description: 'Outbound emails sent per month' },
  maxAiSummarizationsPerMonth: { label: 'Max AI Summarizations / Month', description: 'AI summarization calls per month' }
};

const PLAN_META = {
  essential: { icon: <RocketOutlined />, color: 'default', label: 'Essential' },
  professional: { icon: <StarOutlined />, color: 'primary', label: 'Professional' },
  enterprise: { icon: <CrownOutlined />, color: 'warning', label: 'Enterprise' }
};

// Map usage keys to their corresponding limit keys
const USAGE_COLUMNS = [
  { usageKey: 'projects', limitKey: 'maxProjects', label: 'Projects' },
  { usageKey: 'participants', limitKey: 'maxParticipants', label: 'Users' },
  { usageKey: 'subOrganizations', limitKey: 'maxSubOrganizations', label: 'Sub-Orgs' },
  { usageKey: 'instructors', limitKey: 'maxInstructors', label: 'Instructors' },
  { usageKey: 'courses', limitKey: 'maxCourses', label: 'Courses' },
  { usageKey: 'curriculums', limitKey: 'maxCurriculums', label: 'Curriculums' },
  { usageKey: 'customRoles', limitKey: 'maxCustomRoles', label: 'Roles' }
];

// ==============================|| USAGE CELL ||============================== //

const UsageCell = ({ used, limit }) => {
  const theme = useTheme();
  const isUnlimited = limit === -1 || limit === undefined;
  const pct = isUnlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isOver = !isUnlimited && limit > 0 && used >= limit;
  const isWarning = !isUnlimited && limit > 0 && pct >= 80 && !isOver;

  const color = isOver
    ? theme.palette.error.main
    : isWarning
    ? theme.palette.warning.main
    : theme.palette.success.main;

  return (
    <Box sx={{ minWidth: 70 }}>
      <Typography variant="body2" sx={{ fontWeight: 500, color: isOver ? 'error.main' : 'text.primary' }}>
        {used}{' '}
        <Typography component="span" variant="caption" color="text.secondary">
          / {isUnlimited ? '\u221E' : limit}
        </Typography>
      </Typography>
      {!isUnlimited && (
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            mt: 0.5,
            height: 4,
            borderRadius: 2,
            bgcolor: alpha(color, 0.15),
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 }
          }}
        />
      )}
    </Box>
  );
};

// ==============================|| PLAN LIMIT CARD ||============================== //

const PlanLimitCard = ({ plan, editedLimits, onLimitChange, onToggleUnlimited, onSave, onReset, saving, hasChanges }) => {
  const theme = useTheme();
  const meta = PLAN_META[plan.planId] || PLAN_META.essential;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        {/* Plan header */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: alpha(
                meta.color === 'default'
                  ? theme.palette.grey[500]
                  : meta.color === 'primary'
                  ? theme.palette.primary.main
                  : theme.palette.warning.main,
                0.1
              )
            }}
          >
            {meta.icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5">{plan.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {plan.description}
            </Typography>
          </Box>
          <Chip label={meta.label} color={meta.color} size="small" variant="outlined" />
        </Stack>

        {/* Limit rows */}
        <Stack spacing={1.5}>
          {LIMIT_KEYS.map((key) => {
            const value = editedLimits[key];
            const isUnlimited = value === -1;
            const info = LIMIT_LABELS[key];

            return (
              <Stack key={key} direction="row" alignItems="center" spacing={1}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="body2" noWrap>
                      {info.label}
                    </Typography>
                    <Tooltip title={info.description} arrow placement="top">
                      <InfoCircleOutlined style={{ fontSize: 12, color: theme.palette.text.disabled, cursor: 'help' }} />
                    </Tooltip>
                  </Stack>
                </Box>
                <TextField
                  type="number"
                  size="small"
                  value={isUnlimited ? '' : (value ?? 0)}
                  disabled={isUnlimited}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 0) {
                      onLimitChange(plan.planId, key, val);
                    }
                  }}
                  inputProps={{ min: 0, style: { textAlign: 'right' } }}
                  sx={{ width: 100 }}
                  placeholder={isUnlimited ? 'Unlimited' : '0'}
                />
                <Tooltip title={isUnlimited ? 'Set to limited' : 'Set to unlimited'} arrow>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {isUnlimited ? 'Unl.' : 'Ltd.'}
                    </Typography>
                    <Switch
                      size="small"
                      checked={isUnlimited}
                      onChange={() => onToggleUnlimited(plan.planId, key)}
                    />
                  </Stack>
                </Tooltip>
              </Stack>
            );
          })}
        </Stack>

        {/* Actions */}
        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveOutlined />}
            onClick={() => onSave(plan.planId)}
            disabled={saving || !hasChanges}
            fullWidth
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<UndoOutlined />}
            onClick={() => onReset(plan.planId)}
            disabled={saving}
          >
            Reset
          </Button>
        </Stack>

        {plan.updatedAt && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}>
            Last updated: {new Date(plan.updatedAt).toLocaleDateString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// ==============================|| SUBSCRIPTION LIMITS PAGE ||============================== //

const InternalSubscriptionLimitsPage = () => {
  const theme = useTheme();
  const { user, loading: userLoading } = useUser();

  const [plans, setPlans] = useState([]);
  const [editedLimits, setEditedLimits] = useState({});
  const [originalLimits, setOriginalLimits] = useState({});
  const [codeDefaults, setCodeDefaults] = useState({});
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/internal/subscription-limits');
      if (!response.ok) throw new Error('Failed to fetch subscription plans');
      const data = await response.json();
      setPlans(data.plans);
      setOrganizations(data.organizations || []);

      const initial = {};
      const originals = {};
      const defaults = {};
      data.plans.forEach((plan) => {
        const limits = {};
        LIMIT_KEYS.forEach((key) => {
          limits[key] = plan.resourceLimits?.[key] ?? plan.codeDefaults?.[key] ?? 0;
        });
        initial[plan.planId] = limits;
        originals[plan.planId] = { ...limits };
        defaults[plan.planId] = plan.codeDefaults || {};
      });
      setEditedLimits(initial);
      setOriginalLimits(originals);
      setCodeDefaults(defaults);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isOwner = user?.role?.toLowerCase() === 'owner';
    if (isOwner) {
      fetchPlans();
    }
  }, [user, fetchPlans]);

  const handleLimitChange = (planId, key, value) => {
    setEditedLimits((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [key]: value
      }
    }));
  };

  const handleToggleUnlimited = (planId, key) => {
    setEditedLimits((prev) => {
      const current = prev[planId][key];
      return {
        ...prev,
        [planId]: {
          ...prev[planId],
          [key]: current === -1 ? (codeDefaults[planId]?.[key] ?? 0) : -1
        }
      };
    });
  };

  const handleSave = async (planId) => {
    setSaving((prev) => ({ ...prev, [planId]: true }));
    try {
      const response = await fetch('/api/internal/subscription-limits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          resourceLimits: editedLimits[planId]
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save');
      }
      setSnackbar({ open: true, message: `${PLAN_META[planId]?.label || planId} limits updated successfully`, severity: 'success' });
      // Update originals to reflect saved state
      setOriginalLimits((prev) => ({
        ...prev,
        [planId]: { ...editedLimits[planId] }
      }));
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setSaving((prev) => ({ ...prev, [planId]: false }));
    }
  };

  const handleReset = (planId) => {
    const defaults = codeDefaults[planId] || {};
    const resetLimits = {};
    LIMIT_KEYS.forEach((key) => {
      resetLimits[key] = defaults[key] ?? 0;
    });
    setEditedLimits((prev) => ({
      ...prev,
      [planId]: resetLimits
    }));
  };

  const hasChanges = (planId) => {
    const current = editedLimits[planId];
    const original = originalLimits[planId];
    if (!current || !original) return false;
    return LIMIT_KEYS.some((key) => current[key] !== original[key]);
  };

  const isOwner = user?.role?.toLowerCase() === 'owner';

  // Loading state
  if (userLoading) {
    return (
      <Page title="Subscription Limits">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  // Not owner
  if (!isOwner) {
    return (
      <Page title="Subscription Limits">
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
    <Page title="Subscription Limits">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4">Subscription Limits</Typography>
            <Typography variant="body2" color="text.secondary">
              Set resource limits for each subscription plan. Use -1 or the toggle for unlimited.
            </Typography>
          </Box>
          <Chip icon={<CrownOutlined />} label="Owner Only" color="warning" variant="outlined" />
        </Stack>

        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} md={4} key={i}>
                <Card variant="outlined">
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                    {LIMIT_KEYS.map((key) => (
                      <Skeleton key={key} variant="rectangular" height={36} sx={{ mb: 1, borderRadius: 1 }} />
                    ))}
                    <Skeleton variant="rectangular" height={36} sx={{ mt: 2, borderRadius: 1 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={3}>
            {plans.map((plan) => (
              <Grid item xs={12} md={4} key={plan.planId}>
                <PlanLimitCard
                  plan={plan}
                  editedLimits={editedLimits[plan.planId] || {}}
                  onLimitChange={handleLimitChange}
                  onToggleUnlimited={handleToggleUnlimited}
                  onSave={handleSave}
                  onReset={handleReset}
                  saving={saving[plan.planId] || false}
                  hasChanges={hasChanges(plan.planId)}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Organization Usage Table */}
        {!loading && (
          <MainCard
            title="Organization Usage"
            secondary={
              <Typography variant="caption" color="text.secondary">
                Current resource usage vs plan limits for each organization
              </Typography>
            }
            sx={{ mt: 3 }}
          >
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Organization</TableCell>
                    <TableCell>Plan</TableCell>
                    {USAGE_COLUMNS.map((col) => (
                      <TableCell key={col.usageKey} align="center">
                        {col.label}
                      </TableCell>
                    ))}
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {organizations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={USAGE_COLUMNS.length + 3} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No organizations found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    organizations.map((org) => {
                      const hasAnyOverage = USAGE_COLUMNS.some((col) => {
                        const limit = org.limits?.[col.limitKey];
                        return limit !== -1 && limit !== undefined && limit > 0 && org.usage[col.usageKey] >= limit;
                      });

                      return (
                        <TableRow
                          key={org.id}
                          sx={{
                            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
                            ...(hasAnyOverage && { backgroundColor: alpha(theme.palette.error.main, 0.03) })
                          }}
                        >
                          <TableCell>
                            <Typography variant="subtitle2">{org.name}</Typography>
                          </TableCell>
                          <TableCell>
                            {org.planId ? (
                              <Chip
                                size="small"
                                label={PLAN_META[org.planId]?.label || org.planName}
                                color={PLAN_META[org.planId]?.color || 'default'}
                                icon={PLAN_META[org.planId]?.icon}
                                variant="filled"
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No plan
                              </Typography>
                            )}
                          </TableCell>
                          {USAGE_COLUMNS.map((col) => (
                            <TableCell key={col.usageKey} align="center">
                              <UsageCell
                                used={org.usage[col.usageKey] || 0}
                                limit={org.limits?.[col.limitKey]}
                              />
                            </TableCell>
                          ))}
                          <TableCell align="center">
                            {hasAnyOverage ? (
                              <Tooltip title="At or over limit on one or more resources">
                                <WarningOutlined style={{ color: theme.palette.error.main, fontSize: 18 }} />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Within limits">
                                <CheckCircleOutlined style={{ color: theme.palette.success.main, fontSize: 18 }} />
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </MainCard>
        )}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Page>
  );
};

InternalSubscriptionLimitsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default InternalSubscriptionLimitsPage;
