import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/legacy/image';

// material-ui
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  InputAdornment
} from '@mui/material';

// icons
import {
  BankOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  TeamOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

// project import
import Layout from 'layout';
import useUser from 'hooks/useUser';
import axios from 'utils/axios';

const headerlogo = '/assets/images/logos/edwind-color-logo.png';

const steps = ['Organization Details', 'Contact Information', 'Review & Complete'];

// ==============================|| ONBOARDING PAGE ||============================== //

const OnboardingPage = () => {
  const router = useRouter();
  const { user, isLoading: userLoading, isAuthenticated } = useUser();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationDescription: '',
    industry: '',
    website: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    teamSize: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      router.push('/landing');
    }
  }, [userLoading, isAuthenticated, router]);

  // Pre-fill contact email from user
  useEffect(() => {
    if (user?.email && !formData.contactEmail) {
      setFormData(prev => ({
        ...prev,
        contactEmail: user.email,
        contactName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()
      }));
    }
  }, [user]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError('');
  };

  const handleNext = () => {
    // Validate current step
    if (activeStep === 0) {
      if (!formData.organizationName.trim()) {
        setError('Organization name is required');
        return;
      }
    } else if (activeStep === 1) {
      if (!formData.contactEmail.trim()) {
        setError('Contact email is required');
        return;
      }
    }

    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.organizationName.trim()) {
      setError('Organization name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/onboarding/complete', formData);

      if (response.data.success) {
        setSuccess(true);
        // Wait a moment to show success message, then redirect
        // Use window.location.href to force a full page reload
        // This ensures the user data is refreshed from the server
        setTimeout(() => {
          window.location.href = '/projects';
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to complete onboarding');
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err.response?.data?.error || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Card sx={{ width: '100%', textAlign: 'center', py: 4 }}>
          <CardContent>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
            <Typography variant="h4" gutterBottom>
              Welcome to EDWIND!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Your organization has been created successfully.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Redirecting you to your dashboard...
            </Typography>
            <CircularProgress size={24} sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      </Container>
    );
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Tell us about your organization
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                This information helps us customize your training platform experience.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Organization Name"
                value={formData.organizationName}
                onChange={handleChange('organizationName')}
                placeholder="e.g., Acme Training Corp"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BankOutlined />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description (Optional)"
                value={formData.organizationDescription}
                onChange={handleChange('organizationDescription')}
                placeholder="Brief description of your organization"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Industry (Optional)"
                value={formData.industry}
                onChange={handleChange('industry')}
                placeholder="e.g., Healthcare, Technology"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TeamOutlined />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Team Size (Optional)"
                value={formData.teamSize}
                onChange={handleChange('teamSize')}
                placeholder="e.g., 10-50"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserOutlined />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                How can we reach you if needed?
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Name"
                value={formData.contactName}
                onChange={handleChange('contactName')}
                placeholder="Your full name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserOutlined />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                type="email"
                label="Contact Email"
                value={formData.contactEmail}
                onChange={handleChange('contactEmail')}
                placeholder="your@email.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlined />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone (Optional)"
                value={formData.contactPhone}
                onChange={handleChange('contactPhone')}
                placeholder="+1 (555) 123-4567"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneOutlined />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Website (Optional)"
                value={formData.website}
                onChange={handleChange('website')}
                placeholder="https://yourcompany.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <GlobalOutlined />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Your Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please confirm the details below are correct.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Organization
                </Typography>
                <Typography variant="h6">{formData.organizationName}</Typography>
                {formData.organizationDescription && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {formData.organizationDescription}
                  </Typography>
                )}
                {(formData.industry || formData.teamSize) && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {formData.industry && `Industry: ${formData.industry}`}
                    {formData.industry && formData.teamSize && ' | '}
                    {formData.teamSize && `Team size: ${formData.teamSize}`}
                  </Typography>
                )}
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Contact
                </Typography>
                {formData.contactName && (
                  <Typography variant="body1">{formData.contactName}</Typography>
                )}
                <Typography variant="body1">{formData.contactEmail}</Typography>
                {formData.contactPhone && (
                  <Typography variant="body2">{formData.contactPhone}</Typography>
                )}
                {formData.website && (
                  <Typography variant="body2">{formData.website}</Typography>
                )}
              </Card>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        py: 4
      }}
    >
      <Container maxWidth="md">
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Image src={headerlogo} alt="EDWIND" width={200} height={84} />
        </Box>

        {/* Main Card */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            {/* Header */}
            <Typography variant="h4" textAlign="center" gutterBottom>
              Set Up Your Organization
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
              Let's get your training platform ready in just a few steps.
            </Typography>

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Step Content */}
            <Box sx={{ minHeight: 300, mb: 4 }}>
              {renderStepContent(activeStep)}
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{
                    backgroundColor: '#1976d2',
                    '&:hover': { backgroundColor: '#1565c0' }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Complete Setup'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    backgroundColor: '#1976d2',
                    '&:hover': { backgroundColor: '#1565c0' }
                  }}
                >
                  Continue
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Footer */}
        <Typography variant="body2" color="rgba(255,255,255,0.6)" textAlign="center" sx={{ mt: 4 }}>
          Need help? Contact us at support@edwind.com
        </Typography>
      </Container>
    </Box>
  );
};

OnboardingPage.getLayout = function getLayout(page) {
  return <Layout variant="landing">{page}</Layout>;
};

export default OnboardingPage;
