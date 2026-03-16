import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';

// icons
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';
import axios from 'utils/axios';

// Admin roles that are determined by WorkOS (Level 0-1)
const ADMIN_WORKOS_ROLES = ['owner', 'admin', 'organization admin', 'org admin', 'org-admin', 'administrator'];

// ==============================|| EDIT USER PANEL ||============================== //

const EditUserDialog = ({ onClose, user, subOrganizations, systemRoles }) => {
  const [loading, setLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [appRoleLoading, setAppRoleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user has admin WorkOS role (Level 0-1)
  const isAdminUser = user?.role && ADMIN_WORKOS_ROLES.includes(user.role.toLowerCase());

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'member',
    sub_organizationId: '',
    isActive: true,
    appRoleId: ''
  });

  // Initialize form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || 'member',
        sub_organizationId: user.sub_organization?.id || '',
        isActive: user.isActive !== false,
        appRoleId: user.appRole?.id || ''
      });
      setError('');
      setSuccess('');
    }
  }, [user]);

  const handleChange = (field) => (event) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  // Update local fields (name, sub-org, isActive)
  const handleSaveLocal = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(`/api/admin/users/${user.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        sub_organizationId: formData.sub_organizationId || null,
        isActive: formData.isActive
      });

      if (response.data.success) {
        setSuccess('User updated successfully');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Update role via WorkOS
  const handleSaveRole = async () => {
    if (!user.workos_user_id) {
      setError('Cannot update role: User is not linked to WorkOS');
      return;
    }

    setRoleLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(`/api/admin/users/${user.id}/role`, {
        role: formData.role
      });

      if (response.data.success) {
        setSuccess('Role updated successfully');
      }
    } catch (err) {
      console.error('Role update error:', err);
      setError(err.response?.data?.error || 'Failed to update role');
    } finally {
      setRoleLoading(false);
    }
  };

  // Update application role (Level 2-4)
  const handleSaveAppRole = async () => {
    setAppRoleLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(`/api/admin/users/${user.id}/app-role`, {
        roleId: formData.appRoleId || null
      });

      if (response.data.success) {
        setSuccess(response.data.message || 'Application role updated successfully');
      }
    } catch (err) {
      console.error('App role update error:', err);
      setError(err.response?.data?.error || 'Failed to update application role');
    } finally {
      setAppRoleLoading(false);
    }
  };

  const handleBack = () => {
    if (!loading && !roleLoading && !appRoleLoading) {
      onClose(success !== '');
    }
  };

  if (!user) return null;

  const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

  return (
    <MainCard
      title={
        <Typography variant="h5">
          Edit User: {userName}
        </Typography>
      }
      secondary={
        <Button
          variant="outlined"
          startIcon={<ArrowLeftOutlined />}
          onClick={handleBack}
          disabled={loading || roleLoading || appRoleLoading}
        >
          Back to Users
        </Button>
      }
    >
      <Grid container spacing={2}>
        {/* Error/Success alerts */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
          </Grid>
        )}
        {success && (
          <Grid item xs={12}>
            <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
          </Grid>
        )}

        {/* User Info Section */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            User Information
          </Typography>
        </Grid>

        {/* First Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            value={formData.firstName}
            onChange={handleChange('firstName')}
            disabled={loading}
          />
        </Grid>

        {/* Last Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            value={formData.lastName}
            onChange={handleChange('lastName')}
            disabled={loading}
          />
        </Grid>

        {/* Sub-Organization */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Sub-Organization</InputLabel>
            <Select
              value={formData.sub_organizationId}
              label="Sub-Organization"
              onChange={handleChange('sub_organizationId')}
              disabled={loading}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {subOrganizations.map((subOrg) => (
                <MenuItem key={subOrg.id} value={subOrg.id}>
                  {subOrg.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Active Status */}
        <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={handleChange('isActive')}
                color="success"
                disabled={loading}
              />
            }
            label={formData.isActive ? 'Active' : 'Inactive'}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleSaveLocal}
            disabled={loading || roleLoading}
            startIcon={loading ? <CircularProgress size={16} /> : <SaveOutlined />}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        {/* Role Section (WorkOS) */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Role (Managed by WorkOS)
          </Typography>
          {!user.workos_user_id && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This user is not linked to WorkOS. Role cannot be changed.
            </Alert>
          )}
        </Grid>

        <Grid item xs={12} sm={8}>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              label="Role"
              onChange={handleChange('role')}
              disabled={roleLoading || !user.workos_user_id}
            >
              <MenuItem value="member">Member</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="owner">Owner</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleSaveRole}
            disabled={loading || roleLoading || !user.workos_user_id}
            startIcon={roleLoading ? <CircularProgress size={16} /> : null}
            sx={{ height: '56px' }}
          >
            {roleLoading ? 'Updating...' : 'Update Role'}
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        {/* App Role Section (Level 2-4) */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Application Role (Permissions)
          </Typography>
          {isAdminUser ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              This user has Admin/Owner access via WorkOS. Application roles are not applicable for admin-tier users.
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              App roles control what features the user can access within the platform.
            </Alert>
          )}
        </Grid>

        <Grid item xs={12} sm={8}>
          <FormControl fullWidth>
            <InputLabel>Application Role</InputLabel>
            <Select
              value={formData.appRoleId || ''}
              label="Application Role"
              onChange={handleChange('appRoleId')}
              disabled={appRoleLoading || isAdminUser}
            >
              <MenuItem value="">
                <em>Not assigned (defaults to Viewer)</em>
              </MenuItem>
              {systemRoles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  <Stack>
                    <Typography variant="body2">{role.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {role.description}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleSaveAppRole}
            disabled={loading || appRoleLoading || isAdminUser}
            startIcon={appRoleLoading ? <CircularProgress size={16} /> : null}
            sx={{ height: '56px' }}
          >
            {appRoleLoading ? 'Updating...' : 'Update App Role'}
          </Button>
        </Grid>
      </Grid>
    </MainCard>
  );
};

EditUserDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  subOrganizations: PropTypes.array,
  systemRoles: PropTypes.array
};

EditUserDialog.defaultProps = {
  user: null,
  subOrganizations: [],
  systemRoles: []
};

export default EditUserDialog;
