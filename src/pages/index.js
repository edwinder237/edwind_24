import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useUser from 'hooks/useUser';

// material-ui
import { Box, CircularProgress, Alert, IconButton } from '@mui/material';
import CloseIcon from '@ant-design/icons/CloseOutlined';

// project import
import Layout from 'layout';
import Landing from 'sections/landing';

// ==============================|| HOME PAGE - ROOT ||============================== //

const HomePage = () => {
  const router = useRouter();
  const { error } = router.query;
  const { isLoading, isAuthenticated } = useUser();
  const [showError, setShowError] = useState(true);

  // Handle dismissing the error alert
  const handleDismissError = () => {
    setShowError(false);
    // Clear the error from URL so it doesn't persist
    router.replace('/', undefined, { shallow: true });
  };

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
  return (
    <>
      {error === 'account_inactive' && showError && (
        <Alert
          severity="error"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleDismissError}
            >
              <CloseIcon />
            </IconButton>
          }
          sx={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            maxWidth: '90%',
            boxShadow: 3
          }}
        >
          Your account has been deactivated. Please contact your administrator.
        </Alert>
      )}
      <Landing />
    </>
  );
};

HomePage.getLayout = function getLayout(page) {
  return <Layout variant="landing">{page}</Layout>;
};

export default HomePage;
