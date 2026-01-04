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
  DisconnectOutlined
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
  const [filterActive, setFilterActive] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  // Dialogs
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Sub-organizations for assignment
  const [subOrganizations, setSubOrganizations] = useState([]);

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

      if (filterActive !== 'all') {
        params.append('isActive', filterActive);
      }

      if (filterRole !== 'all') {
        params.append('role', filterRole);
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
  }, [page, rowsPerPage, search, filterActive, filterRole]);

  // Fetch sub-organizations
  const fetchSubOrganizations = async () => {
    try {
      const response = await axios.get('/api/organization/sub-organizations');
      setSubOrganizations(response.data.subOrganizations || []);
    } catch (err) {
      console.error('Error fetching sub-organizations:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers();
      fetchSubOrganizations();
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
    setEditDialogOpen(true);
  };

  // Handle dialog close
  const handleInviteClose = (success) => {
    setInviteDialogOpen(false);
    if (success) {
      fetchUsers();
    }
  };

  const handleEditClose = (success) => {
    setEditDialogOpen(false);
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

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <MainCard
        title="User Management"
        secondary={
          <Stack direction="row" spacing={2}>
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
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterActive}
                label="Status"
                onChange={(e) => {
                  setFilterActive(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={filterRole}
                label="Role"
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
                <TableCell>Role</TableCell>
                <TableCell>Sub-Organization</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">WorkOS</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.primary.lighter,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <UserOutlined style={{ color: theme.palette.primary.main }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2">
                            {userRow.name || `${userRow.firstName} ${userRow.lastName}`.trim() || 'Unnamed'}
                          </Typography>
                          {userRow.status === 'pending' && (
                            <Chip label="Pending" size="small" color="warning" sx={{ mt: 0.5 }} />
                          )}
                        </Box>
                      </Stack>
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
                      <Typography variant="body2" color="text.secondary">
                        {userRow.sub_organization?.title || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={userRow.isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}>
                        <Switch
                          checked={userRow.isActive}
                          onChange={() => handleToggleActive(userRow.id, userRow.isActive)}
                          color="success"
                          size="small"
                        />
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
                    <TableCell align="center">
                      <Tooltip title="Edit User">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(userRow)}
                        >
                          <EditOutlined />
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

      {/* Invite User Dialog */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onClose={handleInviteClose}
        subOrganizations={subOrganizations}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={editDialogOpen}
        onClose={handleEditClose}
        user={selectedUser}
        subOrganizations={subOrganizations}
      />
    </Container>
  );
};

AdminUsersPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default AdminUsersPage;
