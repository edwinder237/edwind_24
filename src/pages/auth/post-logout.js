import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, Box } from '@mui/material';

const PostLogout = () => {
  const router = useRouter();

  useEffect(() => {
    // Clear any remaining client-side storage
    if (typeof window !== 'undefined') {
      if (localStorage) {
        localStorage.clear();
      }
      if (sessionStorage) {
        sessionStorage.clear();
      }
    }

    // Redirect to projects after a brief delay
    const timeout = setTimeout(() => {
      router.replace('/projects');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}
      >
        <Typography variant="h4" gutterBottom>
          You have been logged out
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Redirecting you to the sign-in page...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          If you are not redirected automatically, <a href="/projects">click here</a>.
        </Typography>
      </Box>
    </Container>
  );
};

export default PostLogout;