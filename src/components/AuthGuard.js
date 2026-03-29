import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import useUser from 'hooks/useUser';

// material-ui
import { Box, Button, CircularProgress, Typography } from '@mui/material';

// ================================|| AUTH GUARD ||================================ //

const AuthGuard = ({ children }) => {
  const { user, isLoading, isAuthenticated, error, refetchUser } = useUser();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [initializingSession, setInitializingSession] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [dbUnavailable, setDbUnavailable] = useState(false);
  const [retrying, setRetrying] = useState(false);
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

  // Gate: Block access when subscription is canceled or suspended
  useEffect(() => {
    if (!isAuthenticated || !user || redirecting || !router.isReady) return;

    // Skip if user still needs onboarding
    const userInfo = user.info || {};
    const needsOnboarding = !userInfo.onboardingComplete && !user.sub_organizationId;
    if (needsOnboarding) return;

    // Skip if DB was unavailable
    if (user.dbUnavailable) return;

    const subscription = user.subscription;
    if (!subscription) return;

    const blockedStatuses = ['canceled', 'suspended'];
    if (blockedStatuses.includes(subscription.status)) {
      console.log('🔀 Subscription inactive, redirecting to subscription-inactive...');
      window.location.href = '/subscription-inactive';
    }
  }, [isAuthenticated, user, router, router.isReady, redirecting]);

  // Gate: Users must complete Stripe checkout before accessing the app
  useEffect(() => {
    if (!isAuthenticated || !user || redirecting || !router.isReady) return;

    // Skip gate if user still needs onboarding (onboarding gate handles that)
    const userInfo = user.info || {};
    const needsOnboarding = !userInfo.onboardingComplete && !user.sub_organizationId;
    if (needsOnboarding) return;

    // If DB was unavailable, show retry UI instead of redirecting to checkout
    if (user.dbUnavailable) {
      setDbUnavailable(true);
      return;
    }
    setDbUnavailable(false);

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
    // Skip checkout redirect for canceled/suspended — the subscription-inactive gate handles those
    if (subscription?.requiresCheckout && !['canceled', 'suspended'].includes(subscription?.status)) {
      console.log('🔀 Subscription requires checkout, redirecting to checkout-required...');
      window.location.href = '/checkout-required';
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

  // Handle retry when database is unavailable
  const handleRetry = async () => {
    setRetrying(true);
    await refetchUser();
    setRetrying(false);
  };

  // Database unavailable - show retry UI instead of redirecting to payment
  if (dbUnavailable && isAuthenticated) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2
        }}
      >
        {retrying ? (
          <>
            <CircularProgress />
            <Typography variant="body1" color="text.secondary">
              Reconnecting...
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Service temporarily unavailable
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, textAlign: 'center' }}>
              We&apos;re having trouble reaching the server. This is usually temporary.
            </Typography>
            <Button variant="contained" onClick={handleRetry} sx={{ mt: 1 }}>
              Try again
            </Button>
          </>
        )}
      </Box>
    );
  }

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