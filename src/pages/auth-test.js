import { Container, Typography, Paper, Box } from '@mui/material';
import AuthButton from 'components/AuthButton';
import useUser from 'hooks/useUser';

const AuthTest = () => {
  const user = useUser();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          WorkOS Authentication Test
        </Typography>
        
        {user === undefined ? (
          <Typography>Loading...</Typography>
        ) : user === null ? (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              You are not signed in.
            </Typography>
            <AuthButton variant="contained" size="large">
              Sign In with WorkOS
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

export default AuthTest;