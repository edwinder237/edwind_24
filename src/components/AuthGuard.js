import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import useUser from 'hooks/useUser';

// material-ui
import { Box, CircularProgress } from '@mui/material';

// ================================|| AUTH GUARD ||================================ //

const AuthGuard = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useUser();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [initializingSession, setInitializingSession] = useState(false);

  // Initialize organization session when user is authenticated
  useEffect(() => {
    const initializeOrgSession = async () => {
      if (!isAuthenticated || initializingSession || sessionInitialized) {
        return;
      }

      setInitializingSession(true);
      try {
        const response = await fetch('/api/organization/initialize-session', {
          method: 'POST'
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Organization session initialized:', data.organization?.title);
          setSessionInitialized(true);
        } else {
          console.warn('⚠️  Failed to initialize organization session');
          // Still allow access - user might not have org membership
          setSessionInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing organization session:', error);
        setSessionInitialized(true); // Allow access even if init fails
      } finally {
        setInitializingSession(false);
      }
    };

    initializeOrgSession();
  }, [isAuthenticated, initializingSession, sessionInitialized]);

  useEffect(() => {
    // Only redirect if loading is complete and user is not authenticated
    if (!isLoading && !isAuthenticated && !redirecting) {
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
  }, [isLoading, isAuthenticated, router, redirecting]);

  // Still loading, initializing session, or redirecting to sign-in
  if (isLoading || !isAuthenticated || (isAuthenticated && !sessionInitialized)) {
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