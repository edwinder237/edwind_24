import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography
} from '@mui/material';

// icons
import { EditOutlined, SaveOutlined } from '@ant-design/icons';

// project imports
import axios from 'utils/axios';

// ==============================|| EDIT USER DIALOG ||============================== //

const EditUserDialog = ({ open, onClose, user, subOrganizations }) => {
  const [loading, setLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'member',
    sub_organizationId: '',
    isActive: true
  });

  // Initialize form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || 'member',
        sub_organizationId: user.sub_organization?.id || '',
        isActive: user.isActive !== false
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

  const handleDialogClose = () => {
    if (!loading && !roleLoading) {
      onClose(success !== '');
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <EditOutlined style={{ marginRight: 8 }} />
        Edit User: {user.email}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Error/Success alerts */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          {success && (
            <Grid item xs={12}>
              <Alert severity="success">{success}</Alert>
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
          <Grid item xs={12}>
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
          <Grid item xs={12}>
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
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleDialogClose} disabled={loading || roleLoading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EditUserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  subOrganizations: PropTypes.array
};

EditUserDialog.defaultProps = {
  user: null,
  subOrganizations: []
};

export default EditUserDialog;
