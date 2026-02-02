import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

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
  Tab,
  Tabs,
  Tooltip,
  Typography,
  alpha,
  useTheme
} from '@mui/material';

// icons
import {
  SettingOutlined,
  LockOutlined,
  UnlockOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownOutlined,
  ReloadOutlined,
  UndoOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';

// project imports
import Layout from 'layout';
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';
import axios from 'utils/axios';

// Admin role check
const ADMIN_ROLES = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];

// Category labels and icons
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

// Hierarchy level colors
const LEVEL_COLORS = {
  2: 'primary',
  3: 'secondary',
  4: 'default'
};

// ==============================|| ADMIN - ROLES PAGE ||============================== //

const AdminRolesPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { user, isLoading: userLoading, isAuthenticated } = useUser();

  // State
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected role for permission management
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [rolePermissions, setRolePermissions] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [savingPermission, setSavingPermission] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState([]);

  // Check if current user is admin
  const isAdmin = user?.organizations?.some(
    org => ADMIN_ROLES.includes(org.role?.toLowerCase())
  ) || user?.role && ADMIN_ROLES.includes(user.role.toLowerCase());

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get('/api/admin/roles');
      setRoles(response.data.roles || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError(err.response?.data?.error || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch role permissions
  const fetchRolePermissions = async (roleId) => {
    setPermissionsLoading(true);
    try {
      const response = await axios.get(`/api/admin/roles/${roleId}/permissions`);
      setRolePermissions(response.data);
      // Keep all categories collapsed by default
      setExpandedCategories([]);
    } catch (err) {
      console.error('Error fetching role permissions:', err);
      setError(err.response?.data?.error || 'Failed to fetch permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Toggle permission
  const handleTogglePermission = async (permissionId, currentEnabled) => {
    setSavingPermission(permissionId);
    try {
      await axios.put(`/api/admin/roles/${selectedRole.id}/permissions`, {
        permissionId,
        isEnabled: !currentEnabled
      });
      // Refresh permissions
      await fetchRolePermissions(selectedRole.id);
    } catch (err) {
      console.error('Error toggling permission:', err);
      setError(err.response?.data?.error || 'Failed to update permission');
    } finally {
      setSavingPermission(null);
    }
  };

  // Reset all overrides for this role
  const handleResetOverrides = async () => {
    if (!confirm('This will reset all permission overrides for this role in your organization. Continue?')) {
      return;
    }

    setPermissionsLoading(true);
    try {
      // Get all overridden permissions and reset them
      const overrides = [];
      for (const category of Object.values(rolePermissions.permissionsByCategory)) {
        for (const perm of category) {
          if (perm.hasOverride) {
            overrides.push({
              permissionId: perm.id,
              isEnabled: perm.isDefault // Set back to default
            });
          }
        }
      }

      if (overrides.length > 0) {
        await axios.put(`/api/admin/roles/${selectedRole.id}/permissions`, {
          overrides
        });
      }

      await fetchRolePermissions(selectedRole.id);
    } catch (err) {
      console.error('Error resetting overrides:', err);
      setError(err.response?.data?.error || 'Failed to reset overrides');
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Open permissions dialog
  const handleOpenPermissions = (role) => {
    setSelectedRole(role);
    setPermissionsDialogOpen(true);
    fetchRolePermissions(role.id);
  };

  // Close permissions dialog
  const handleClosePermissions = () => {
    setPermissionsDialogOpen(false);
    setSelectedRole(null);
    setRolePermissions(null);
    setExpandedCategories([]);
  };

  // Toggle category expansion
  const handleToggleCategory = (category) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchRoles();
    }
  }, [isAuthenticated, isAdmin, fetchRoles]);

  // Loading state
  if (userLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <MainCard>
          <Typography variant="h5" color="error">
            Access Denied
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            You do not have permission to access this page. Admin access is required.
          </Typography>
        </MainCard>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <MainCard
        title="Role & Permission Management"
        secondary={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<ArrowLeftOutlined />}
              onClick={() => router.push('/admin/users')}
            >
              Back to Users
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReloadOutlined />}
              onClick={fetchRoles}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        }
      >
        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Admin/Client Admin</strong> roles (Level 0-1) are managed via WorkOS and have full access.
            Below are the <strong>application roles</strong> (Level 2-4) that you can customize for your organization.
          </Typography>
        </Alert>

        {/* Error Alert */}
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
                          {role.permissionCount} permissions
                        </Typography>
                        <Chip
                          label="Manage Permissions"
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
        open={permissionsDialogOpen}
        onClose={handleClosePermissions}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5">
                {selectedRole?.name} Permissions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customize permissions for your organization
              </Typography>
            </Box>
            {rolePermissions?.overrideCount > 0 && (
              <Chip
                label={`${rolePermissions.overrideCount} override${rolePermissions.overrideCount !== 1 ? 's' : ''}`}
                color="warning"
                size="small"
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
                    <Typography variant="caption">Enabled (default)</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CloseCircleOutlined style={{ color: theme.palette.text.disabled }} />
                    <Typography variant="caption">Disabled (default)</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 8, height: 8, bgcolor: 'warning.main', borderRadius: '50%' }} />
                    <Typography variant="caption">Custom override</Typography>
                  </Stack>
                </Stack>
              </Paper>

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
                      {permissions.some(p => p.hasOverride) && (
                        <Chip
                          label="Modified"
                          size="small"
                          color="warning"
                          variant="filled"
                        />
                      )}
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      {permissions.map((perm) => (
                        <Paper
                          key={perm.id}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            bgcolor: perm.hasOverride
                              ? alpha(theme.palette.warning.main, 0.08)
                              : 'transparent'
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" fontWeight={500}>
                                  {perm.name}
                                </Typography>
                                {perm.hasOverride && (
                                  <Tooltip title="Custom override for your organization">
                                    <Box
                                      sx={{
                                        width: 8,
                                        height: 8,
                                        bgcolor: 'warning.main',
                                        borderRadius: '50%'
                                      }}
                                    />
                                  </Tooltip>
                                )}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {perm.key}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {!perm.isDefault && !perm.hasOverride && (
                                <Chip
                                  label="Not default"
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.65rem' }}
                                />
                              )}
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
          {rolePermissions?.overrideCount > 0 && (
            <Button
              startIcon={<UndoOutlined />}
              onClick={handleResetOverrides}
              color="warning"
              disabled={permissionsLoading}
            >
              Reset All Overrides
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleClosePermissions}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

AdminRolesPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default AdminRolesPage;
