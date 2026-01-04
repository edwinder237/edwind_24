import { useState } from 'react';
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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from '@mui/material';

// icons
import { MailOutlined } from '@ant-design/icons';

// project imports
import axios from 'utils/axios';

// ==============================|| INVITE USER DIALOG ||============================== //

const InviteUserDialog = ({ open, onClose, subOrganizations }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'member',
    sub_organizationId: ''
  });

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError('');
  };

  const handleSubmit = async () => {
    // Validate email
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/admin/users/invite', {
        ...formData,
        sub_organizationId: formData.sub_organizationId || null
      });

      if (response.data.success) {
        setSuccess(`Invitation sent to ${formData.email}`);
        // Reset form after short delay
        setTimeout(() => {
          setFormData({
            email: '',
            firstName: '',
            lastName: '',
            role: 'member',
            sub_organizationId: ''
          });
          onClose(true);
        }, 1500);
      }
    } catch (err) {
      console.error('Invite error:', err);
      setError(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    if (!loading) {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'member',
        sub_organizationId: ''
      });
      setError('');
      setSuccess('');
      onClose(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <MailOutlined style={{ marginRight: 8 }} />
        Invite New User
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

          {/* Email */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder="user@example.com"
              disabled={loading}
            />
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

          {/* Role */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={handleChange('role')}
                disabled={loading}
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
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
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleDialogClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.email}
          startIcon={loading ? <CircularProgress size={16} /> : <MailOutlined />}
        >
          {loading ? 'Sending...' : 'Send Invitation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

InviteUserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  subOrganizations: PropTypes.array
};

InviteUserDialog.defaultProps = {
  subOrganizations: []
};

export default InviteUserDialog;
