import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import useUser from 'hooks/useUser';

// material-ui
import { Box, CircularProgress } from '@mui/material';

// ================================|| AUTH GUARD ||================================ //

const AuthGuard = ({ children }) => {
  const { user, isLoading, isAuthenticated, error, refetchUser } = useUser();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [initializingSession, setInitializingSession] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const hasRefetchedAfterCheckout = useRef(false);

  // Check if user needs onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isAuthenticated || !user || checkingOnboarding) {
        return;
      }

      // Check if user has completed onboarding (has sub_organizationId or onboardingComplete flag)
      const userInfo = user.info || {};
      const needsOnboarding = !userInfo.onboardingComplete && !user.sub_organizationId;

      if (needsOnboarding && router.pathname !== '/onboarding') {
        console.log('🔀 User needs onboarding, redirecting...');
        setCheckingOnboarding(true);
        router.push('/onboarding');
        return;
      }
    };

    checkOnboardingStatus();
  }, [isAuthenticated, user, router, checkingOnboarding]);

  // Gate: Professional trial users must complete Stripe checkout before accessing the app
  useEffect(() => {
    if (!isAuthenticated || !user || redirecting || !router.isReady) return;

    // Mark checkout as completed when returning from Stripe (persists across navigation)
    if (router.query.checkout === 'success') {
      try { sessionStorage.setItem('checkout_completed', '1'); } catch (e) { /* ignore */ }
      // Refetch user data to get updated subscription (with Stripe data)
      if (!hasRefetchedAfterCheckout.current) {
        hasRefetchedAfterCheckout.current = true;
        refetchUser();
      }
      return;
    }

    // Skip gate if checkout was already completed in this session
    try {
      if (sessionStorage.getItem('checkout_completed')) return;
    } catch (e) { /* ignore */ }

    const subscription = user.subscription;
    if (subscription?.requiresCheckout && router.pathname !== '/checkout-required') {
      console.log('🔀 Professional trial requires checkout, redirecting...');
      router.push('/checkout-required');
    }
  }, [isAuthenticated, user, router, router.isReady, redirecting, refetchUser]);

  // Initialize organization session when user is authenticated
  useEffect(() => {
    const initializeOrgSession = async () => {
      if (!isAuthenticated || initializingSession || sessionInitialized) {
        return;
      }

      // Skip session init if user needs onboarding
      const userInfo = user?.info || {};
      const needsOnboarding = !userInfo.onboardingComplete && !user?.sub_organizationId;
      if (needsOnboarding) {
        setSessionInitialized(true); // Skip for now
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
  }, [isAuthenticated, user, initializingSession, sessionInitialized]);

  useEffect(() => {
    // Only redirect if loading is complete and user is not authenticated
    if (!isLoading && !isAuthenticated && !redirecting) {
      setRedirecting(true);

      // If account or organization is inactive, logout and redirect to landing page with error
      if (error === 'ACCOUNT_INACTIVE' || error === 'ORGANIZATION_INACTIVE') {
        window.location.href = '/api/auth/logout?returnTo=/?error=account_inactive';
        return;
      }

      // Redirect directly to WorkOS sign-in instead of login page
      const redirectToSignIn = async () => {
        try {
          const response = await fetch('/api/auth/signin-url');
          const data = await response.json();
          if (data.url) {
            window.location.href = data.url;
          }
        } catch (fetchError) {
          console.error('Error redirecting to sign-in:', fetchError);
        }
      };
      redirectToSignIn();
    }
  }, [isLoading, isAuthenticated, router, redirecting, error]);

  // Still loading, initializing session, checking onboarding, or redirecting to sign-in
  if (isLoading || !isAuthenticated || checkingOnboarding || (isAuthenticated && !sessionInitialized)) {
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