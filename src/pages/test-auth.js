import { Container, Typography, Paper, Box, CircularProgress } from '@mui/material';
import useUser from 'hooks/useUser';
import AuthButton from 'components/AuthButton';

const TestAuth = () => {
  const user = useUser();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          WorkOS AuthKit Test Page
        </Typography>
        
        {user === undefined ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            <Typography>Loading user data...</Typography>
          </Box>
        ) : user === null ? (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              You are not logged in.
            </Typography>
            <AuthButton variant="contained" size="large">
              Sign In with AuthKit
            </AuthButton>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              Welcome, {user.name}!
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Email: {user.email}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Role: {user.role}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              User ID: {user.id}
            </Typography>
            <AuthButton variant="outlined">
              Sign Out
            </AuthButton>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default TestAuth;