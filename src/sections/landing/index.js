
// react
import { lazy, Suspense } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';

// project import - critical components loaded immediately
import Hero from 'sections/landing/Header';
import FeatureBlock from 'sections/landing/FeatureBlock';
import ErrorBoundary from 'components/ErrorBoundary';

// lazy load non-critical components
const PricingBlock = lazy(() => import('sections/landing/PricingBlock'));
const DemoBlock = lazy(() => import('sections/landing/DemoBlock'));
const ContactBlock = lazy(() => import('sections/landing/ContactBlock'));
const CallToAction = lazy(() => import('sections/landing/CallToAction'));
const NumberBlock = lazy(() => import('sections/landing/NumberBlock'));

import { ThemeMode, ThemeDirection, HEADER_HEIGHT } from 'config';


// ==============================|| LANDING PAGE ||============================== //

// Loading component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
    <CircularProgress />
  </Box>
);

const Landing = () => {
  const theme = useTheme();

  return (
    <ErrorBoundary>
      <Box
        sx={{
          position: 'relative',
          bgcolor: theme.palette.mode === ThemeMode.DARK ? 'grey.0' : 'grey.800',
          overflow: 'hidden',
          minHeight: '60vh',
          marginTop: `${HEADER_HEIGHT}px`,
          '&>*': {
            position: 'relative',
            zIndex: 5
          },
          '&:before': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            zIndex: 2,
            background:
              theme.direction === ThemeDirection.RTL
                ? {
                    xs: 'linear-gradient(-360.36deg, rgb(0, 0, 0) 14.79%, rgba(67, 67, 67, 0.28) 64.86%)',
                    md: 'linear-gradient(-329.36deg, rgb(0, 0, 0) 1.79%, rgba(67, 67, 67, 0.28) 64.86%)',
                    xl: 'linear-gradient(-329.36deg, rgb(0, 0, 0) 1.79%, rgba(67, 67, 67, 0.28) 64.86%)'
                  }
                : 'linear-gradient(329.36deg, rgb(0, 0, 0) 14.79%, rgba(67, 67, 67, 0.28) 64.86%)'
          }
        }}
      >
        <ErrorBoundary>
          <Hero />
        </ErrorBoundary>
      </Box>
      <ErrorBoundary>
        <FeatureBlock />
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <PricingBlock />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <DemoBlock />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <ContactBlock />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <CallToAction />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <NumberBlock />
        </Suspense>
      </ErrorBoundary>
    </ErrorBoundary>
  );
};

export default Landing;