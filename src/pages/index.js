import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useUser from 'hooks/useUser';

// material-ui
import { Box, CircularProgress } from '@mui/material';

// project import
import Layout from 'layout';
import Landing from 'sections/landing';

// ==============================|| HOME PAGE - ROOT ||============================== //

const HomePage = () => {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useUser();

  useEffect(() => {
    // Only redirect authenticated users to projects
    if (isLoading) return;

    if (isAuthenticated) {
      router.push('/projects');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading spinner while determining auth status
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If authenticated, show loading while redirecting to /projects
  if (isAuthenticated) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show landing page for unauthenticated users
  return <Landing />;
};

HomePage.getLayout = function getLayout(page) {
  return <Layout variant="landing">{page}</Layout>;
};

export default HomePage;
