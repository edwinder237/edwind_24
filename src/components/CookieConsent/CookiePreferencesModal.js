import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Box,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Close, 
  ExpandMore, 
  Cookie, 
  Analytics, 
  Campaign, 
  Settings as SettingsIcon 
} from '@mui/icons-material';
import { useCookieConsent } from 'contexts/CookieConsentContext';

const CookiePreferencesModal = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const {
    showPreferences,
    closePreferences,
    consent,
    savePreferences,
    cookieDescriptions,
    cookieCategories
  } = useCookieConsent();

  const [preferences, setPreferences] = useState({});

  // Initialize preferences when modal opens
  useEffect(() => {
    if (showPreferences && consent) {
      setPreferences({ ...consent });
    }
  }, [showPreferences, consent]);

  const handleCategoryToggle = (category) => {
    if (category === cookieCategories.ESSENTIAL) {
      return; // Cannot disable essential cookies
    }

    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  const handleAcceptAll = () => {
    const allAccepted = Object.keys(cookieDescriptions).reduce((acc, category) => {
      acc[category] = true;
      return acc;
    }, {});
    
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const essentialOnly = Object.keys(cookieDescriptions).reduce((acc, category) => {
      acc[category] = category === cookieCategories.ESSENTIAL;
      return acc;
    }, {});
    
    setPreferences(essentialOnly);
    savePreferences(essentialOnly);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case cookieCategories.ESSENTIAL:
        return <Cookie />;
      case cookieCategories.ANALYTICS:
        return <Analytics />;
      case cookieCategories.MARKETING:
        return <Campaign />;
      case cookieCategories.PREFERENCES:
        return <SettingsIcon />;
      default:
        return <Cookie />;
    }
  };

  return (
    <Dialog
      open={showPreferences}
      onClose={closePreferences}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      scroll="paper"
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Cookie color="primary" />
          <Typography variant="h6">Cookie Preferences</Typography>
        </Box>
        <IconButton onClick={closePreferences} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body1" sx={{ mb: 3 }}>
          We use cookies to enhance your browsing experience, serve personalized content, 
          and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
        </Typography>

        <Box sx={{ mb: 3 }}>
          {Object.entries(cookieDescriptions).map(([category, details]) => (
            <Accordion key={category} defaultExpanded={category === cookieCategories.ESSENTIAL}>
              <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ 
                  '& .MuiAccordionSummary-content': { 
                    alignItems: 'center',
                    gap: 2
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  {getCategoryIcon(category)}
                  <Typography variant="subtitle1">{details.name}</Typography>
                  {details.required && (
                    <Chip 
                      label="Required" 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  )}
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences[category] || false}
                      onChange={() => handleCategoryToggle(category)}
                      disabled={details.required}
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                  label=""
                  sx={{ mr: 1 }}
                />
              </AccordionSummary>
              
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {details.description}
                </Typography>
                
                {details.examples && details.examples.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Examples:
                    </Typography>
                    <List dense>
                      {details.examples.map((example, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemText 
                            primary={`• ${example}`}
                            sx={{ 
                              '& .MuiListItemText-primary': { 
                                fontSize: '0.875rem',
                                color: 'text.secondary'
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary">
          You can change these settings at any time by clicking the cookie preferences 
          link in our footer. For more information about how we use cookies, please see our{' '}
          <Button 
            variant="text" 
            size="small" 
            href="/privacy-policy" 
            target="_blank"
            sx={{ p: 0, textTransform: 'none', textDecoration: 'underline' }}
          >
            Privacy Policy
          </Button>.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1, 
            width: '100%',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'flex-end'
          }}
        >
          <Button 
            variant="outlined" 
            onClick={handleRejectAll}
            sx={{ minWidth: 120 }}
          >
            Reject All
          </Button>
          
          <Button 
            variant="text" 
            onClick={handleAcceptAll}
            sx={{ minWidth: 120 }}
          >
            Accept All
          </Button>
          
          <Button 
            variant="contained" 
            onClick={handleSavePreferences}
            sx={{ minWidth: 120 }}
          >
            Save Preferences
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default CookiePreferencesModal;