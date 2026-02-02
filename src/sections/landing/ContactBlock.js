import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
  Snackbar,
  MenuItem,
  CircularProgress,
  useTheme
} from '@mui/material';
import { Send, Email, Business } from '@mui/icons-material';
import Animation from './Animation';

const ContactBlock = () => {
  const theme = useTheme();
  const intl = useIntl();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: intl.formatMessage({ id: 'landing.contact.generalInquiry' }),
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const subjectOptions = [
    { value: 'General Inquiry', labelId: 'landing.contact.generalInquiry' },
    { value: 'Product Demo', labelId: 'landing.contact.productDemo' },
    { value: 'Pricing Information', labelId: 'landing.contact.pricingInfo' },
    { value: 'Technical Support', labelId: 'landing.contact.technicalSupport' },
    { value: 'Partnership', labelId: 'landing.contact.partnership' },
    { value: 'Enterprise Solutions', labelId: 'landing.contact.enterpriseSolutions' },
    { value: 'Other', labelId: 'landing.contact.other' }
  ];

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setNotification({
          open: true,
          message: intl.formatMessage({ id: 'landing.contact.successMessage' }),
          severity: 'success'
        });

        // Reset form
        setFormData({
          name: '',
          email: '',
          company: '',
          subject: intl.formatMessage({ id: 'landing.contact.generalInquiry' }),
          message: ''
        });
      } else {
        setNotification({
          open: true,
          message: result.error || intl.formatMessage({ id: 'landing.contact.errorMessage' }),
          severity: 'error'
        });
      }
    } catch (error) {
      setNotification({
        open: true,
        message: intl.formatMessage({ id: 'landing.contact.networkError' }),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <Container id="contact" sx={{ py: { xs: 6, md: 10 } }}>
      <Grid container spacing={4} alignItems="stretch">
        {/* Contact Information */}
        <Grid item xs={12} md={5}>
          <Animation
            variants={{
              visible: { opacity: 1, x: 0 },
              hidden: { opacity: 0, x: -50 }
            }}
          >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h3" component="h2" gutterBottom>
                <FormattedMessage id="landing.contact.title" />
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                <FormattedMessage id="landing.contact.description" />
              </Typography>

              <Box sx={{ mb: 4, flex: 1 }}>
                {/* Contact Information Cards */}
                <Paper
                  elevation={1}
                  sx={{
                    p: 3,
                    mb: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      boxShadow: theme.shadows[4]
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Email color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                      <Typography variant="h6">
                        <FormattedMessage id="landing.contact.emailUs" />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        admin@edwind.ca
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>

              <Box sx={{ mt: 'auto' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong><FormattedMessage id="landing.contact.responseTime" /></strong>{' '}
                  <FormattedMessage id="landing.contact.responseTimeDesc" />
                </Typography>
              </Box>
            </Box>
          </Animation>
        </Grid>

        {/* Contact Form */}
        <Grid item xs={12} md={7}>
          <Animation
            variants={{
              visible: { opacity: 1, x: 0 },
              hidden: { opacity: 0, x: 50 }
            }}
          >
            <Paper
              elevation={2}
              sx={{
                p: { xs: 3, md: 4 },
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Business color="primary" />
                <Typography variant="h4" component="h3">
                  <FormattedMessage id="landing.contact.sendMessage" />
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={intl.formatMessage({ id: 'landing.contact.fullName' })}
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={intl.formatMessage({ id: 'landing.contact.emailAddress' })}
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={intl.formatMessage({ id: 'landing.contact.company' })}
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label={intl.formatMessage({ id: 'landing.contact.subject' })}
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    >
                      {subjectOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {intl.formatMessage({ id: option.labelId })}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={intl.formatMessage({ id: 'landing.contact.message' })}
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      multiline
                      rows={4}
                      variant="outlined"
                      placeholder={intl.formatMessage({ id: 'landing.contact.messagePlaceholder' })}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                      disabled={loading}
                      sx={{
                        minWidth: 160,
                        py: 1.5
                      }}
                    >
                      {loading
                        ? intl.formatMessage({ id: 'landing.contact.sending' })
                        : intl.formatMessage({ id: 'landing.contact.send' })}
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Alert severity="info" variant="outlined">
                  <FormattedMessage id="landing.contact.privacyNote" />
                </Alert>
              </Box>
            </Paper>
          </Animation>
        </Grid>
      </Grid>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ContactBlock;
