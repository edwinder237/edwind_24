import { useEffect } from 'react';
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
import { StopOutlined } from '@ant-design/icons';

// project import
import Layout from 'layout';
import useUser from 'hooks/useUser';

const SubscriptionInactivePage = () => {
  const { user } = useUser();
  const router = useRouter();

  const subscriptionStatus = user?.subscription?.status;

  // Redirect away if subscription is actually active
  useEffect(() => {
    if (!user) return;
    const activeStatuses = ['active', 'trialing'];
    if (activeStatuses.includes(user.subscription?.status)) {
      router.push('/');
    }
  }, [user, router]);

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  const getStatusMessage = () => {
    switch (subscriptionStatus) {
      case 'suspended':
        return 'Your subscription has been suspended';
      case 'canceled':
      default:
        return 'Your subscription is no longer active';
    }
  };

  // Show loading while user data loads
  if (!user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
                background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}
            >
              <StopOutlined style={{ fontSize: 36, color: 'white' }} />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {getStatusMessage()}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              Your organization no longer has an active subscription. Please contact support to restore access.
            </Typography>

            <Typography
              variant="body1"
              component="a"
              href="mailto:support@edbahn.app"
              sx={{ display: 'block', mb: 4, color: '#1976d2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              support@edbahn.app
            </Typography>

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

SubscriptionInactivePage.getLayout = function getLayout(page) {
  return <Layout variant="landing">{page}</Layout>;
};

export default SubscriptionInactivePage;
