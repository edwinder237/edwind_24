import { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, Button, Alert } from '@mui/material';
import { useRouter } from 'next/router';
import useUser from 'hooks/useUser';

const AuthSuccess = () => {
  const user = useUser();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (user && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (user && countdown === 0) {
      // Redirect to projects after countdown
      router.push('/projects');
    }
  }, [user, countdown, router]);

  const goToProjects = () => {
    router.push('/projects');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom color="success.main">
          🎉 Authentication Successful!
        </Typography>
        
        {user === undefined ? (
          <Typography>Loading user data...</Typography>
        ) : user === null ? (
          <Alert severity="error">
            Authentication failed - no user data found
          </Alert>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Welcome back, {user.name}! You have successfully signed in with WorkOS AuthKit.
            </Alert>
            
            <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 1, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Profile Information:
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Name:</strong> {user.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Email:</strong> {user.email}
              </Typography>
              <Typography variant="body1">
                <strong>User ID:</strong> {user.id}
              </Typography>
            </Box>

            {countdown > 0 ? (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Redirecting to your projects in {countdown} seconds...
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={goToProjects}
                  size="large"
                >
                  Go to Projects Now
                </Button>
              </Box>
            ) : (
              <Typography variant="body1">
                Redirecting now...
              </Typography>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AuthSuccess;