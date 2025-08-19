import React, { useState } from 'react';
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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const subjectOptions = [
    'General Inquiry',
    'Product Demo',
    'Pricing Information',
    'Technical Support',
    'Partnership',
    'Enterprise Solutions',
    'Other'
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
          message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
          severity: 'success'
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          company: '',
          subject: 'General Inquiry',
          message: ''
        });
      } else {
        setNotification({
          open: true,
          message: result.error || 'Failed to send message. Please try again.',
          severity: 'error'
        });
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Network error. Please check your connection and try again.',
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
                Get in Touch
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Ready to transform your training programs? Contact our team to learn how 
                EDWIND can help your organization achieve better learning outcomes.
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
                      <Typography variant="h6">Email Us</Typography>
                      <Typography variant="body2" color="text.secondary">
                        admin@edwind.ca
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

              </Box>

              <Box sx={{ mt: 'auto' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Response Time:</strong> We typically respond within 24 hours during business days.
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
                  Send us a Message
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
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
                      label="Email Address"
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
                      label="Company/Organization"
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
                      label="Subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    >
                      {subjectOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      multiline
                      rows={4}
                      variant="outlined"
                      placeholder="Tell us about your training needs, questions, or how we can help your organization..."
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
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Alert severity="info" variant="outlined">
                  By submitting this form, you agree to our privacy policy. We'll only use 
                  your information to respond to your inquiry.
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