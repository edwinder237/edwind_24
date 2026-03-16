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
  Chip,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
  PlusOutlined,
  EditOutlined,
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LinkOutlined,
  DisconnectOutlined,
  LockOutlined,
  DownOutlined,
  UndoOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';

// project imports
import Layout from 'layout';
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';
import axios from 'utils/axios';
import InviteUserDialog from 'sections/admin/users/InviteUserDialog';
import EditUserDialog from 'sections/admin/users/EditUserDialog';

// Admin role check
const ADMIN_ROLES = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];

// Category labels and icons (shared with roles page)
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

// ==============================|| ADMIN - USERS PAGE ||============================== //

const AdminUsersPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { user, isLoading: userLoading, isAuthenticated } = useUser();

  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [showInactive, setShowInactive] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterAppRole, setFilterAppRole] = useState('all');
  const [systemRoles, setSystemRoles] = useState([]);

  // Dialogs
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Sub-organizations for assignment
  const [subOrganizations, setSubOrganizations] = useState([]);

  // User permissions management
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [savingPermission, setSavingPermission] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [savingCategory, setSavingCategory] = useState(null);

  // Check if current user is admin
  const isAdmin = user?.organizations?.some(
    org => ADMIN_ROLES.includes(org.role?.toLowerCase())
  ) || user?.role && ADMIN_ROLES.includes(user.role.toLowerCase());

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        search
      });

      if (!showInactive) {
        params.append('isActive', 'true');
      }

      if (filterRole !== 'all') {
        params.append('role', filterRole);
      }

      if (filterAppRole !== 'all') {
        params.append('appRole', filterAppRole);
      }

      const response = await axios.get(`/api/admin/users?${params.toString()}`);
      setUsers(response.data.users);
      setTotalCount(response.data.pagination.total);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, showInactive, filterRole, filterAppRole]);

  // Fetch system roles
  const fetchSystemRoles = async () => {
    try {
      const response = await axios.get('/api/admin/roles');
      setSystemRoles(response.data.roles || []);
    } catch (err) {
      console.error('Error fetching system roles:', err);
    }
  };

  // Fetch sub-organizations
  const fetchSubOrganizations = async () => {
    try {
      const response = await axios.get('/api/organization/sub-organizations');
      setSubOrganizations(response.data.subOrganizations || []);
    } catch (err) {
      console.error('Error fetching sub-organizations:', err);
    }
  };

  // --- User permission handlers ---

  const fetchUserPermissions = async (userId, keepExpanded = false) => {
    setPermissionsLoading(true);
    try {
      const response = await axios.get(`/api/admin/users/${userId}/permissions`);
      setUserPermissions(response.data);
      if (!keepExpanded) {
        setExpandedCategories([]);
      }
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setError(err.response?.data?.error || 'Failed to fetch permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleToggleUserPermission = async (permissionId, currentEnabled) => {
    setSavingPermission(permissionId);
    try {
      await axios.put(`/api/admin/users/${selectedUserForPermissions.id}/permissions`, {
        permissionId,
        isEnabled: !currentEnabled
      });
      await fetchUserPermissions(selectedUserForPermissions.id, true);
    } catch (err) {
      console.error('Error toggling permission:', err);
      setError(err.response?.data?.error || 'Failed to update permission');
    } finally {
      setSavingPermission(null);
    }
  };

  const handleToggleCategoryPermissions = async (category, permissions, currentlyEnabled) => {
    setSavingCategory(category);
    try {
      const newState = !currentlyEnabled;
      const overrides = permissions.map(p => ({
        permissionId: p.id,
        isEnabled: newState
      }));

      await axios.put(`/api/admin/users/${selectedUserForPermissions.id}/permissions`, { overrides });
      await fetchUserPermissions(selectedUserForPermissions.id, true);
    } catch (err) {
      console.error('Error toggling category permissions:', err);
      setError(err.response?.data?.error || 'Failed to update permissions');
    } finally {
      setSavingCategory(null);
    }
  };

  const handleResetUserOverrides = async () => {
    if (!confirm('This will remove all user-specific permission overrides. The user will revert to their role defaults. Continue?')) {
      return;
    }

    setPermissionsLoading(true);
    try {
      const overrides = [];
      for (const category of Object.values(userPermissions.permissionsByCategory)) {
        for (const perm of category) {
          if (perm.hasUserOverride) {
            overrides.push({
              permissionId: perm.id,
              isEnabled: perm.effectiveFromRole
            });
          }
        }
      }

      if (overrides.length > 0) {
        await axios.put(`/api/admin/users/${selectedUserForPermissions.id}/permissions`, { overrides });
      }

      await fetchUserPermissions(selectedUserForPermissions.id);
    } catch (err) {
      console.error('Error resetting overrides:', err);
      setError(err.response?.data?.error || 'Failed to reset overrides');
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleOpenUserPermissions = (userRow) => {
    setSelectedUserForPermissions(userRow);
    setError('');
    fetchUserPermissions(userRow.id);
  };

  const handleBackToUsers = () => {
    setSelectedUserForPermissions(null);
    setUserPermissions(null);
    setExpandedCategories([]);
    setError('');
  };

  const handleToggleCategory = (category) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers();
      fetchSubOrganizations();
      fetchSystemRoles();
    }
  }, [isAuthenticated, isAdmin, fetchUsers]);

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

  // Handle toggle active
  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await axios.put(`/api/admin/users/${userId}`, {
        isActive: !currentStatus
      });
      fetchUsers();
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError(err.response?.data?.error || 'Failed to update user status');
    }
  };

  // Handle edit click
  const handleEditClick = (userToEdit) => {
    setSelectedUser(userToEdit);
  };

  // Handle dialog close
  const handleInviteClose = (success) => {
    setInviteDialogOpen(false);
    if (success) {
      fetchUsers();
    }
  };

  const handleEditClose = (success) => {
    setSelectedUser(null);
    if (success) {
      fetchUsers();
    }
  };

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

  // ========== Invite User View ==========
  if (inviteDialogOpen) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <InviteUserDialog
          onClose={handleInviteClose}
          subOrganizations={subOrganizations}
          systemRoles={systemRoles}
        />
      </Container>
    );
  }

  // ========== Edit User View ==========
  if (selectedUser) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <EditUserDialog
          onClose={handleEditClose}
          user={selectedUser}
          subOrganizations={subOrganizations}
          systemRoles={systemRoles}
        />
      </Container>
    );
  }

  // ========== User Permissions View ==========
  if (selectedUserForPermissions) {
    const userName = selectedUserForPermissions.name
      || `${selectedUserForPermissions.firstName || ''} ${selectedUserForPermissions.lastName || ''}`.trim()
      || selectedUserForPermissions.email;

    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <MainCard
          title={
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h5">
                {userName}
              </Typography>
              {userPermissions?.role && (
                <Chip
                  label={userPermissions.role.name}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {userPermissions?.userOverrideCount > 0 && (
                <Chip
                  label={`${userPermissions.userOverrideCount} user override${userPermissions.userOverrideCount !== 1 ? 's' : ''}`}
                  color="info"
                  size="small"
                />
              )}
            </Stack>
          }
          secondary={
            <Stack direction="row" spacing={2}>
              {userPermissions?.userOverrideCount > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<UndoOutlined />}
                  onClick={handleResetUserOverrides}
                  color="warning"
                  disabled={permissionsLoading}
                >
                  Reset User Overrides
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<ArrowLeftOutlined />}
                onClick={handleBackToUsers}
              >
                Back to Users
              </Button>
            </Stack>
          }
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Manage individual permission overrides for this user. Changes here take priority over role and organization defaults.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {permissionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : userPermissions ? (
            <Stack spacing={2}>
              {/* Legend */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <Stack direction="row" spacing={3} flexWrap="wrap">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlined style={{ color: theme.palette.success.main }} />
                    <Typography variant="caption">Enabled (role default)</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CloseCircleOutlined style={{ color: theme.palette.text.disabled }} />
                    <Typography variant="caption">Disabled (role default)</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 8, height: 8, bgcolor: 'warning.main', borderRadius: '50%' }} />
                    <Typography variant="caption">Org-level override</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 8, height: 8, bgcolor: 'info.main', borderRadius: '50%' }} />
                    <Typography variant="caption">User-specific override</Typography>
                  </Stack>
                </Stack>
              </Paper>

              {!userPermissions.role && (
                <Alert severity="warning">
                  This user has no application role assigned. All permissions default to disabled.
                  Assign a role first, or use user overrides to grant specific permissions.
                </Alert>
              )}

              {/* Permission Categories */}
              {Object.entries(userPermissions.permissionsByCategory).map(([category, permissions]) => {
                const allEnabled = permissions.every(p => p.isEnabled);
                const someEnabled = permissions.some(p => p.isEnabled);
                return (
                <Accordion
                  key={category}
                  expanded={expandedCategories.includes(category)}
                  onChange={() => handleToggleCategory(category)}
                  variant="outlined"
                >
                  <AccordionSummary expandIcon={<DownOutlined />}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', mr: 1 }}>
                      <Typography variant="body1" sx={{ flex: 1 }}>
                        {CATEGORY_CONFIG[category]?.icon} {CATEGORY_CONFIG[category]?.label || category}
                      </Typography>
                      <Chip
                        label={`${permissions.filter(p => p.isEnabled).length}/${permissions.length}`}
                        size="small"
                        color={allEnabled ? 'success' : 'default'}
                        variant="outlined"
                      />
                      {permissions.some(p => p.hasUserOverride) && (
                        <Chip
                          label="User Modified"
                          size="small"
                          color="info"
                          variant="filled"
                        />
                      )}
                      <Tooltip title={someEnabled ? 'Disable all' : 'Enable all'}>
                        <Switch
                          checked={someEnabled}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleCategoryPermissions(category, permissions, someEnabled);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={savingCategory === category}
                          size="small"
                          color="success"
                        />
                      </Tooltip>
                      {savingCategory === category && (
                        <CircularProgress size={16} />
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
                            bgcolor: perm.hasUserOverride
                              ? alpha(theme.palette.info.main, 0.08)
                              : perm.hasOrgOverride
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
                                {perm.hasUserOverride && (
                                  <Chip
                                    label="User Override"
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    sx={{ fontSize: '0.6rem', height: 20 }}
                                  />
                                )}
                                {perm.hasOrgOverride && !perm.hasUserOverride && (
                                  <Chip
                                    label="Org Override"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ fontSize: '0.6rem', height: 20 }}
                                  />
                                )}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {perm.key}
                                {' | Role: '}
                                {perm.isRoleDefault ? 'On' : 'Off'}
                                {perm.hasOrgOverride ? ` | Org: ${perm.effectiveFromRole ? 'On' : 'Off'}` : ''}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={perm.isEnabled}
                                    onChange={() => handleToggleUserPermission(perm.id, perm.isEnabled)}
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
                );
              })}
            </Stack>
          ) : null}
        </MainCard>
      </Container>
    );
  }

  // ========== Users List View ==========
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <MainCard
        title="User Management"
        secondary={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<LockOutlined />}
              onClick={() => router.push('/admin/roles')}
            >
              Roles & Permissions
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReloadOutlined />}
              onClick={fetchUsers}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<PlusOutlined />}
              onClick={() => setInviteDialogOpen(true)}
            >
              Invite User
            </Button>
          </Stack>
        }
      >
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search users..."
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
          <Grid item xs={12} sm={3} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showInactive}
                  onChange={(e) => {
                    setShowInactive(e.target.checked);
                    setPage(0);
                  }}
                  size="small"
                />
              }
              label="Show inactive"
            />
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>WorkOS Role</InputLabel>
              <Select
                value={filterRole}
                label="WorkOS Role"
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="owner">Owner</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>App Role</InputLabel>
              <Select
                value={filterAppRole}
                label="App Role"
                onChange={(e) => {
                  setFilterAppRole(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All App Roles</MenuItem>
                {systemRoles.map((role) => (
                  <MenuItem key={role.slug} value={role.slug}>
                    {role.name}
                  </MenuItem>
                ))}
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

        {/* Users Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>WorkOS Role</TableCell>
                <TableCell>App Role</TableCell>
                <TableCell>Sub-Organization</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">WorkOS</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Active</TableCell>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((userRow) => (
                  <TableRow
                    key={userRow.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                      },
                      opacity: userRow.isActive ? 1 : 0.6
                    }}
                  >
                    <TableCell>
                      <Typography variant="subtitle2">
                        {userRow.name || `${userRow.firstName} ${userRow.lastName}`.trim() || 'Unnamed'}
                      </Typography>
                      {!userRow.isActive && (
                        <Chip
                          label={userRow.workos_user_id ? 'Inactive' : 'Pending'}
                          size="small"
                          color={userRow.workos_user_id ? 'default' : 'warning'}
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{userRow.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={userRow.role || 'member'}
                        size="small"
                        color={
                          userRow.role === 'admin' || userRow.role === 'owner'
                            ? 'primary'
                            : 'default'
                        }
                        variant={userRow.role === 'owner' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      {userRow.appRole ? (
                        <Chip
                          label={userRow.appRole.name}
                          size="small"
                          color={
                            userRow.appRole.hierarchyLevel === 2 ? 'primary' :
                            userRow.appRole.hierarchyLevel === 3 ? 'secondary' : 'default'
                          }
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {userRow.sub_organization?.title || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={
                        userRow.id === user?.id
                          ? 'You cannot deactivate your own account'
                          : userRow.isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'
                      }>
                        <span>
                          <Switch
                            checked={userRow.isActive}
                            onChange={() => handleToggleActive(userRow.id, userRow.isActive)}
                            color="success"
                            size="small"
                            disabled={userRow.id === user?.id}
                          />
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={userRow.workos_user_id ? 'Linked to WorkOS' : 'Not linked to WorkOS'}>
                        {userRow.workos_user_id ? (
                          <LinkOutlined style={{ color: theme.palette.success.main, fontSize: 18 }} />
                        ) : (
                          <DisconnectOutlined style={{ color: theme.palette.text.disabled, fontSize: 18 }} />
                        )}
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(userRow.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {userRow.lastActiveAt
                          ? new Date(userRow.lastActiveAt).toLocaleDateString()
                          : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(userRow)}
                          >
                            <EditOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={userRow.appRole ? 'Manage Permissions' : 'Assign an app role first'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenUserPermissions(userRow)}
                              disabled={!userRow.appRole && !ADMIN_ROLES.includes(userRow.role?.toLowerCase())}
                              color="primary"
                            >
                              <LockOutlined />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
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
  );
};

AdminUsersPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default AdminUsersPage;
