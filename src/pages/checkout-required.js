import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// material-ui
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Typography
} from '@mui/material';

// icons
import { CreditCardOutlined, ArrowLeftOutlined } from '@ant-design/icons';

// project import
import Layout from 'layout';
import axios from 'utils/axios';

const CheckoutRequiredPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinueToCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/subscriptions/checkout', {
        planId: 'professional',
        interval: 'monthly'
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        setError('Failed to create checkout session. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.error || err.message || 'Failed to create checkout session.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}
            >
              <CreditCardOutlined style={{ fontSize: 36, color: 'white' }} />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Complete Your Setup
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              You selected the <strong>Professional</strong> plan with a 14-day free trial.
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              To activate your trial, please add your payment details. You won&apos;t be charged until the trial ends.
            </Typography>

            {error && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleContinueToCheckout}
              disabled={loading}
              sx={{
                py: 1.5,
                mb: 2,
                fontSize: '1rem',
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#1565c0' }
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Continue to Payment'
              )}
            </Button>

            <Button
              variant="text"
              size="small"
              onClick={handleLogout}
              sx={{ color: 'text.secondary' }}
            >
              Log out
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

CheckoutRequiredPage.getLayout = function getLayout(page) {
  return <Layout variant="landing">{page}</Layout>;
};

export default CheckoutRequiredPage;
