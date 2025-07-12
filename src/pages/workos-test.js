import { useState } from 'react';
import { Container, Typography, Button, Paper, Box, Alert } from '@mui/material';
import useUser from 'hooks/useUser';

const WorkOSTest = () => {
  const user = useUser();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signin-url');
      const data = await response.json();
      
      if (data.url) {
        // This will redirect to WorkOS AuthKit hosted UI
        window.location.href = data.url;
      } else {
        console.error('No URL returned:', data);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    window.location.href = '/api/auth/logout';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          WorkOS AuthKit Integration Test
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          This page tests the WorkOS AuthKit hosted authentication UI. 
          Users will be redirected to WorkOS for sign-in/sign-up.
        </Alert>

        {user === undefined ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography>Loading user data...</Typography>
          </Box>
        ) : user === null ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              You are not signed in
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Click the button below to sign in using WorkOS AuthKit. 
              You'll be redirected to the WorkOS hosted sign-in page.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleSignIn}
              disabled={loading}
              sx={{ minWidth: 200 }}
            >
              {loading ? 'Redirecting...' : 'Sign In with WorkOS AuthKit'}
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom color="success.main">
              ✅ Successfully Authenticated!
            </Typography>
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Name:</strong> {user.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Email:</strong> {user.email}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>User ID:</strong> {user.id}
              </Typography>
              <Typography variant="body1">
                <strong>Role:</strong> {user.role}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={handleSignOut}
              sx={{ minWidth: 150 }}
            >
              Sign Out
            </Button>
          </Box>
        )}

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'grey.300' }}>
          <Typography variant="h6" gutterBottom>
            How it works:
          </Typography>
          <Typography variant="body2" component="ol" sx={{ pl: 2 }}>
            <li>Click "Sign In with WorkOS AuthKit"</li>
            <li>Get redirected to WorkOS hosted authentication page</li>
            <li>Sign in or sign up (managed by WorkOS)</li>
            <li>Get redirected back to your app with user session</li>
            <li>User data is fetched from WorkOS and displayed</li>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default WorkOSTest;