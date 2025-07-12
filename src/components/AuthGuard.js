import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import useUser from 'hooks/useUser';

// material-ui
import { Box, CircularProgress } from '@mui/material';

// ================================|| AUTH GUARD ||================================ //

const AuthGuard = ({ children }) => {
  const user = useUser();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (user === null && !redirecting) {
      setRedirecting(true);
      // Redirect directly to WorkOS sign-in instead of login page
      const redirectToSignIn = async () => {
        try {
          const response = await fetch('/api/auth/signin-url');
          const data = await response.json();
          if (data.url) {
            window.location.href = data.url;
          }
        } catch (error) {
          console.error('Error redirecting to sign-in:', error);
        }
      };
      redirectToSignIn();
    }
  }, [user, router, redirecting]);

  // Still loading or redirecting to sign-in
  if (user === undefined || user === null) {
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

  return children;
};

export default AuthGuard;