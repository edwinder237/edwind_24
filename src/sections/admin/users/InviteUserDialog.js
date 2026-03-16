import { useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';

// icons
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';
import axios from 'utils/axios';

// ==============================|| INVITE USER PANEL ||============================== //

const InviteUserDialog = ({ onClose, subOrganizations, systemRoles }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'member',
    sub_organizationId: subOrganizations?.[0]?.id || '',
    appRoleId: ''
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
        sub_organizationId: formData.sub_organizationId || null,
        appRoleId: formData.appRoleId || null
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
            sub_organizationId: '',
            appRoleId: ''
          });
          onClose(true);
        }, 1500);
      }
    } catch (err) {
      console.error('Invite error:', err);
      // axios interceptor unwraps error.response.data, so err may be the data object directly
      const message = err.error || err.response?.data?.error || err.message || 'Failed to send invitation';
      const details = err.details || err.response?.data?.details;
      setError(details ? `${message}: ${details}` : message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (!loading) {
      onClose(false);
    }
  };

  return (
    <MainCard
      title={
        <Typography variant="h5">
          <MailOutlined style={{ marginRight: 8 }} />
          Invite New User
        </Typography>
      }
      secondary={
        <Button
          variant="outlined"
          startIcon={<ArrowLeftOutlined />}
          onClick={handleBack}
          disabled={loading}
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

        {/* Application Role */}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Application Role</InputLabel>
            <Select
              value={formData.appRoleId}
              label="Application Role"
              onChange={handleChange('appRoleId')}
              disabled={loading || formData.role === 'admin'}
            >
              <MenuItem value="">
                <em>Viewer (default)</em>
              </MenuItem>
              {systemRoles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name} - {role.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !formData.email}
            startIcon={loading ? <CircularProgress size={16} /> : <MailOutlined />}
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </Grid>
      </Grid>
    </MainCard>
  );
};

InviteUserDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  subOrganizations: PropTypes.array,
  systemRoles: PropTypes.array
};

InviteUserDialog.defaultProps = {
  subOrganizations: [],
  systemRoles: []
};

export default InviteUserDialog;
