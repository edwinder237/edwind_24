import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useUser from 'hooks/useUser';

// material-ui
import { Box, CircularProgress } from '@mui/material';

// project import  
import Layout from 'layout';

// ==============================|| HOME PAGE - SMART REDIRECT ||============================== //

const HomePage = () => {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useUser();

  useEffect(() => {
    // Only redirect when we have determined the user's auth status
    if (isLoading) return; // Still loading

    if (!isAuthenticated) {
      // User is not authenticated, redirect to landing page
      router.push('/landing');
    } else {
      // User is authenticated, redirect to projects
      router.push('/projects');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Show loading spinner while determining auth status or redirecting
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
};

HomePage.getLayout = function getLayout(page) {
  return <Layout variant="landing">{page}</Layout>;
};

export default HomePage;