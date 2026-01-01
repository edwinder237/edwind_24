import { useState } from 'react';

// material-ui
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography
} from '@mui/material';

// project import
import MainCard from 'components/MainCard';
import axios from 'utils/axios';

// assets
import { LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

// ==============================|| TAB - PASSWORD CHANGE ||============================== //

const TabPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResetPassword = async () => {
    setLoading(true);
    setError(null);

    try {
      // Request password reset URL from our API
      const response = await axios.post('/api/auth/password-reset');

      if (response.data.resetUrl) {
        // Redirect to WorkOS password reset page
        window.location.href = response.data.resetUrl;
      } else if (response.data.message) {
        // Show success message if email was sent
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error requesting password reset:', err);
      setError(err.response?.data?.error || 'Failed to initiate password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainCard title="Change Password">
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <SafetyCertificateOutlined style={{ fontSize: '4rem', color: '#1890ff', marginBottom: 24 }} />

        <Typography variant="h4" sx={{ mb: 2 }}>
          Secure Password Management
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
          For your security, password changes are handled through our secure authentication provider.
          Click the button below to be redirected to the secure password reset page.
        </Typography>

        <Stack spacing={2} alignItems="center">
          <Button
            variant="contained"
            size="large"
            onClick={handleResetPassword}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockOutlined />}
            sx={{ px: 4, py: 1.5 }}
          >
            {loading ? 'Redirecting...' : 'Change Password'}
          </Button>

          {error && (
            <Typography
              variant="body2"
              color={error.includes('sent') || error.includes('check') ? 'success.main' : 'error.main'}
              sx={{ mt: 2 }}
            >
              {error}
            </Typography>
          )}
        </Stack>

        <Box sx={{ mt: 6, p: 3, bgcolor: 'grey.100', borderRadius: 2, maxWidth: 500, mx: 'auto' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Why external password management?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your password is managed by WorkOS, an enterprise-grade authentication provider.
            This ensures your credentials are stored and processed with the highest security standards,
            including encryption and compliance with industry best practices.
          </Typography>
        </Box>
      </Box>
    </MainCard>
  );
};

export default TabPassword;
