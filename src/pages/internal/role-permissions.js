import { useState, useEffect, useCallback } from 'react';

// material-ui
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Stack,
  Switch,
  Tooltip,
  Typography,
  alpha,
  useTheme
} from '@mui/material';

// icons
import {
  SettingOutlined,
  LockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownOutlined,
  ReloadOutlined
} from '@ant-design/icons';

// project imports
import Layout from 'layout';
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';
import axios from 'utils/axios';

// Category labels
const CATEGORY_CONFIG = {
  projects: { label: 'Projects', icon: '📁' },
  courses: { label: 'Courses & Curriculums', icon: '📚' },
  events: { label: 'Events & Schedule', icon: '📅' },
  participants: { label: 'Participants', icon: '👥' },
  assessments: { label: 'Assessments', icon: '📝' },
  timeline: { label: 'Timeline', icon: '📊' },
  kirkpatrick: { label: 'Kirkpatrick Evaluations', icon: '📈' },
  reports: { label: 'Reports & Certificates', icon: '📋' },
  resources: { label: 'Resources', icon: '🏢' },
  user_management: { label: 'User Management', icon: '👤' },
  settings: { label: 'Settings', icon: '⚙️' }
};

const LEVEL_COLORS = {
  2: 'primary',
  3: 'secondary',
  4: 'default'
};

// ==============================|| INTERNAL - DEFAULT ROLE PERMISSIONS ||============================== //

const RolePermissionsPage = () => {
  const theme = useTheme();
  const { user, isLoading: userLoading } = useUser();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Permission dialog
  const [selectedRole, setSelectedRole] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rolePermissions, setRolePermissions] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [savingPermission, setSavingPermission] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState([]);

  const isOwner = user?.role?.toLowerCase() === 'owner';

  // Fetch all roles
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/internal/role-permissions');
      setRoles(response.data.roles || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError(err.response?.data?.error || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch permissions for a specific role
  const fetchRolePermissions = async (roleId) => {
    setPermissionsLoading(true);
    try {
      const response = await axios.get(`/api/internal/role-permissions?roleId=${roleId}`);
      setRolePermissions(response.data);
      setExpandedCategories([]);
    } catch (err) {
      console.error('Error fetching role permissions:', err);
      setError(err.response?.data?.error || 'Failed to fetch permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Toggle a single permission
  const handleTogglePermission = async (permissionId, currentEnabled) => {
    setSavingPermission(permissionId);
    setSuccess('');
    try {
      const response = await axios.put('/api/internal/role-permissions', {
        roleId: selectedRole.id,
        permissionId,
        isEnabled: !currentEnabled
      });
      setSuccess(`${response.data.permissionKey} ${!currentEnabled ? 'enabled' : 'disabled'}`);
      await fetchRolePermissions(selectedRole.id);
      // Refresh role list to update counts
      fetchRoles();
    } catch (err) {
      console.error('Error toggling permission:', err);
      setError(err.response?.data?.error || 'Failed to update permission');
    } finally {
      setSavingPermission(null);
    }
  };

  const handleOpenPermissions = (role) => {
    setSelectedRole(role);
    setDialogOpen(true);
    setSuccess('');
    fetchRolePermissions(role.id);
  };

  const handleClosePermissions = () => {
    setDialogOpen(false);
    setSelectedRole(null);
    setRolePermissions(null);
    setExpandedCategories([]);
    setSuccess('');
  };

  const handleToggleCategory = (category) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  useEffect(() => {
    if (isOwner) {
      fetchRoles();
    }
  }, [isOwner, fetchRoles]);

  if (userLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isOwner) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <MainCard>
          <Typography variant="h5" color="error">Access Denied</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            This page is only accessible to platform owners.
          </Typography>
        </MainCard>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <MainCard
        title="Default Role Permissions"
        secondary={
          <Button
            variant="outlined"
            startIcon={<ReloadOutlined />}
            onClick={fetchRoles}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      >
        {/* Info */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Manage <strong>system-wide default permissions</strong> for each application role (Level 2-4).
            Changes here apply to all organizations unless overridden at the organization level.
            Level 0-1 roles (Owner/Admin) are managed via WorkOS and always have full access.
          </Typography>
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Roles Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {roles.map((role) => (
              <Grid item xs={12} sm={6} md={4} key={role.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: theme.shadows[4]
                    }
                  }}
                  onClick={() => handleOpenPermissions(role)}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h5" gutterBottom>
                            {role.name}
                          </Typography>
                          <Chip
                            label={`Level ${role.hierarchyLevel}`}
                            size="small"
                            color={LEVEL_COLORS[role.hierarchyLevel] || 'default'}
                            variant="outlined"
                          />
                        </Box>
                        <IconButton size="small" color="primary">
                          <SettingOutlined />
                        </IconButton>
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        {role.description}
                      </Typography>

                      <Divider />

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {role.permissionCount} default permissions
                        </Typography>
                        <Chip
                          label="Manage"
                          size="small"
                          color="primary"
                          variant="outlined"
                          icon={<LockOutlined />}
                        />
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </MainCard>

      {/* Permissions Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleClosePermissions}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5">
                {selectedRole?.name} — Default Permissions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System-wide defaults for all organizations
              </Typography>
            </Box>
            {rolePermissions && (
              <Chip
                label={`${rolePermissions.totalEnabled} / ${rolePermissions.totalPermissions}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {permissionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : rolePermissions ? (
            <Stack spacing={2}>
              {/* Legend */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <Stack direction="row" spacing={3} flexWrap="wrap">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlined style={{ color: theme.palette.success.main }} />
                    <Typography variant="caption">Enabled</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CloseCircleOutlined style={{ color: theme.palette.text.disabled }} />
                    <Typography variant="caption">Disabled</Typography>
                  </Stack>
                </Stack>
              </Paper>

              {success && (
                <Alert severity="success" onClose={() => setSuccess('')}>
                  {success}
                </Alert>
              )}

              {/* Permission Categories */}
              {Object.entries(rolePermissions.permissionsByCategory).map(([category, permissions]) => (
                <Accordion
                  key={category}
                  expanded={expandedCategories.includes(category)}
                  onChange={() => handleToggleCategory(category)}
                  variant="outlined"
                >
                  <AccordionSummary expandIcon={<DownOutlined />}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="body1">
                        {CATEGORY_CONFIG[category]?.icon} {CATEGORY_CONFIG[category]?.label || category}
                      </Typography>
                      <Chip
                        label={`${permissions.filter(p => p.isEnabled).length}/${permissions.length}`}
                        size="small"
                        color={permissions.filter(p => p.isEnabled).length === permissions.length ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      {permissions.map((perm) => (
                        <Paper
                          key={perm.id}
                          variant="outlined"
                          sx={{ p: 1.5 }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {perm.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {perm.key}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={perm.isEnabled}
                                    onChange={() => handleTogglePermission(perm.id, perm.isEnabled)}
                                    disabled={savingPermission === perm.id}
                                    size="small"
                                    color={perm.isEnabled ? 'success' : 'default'}
                                  />
                                }
                                label=""
                                sx={{ m: 0 }}
                              />
                              {savingPermission === perm.id && (
                                <CircularProgress size={16} />
                              )}
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClosePermissions}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

RolePermissionsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default RolePermissionsPage;
