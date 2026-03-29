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
import { LockOutlined } from '@ant-design/icons';

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
        <Stack spacing={2} alignItems="center">
          <Typography variant="body1" color="text.secondary">
            You will be redirected to reset your password securely.
          </Typography>
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
      </Box>
    </MainCard>
  );
};

export default TabPassword;
