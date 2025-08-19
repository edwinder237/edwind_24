import React from 'react';
import Head from 'next/head';
import {
  Container,
  Typography,
  Box,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert
} from '@mui/material';
import { ExpandMore, Cookie, Analytics, Campaign, Settings } from '@mui/icons-material';
import { useCookieConsent } from 'contexts/CookieConsentContext';
import Layout from 'layout';

const CookiePreferencesPage = () => {
  const {
    consent,
    updateCategoryConsent,
    acceptAllCookies,
    acceptEssentialOnly,
    cookieDescriptions,
    cookieCategories
  } = useCookieConsent();

  const getCategoryIcon = (category) => {
    switch (category) {
      case cookieCategories.ESSENTIAL:
        return <Cookie />;
      case cookieCategories.ANALYTICS:
        return <Analytics />;
      case cookieCategories.MARKETING:
        return <Campaign />;
      case cookieCategories.PREFERENCES:
        return <Settings />;
      default:
        return <Cookie />;
    }
  };

  return (
    <>
      <Head>
        <title>Cookie Preferences - EDWIND</title>
        <meta name="description" content="Manage your cookie preferences for the EDWIND training platform. Control which cookies we can use to improve your experience." />
      </Head>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Cookie Preferences
          </Typography>
          <Typography variant="body1" color="text.secondary">
            We use cookies to enhance your experience on our platform. You can choose which 
            categories of cookies to allow. Please note that disabling some cookies may affect 
            website functionality.
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 4 }}>
          Changes to your cookie preferences take effect immediately and are stored locally 
          on your device for one year.
        </Alert>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={acceptAllCookies}
                startIcon={<Cookie />}
              >
                Accept All Cookies
              </Button>
              <Button
                variant="outlined"
                onClick={acceptEssentialOnly}
                startIcon={<Cookie />}
              >
                Essential Cookies Only
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" gutterBottom>
            Cookie Categories
          </Typography>

          {Object.entries(cookieDescriptions).map(([category, details]) => (
            <Accordion key={category} defaultExpanded>
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
                  <Typography variant="h6">{details.name}</Typography>
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
                      checked={consent?.[category] || false}
                      onChange={() => updateCategoryConsent(category, !consent?.[category])}
                      disabled={details.required}
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                  label=""
                  sx={{ mr: 1 }}
                />
              </AccordionSummary>
              
              <AccordionDetails>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {details.description}
                </Typography>
                
                {details.examples && details.examples.length > 0 && (
                  <>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                      Examples of cookies in this category:
                    </Typography>
                    <List dense>
                      {details.examples.map((example, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemText 
                            primary={`• ${example}`}
                            sx={{ 
                              '& .MuiListItemText-primary': { 
                                fontSize: '0.95rem',
                                color: 'text.primary'
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Current Status:</strong>{' '}
                    {consent?.[category] ? (
                      <span style={{ color: 'green' }}>Enabled</span>
                    ) : (
                      <span style={{ color: 'orange' }}>Disabled</span>
                    )}
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Additional Information
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>Data Retention:</strong> Your cookie preferences are stored locally on your 
            device and are valid for one year from the date you set them.
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>Changes:</strong> You can change your preferences at any time by returning 
            to this page or clicking the "Cookie Preferences" link in our website footer.
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>Contact:</strong> If you have questions about our cookie policy or data 
            practices, please contact us through our{' '}
            <Button 
              variant="text" 
              href="#contact" 
              sx={{ p: 0, textTransform: 'none', verticalAlign: 'baseline' }}
            >
              contact page
            </Button>.
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            For more detailed information about our data practices, please review our{' '}
            <Button 
              variant="text" 
              href="/privacy-policy" 
              target="_blank"
              sx={{ p: 0, textTransform: 'none', verticalAlign: 'baseline' }}
            >
              Privacy Policy
            </Button>.
          </Typography>
        </Paper>
      </Container>
    </>
  );
};

CookiePreferencesPage.getLayout = function getLayout(page) {
  return <Layout variant="landing">{page}</Layout>;
};

export default CookiePreferencesPage;