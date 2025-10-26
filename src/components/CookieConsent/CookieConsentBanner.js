import React from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Paper,
  Typography,
  Button,
  Link,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Settings, Cookie } from '@mui/icons-material';
import { useCookieConsent } from 'contexts/CookieConsentContext';

const CookieConsentBanner = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const {
    showBanner,
    acceptAllCookies,
    acceptEssentialOnly,
    openPreferences
  } = useCookieConsent();

  // Only show banner on landing page
  const isLandingPage = router.pathname === '/landing';

  if (!showBanner || !isLandingPage) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        p: 2,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 3,
          maxWidth: '1200px',
          mx: 'auto',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            flexDirection: isMobile ? 'column' : 'row'
          }}
        >
          {/* Cookie Icon */}
          <Cookie 
            sx={{ 
              color: theme.palette.primary.main,
              fontSize: 32,
              flexShrink: 0,
              mt: 0.5
            }} 
          />

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" gutterBottom>
              We use cookies to enhance your experience
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              We use essential cookies to make our site work. With your consent, we may also use 
              non-essential cookies to improve user experience, personalize content, and analyze 
              website traffic. By clicking "Accept All," you agree to allow us to use cookies for 
              these purposes.{' '}
              <Link 
                href="/privacy-policy" 
                color="primary" 
                underline="hover"
                target="_blank"
              >
                Learn more about our Privacy Policy
              </Link>
            </Typography>

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center'
              }}
            >
              <Button
                variant="contained"
                onClick={acceptAllCookies}
                sx={{ minWidth: 120 }}
              >
                Accept All
              </Button>

              <Button
                variant="outlined"
                onClick={acceptEssentialOnly}
                sx={{ minWidth: 120 }}
              >
                Essential Only
              </Button>

              <Button
                variant="text"
                startIcon={<Settings />}
                onClick={openPreferences}
                sx={{ minWidth: 120 }}
              >
                Cookie Settings
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Close button for mobile */}
        {isMobile && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              This banner will disappear after making a selection
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CookieConsentBanner;