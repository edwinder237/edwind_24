import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/legacy/image';

// material-ui
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material';

// icons
import {
  BankOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  MailOutlined,
  CrownFilled,
  RocketOutlined,
  ProjectOutlined,
  ReadOutlined,
  DashboardOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { ViewTimeline } from '@mui/icons-material';

// project import
import Layout from 'layout';
import useUser from 'hooks/useUser';
import axios from 'utils/axios';

const headerlogo = '/assets/images/logos/edwind-color-logo.png';

// Fallback plans shown while API loads
const FALLBACK_PLANS = [
  {
    id: 'essential',
    name: 'Essential',
    price: 'Free',
    period: '',
    description: 'Perfect for small teams getting started with training management.',
    buttonText: 'Start Free',
    buttonVariant: 'outlined',
    popular: false,
    features: [
      { text: 'Up to 5 projects', included: true },
      { text: 'Up to 100 participants', included: true },
      { text: 'Basic reporting', included: true },
      { text: '1 sub-organization', included: true },
      { text: 'Up to 3 instructors', included: true },
      { text: 'Advanced analytics', included: false },
      { text: 'Timeline view', included: false },
      { text: 'Bulk participant import', included: false }
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$49.95',
    period: '/mo',
    description: 'For growing teams who need advanced features and analytics.',
    buttonText: 'Start 14-Day Free Trial',
    buttonVariant: 'contained',
    popular: true,
    features: [
      { text: 'Up to 50 projects', included: true },
      { text: 'Up to 500 participants', included: true },
      { text: 'Advanced analytics & Kirkpatrick', included: true },
      { text: '10 sub-organizations', included: true },
      { text: 'Up to 20 instructors', included: true },
      { text: 'Timeline view', included: true },
      { text: 'Bulk participant import', included: true },
      { text: 'Custom assessments & roles', included: true }
    ]
  }
];

// ==============================|| ONBOARDING PAGE ||============================== //

const OnboardingPage = () => {
  const router = useRouter();
  const { checkout } = router.query;
  const { user, isLoading: userLoading, isAuthenticated } = useUser();

  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [checkoutCanceled, setCheckoutCanceled] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    selectedPlan: '',
    isIndividual: false,
    organizationName: '',
    industry: '',
    teamSize: '',
    contactEmail: '',
    teamInvites: [{ email: '', role: 'member' }]
  });

  // Handle Stripe checkout return
  useEffect(() => {
    if (checkout === 'success') {
      setFormData(prev => ({ ...prev, selectedPlan: 'professional' }));
      setShowWelcome(true);
    } else if (checkout === 'canceled') {
      setFormData(prev => ({ ...prev, selectedPlan: 'professional' }));
      setCheckoutCanceled(true);
      setShowWelcome(true);
    }
  }, [checkout]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [userLoading, isAuthenticated, router]);

  // Pre-fill contact email from user
  useEffect(() => {
    if (user?.email && !formData.contactEmail) {
      setFormData(prev => ({
        ...prev,
        contactEmail: user.email
      }));
    }
  }, [user]);

  // Fetch plans from API (Stripe prices + DB features)
  useEffect(() => {
    fetch('/api/public/plans')
      .then(res => res.json())
      .then(data => {
        if (data.plans && data.plans.length > 0) {
          setPlans(data.plans);
        }
      })
      .catch(err => console.error('Failed to fetch plans:', err));
  }, []);

  // Dynamic steps based on selected plan
  const steps = formData.selectedPlan === 'professional'
    ? ['Choose Plan', 'Organization', 'Invite Team', 'Get Started']
    : ['Choose Plan', 'Organization', 'Get Started'];

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError('');
  };

  const handlePlanSelect = (planId) => {
    setFormData(prev => ({ ...prev, selectedPlan: planId }));
    setError('');
    setActiveStep(1);
  };

  const handleNext = () => {
    if (activeStep === 1) {
      const orgName = formData.isIndividual
        ? (user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email)
        : formData.organizationName.trim();
      if (!orgName) {
        setError('Organization name is required');
        return;
      }
    }
    // For Essential plan, skip invite step (step 2) and go to welcome
    if (formData.selectedPlan === 'essential' && activeStep === 1) {
      handleSubmit();
      return;
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
  };

  // Team invite handlers
  const handleInviteChange = (index, field) => (event) => {
    const newInvites = [...formData.teamInvites];
    newInvites[index] = { ...newInvites[index], [field]: event.target.value };
    setFormData(prev => ({ ...prev, teamInvites: newInvites }));
  };

  const addInviteField = () => {
    if (formData.teamInvites.length < 5) {
      setFormData(prev => ({
        ...prev,
        teamInvites: [...prev.teamInvites, { email: '', role: 'member' }]
      }));
    }
  };

  const removeInviteField = (index) => {
    if (formData.teamInvites.length > 1) {
      setFormData(prev => ({
        ...prev,
        teamInvites: prev.teamInvites.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async () => {
    // Resolve org name: individual uses their own name
    const resolvedOrgName = formData.isIndividual
      ? (user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '')
      : formData.organizationName.trim();

    if (!resolvedOrgName) {
      setError('Organization name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Filter out empty invites
      const validInvites = formData.teamInvites.filter(i => i.email && i.email.trim());

      const response = await axios.post('/api/onboarding/complete', {
        organizationName: resolvedOrgName,
        industry: formData.industry,
        teamSize: formData.isIndividual ? '1' : formData.teamSize,
        contactEmail: formData.contactEmail,
        selectedPlan: formData.selectedPlan,
        teamInvites: validInvites
      });

      if (response.data.success) {
        if (response.data.checkoutUrl) {
          // Professional plan: redirect to Stripe Checkout
          window.location.href = response.data.checkoutUrl;
        } else {
          // Essential plan: show welcome page
          setShowWelcome(true);
        }
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

  const handleSkipInvites = () => {
    handleSubmit();
  };

  if (userLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // ==============================|| WELCOME PAGE ||============================== //

  if (showWelcome) {
    const isPro = formData.selectedPlan === 'professional';

    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          py: 4
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Image src={headerlogo} alt="EDWIND" width={200} height={84} />
          </Box>

          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <CardContent sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />

              <Typography variant="h3" gutterBottom>
                Welcome to EDWIND!
              </Typography>

              {isPro && !checkoutCanceled && (
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Your 14-day Professional trial has started.
                </Typography>
              )}
              {isPro && checkoutCanceled && (
                <Alert severity="info" sx={{ mb: 2, mx: 'auto', maxWidth: 500 }}>
                  Your Professional trial is active. You can add a payment method anytime from Organization Settings.
                </Alert>
              )}
              {!isPro && (
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  You&apos;re on the Essential plan.
                </Typography>
              )}

              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Here are a few things to get you started:
              </Typography>

              {/* Quick-start checklist */}
              <Box sx={{ maxWidth: 400, mx: 'auto', mb: 4 }}>
                <List>
                  <ListItem
                    component="a"
                    href="/projects"
                    sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <ProjectOutlined style={{ fontSize: 20, color: '#1976d2' }} />
                    </ListItemIcon>
                    <ListItemText primary="Create your first project" />
                  </ListItem>
                  <ListItem
                    component="a"
                    href="/project-manager/resources/topics"
                    sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <ReadOutlined style={{ fontSize: 20, color: '#1976d2' }} />
                    </ListItemIcon>
                    <ListItemText primary="Set up courses and topics" />
                  </ListItem>
                  <ListItem
                    component="a"
                    href="/project-manager/dashboard"
                    sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <DashboardOutlined style={{ fontSize: 20, color: '#1976d2' }} />
                    </ListItemIcon>
                    <ListItemText primary="Explore your dashboard" />
                  </ListItem>
                  {isPro && (
                    <ListItem
                      component="a"
                      href="/project-manager/projects/timeline"
                      sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <ViewTimeline sx={{ fontSize: 20, color: '#1976d2' }} />
                      </ListItemIcon>
                      <ListItemText primary="Try the Timeline view" />
                    </ListItem>
                  )}
                </List>
              </Box>

              <Button
                variant="contained"
                size="large"
                onClick={() => {
                  window.location.href = '/projects';
                }}
                sx={{
                  px: 6,
                  py: 1.5,
                  backgroundColor: '#1976d2',
                  '&:hover': { backgroundColor: '#1565c0' }
                }}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  // ==============================|| STEP RENDERERS ||============================== //

  const renderPlanSelection = () => (
    <Grid container spacing={3} justifyContent="center">
      <Grid item xs={12}>
        <Typography variant="h5" textAlign="center" gutterBottom>
          Choose Your Plan
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          Start with what works for you. You can upgrade anytime.
        </Typography>
      </Grid>

      {plans.map((plan) => (
        <Grid item xs={12} sm={6} key={plan.id}>
          <Card
            sx={{
              height: '100%',
              border: plan.popular ? '2px solid #1976d2' : '1px solid',
              borderColor: plan.popular ? '#1976d2' : 'divider',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 8
              }
            }}
            onClick={() => handlePlanSelect(plan.id)}
          >
            <CardContent sx={{ p: 3, pt: plan.popular ? 1.5 : 3 }}>
              {plan.popular && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                  <Chip
                    label={plan.highlightText || 'Most Popular'}
                    color="primary"
                    size="small"
                    icon={<CrownFilled style={{ fontSize: 14 }} />}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              )}

              <Typography variant="h4" textAlign="center" sx={{ fontWeight: 600, mb: 1 }}>
                {plan.name}
              </Typography>

              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h2" component="span" sx={{ fontWeight: 700, color: '#1976d2' }}>
                  {plan.price}
                </Typography>
                {plan.period && (
                  <Typography variant="h6" component="span" color="text.secondary">
                    {plan.period}
                  </Typography>
                )}
              </Box>

              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2, minHeight: 40 }}>
                {plan.description}
              </Typography>

              <List dense sx={{ mb: 2 }}>
                {plan.features.map((feature, idx) => (
                  <ListItem key={idx} sx={{ px: 0, py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      {feature.included ? (
                        <CheckOutlined style={{ fontSize: 16, color: '#4caf50' }} />
                      ) : (
                        <CloseOutlined style={{ fontSize: 16, color: '#bdbdbd' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={feature.text}
                      primaryTypographyProps={{
                        variant: 'body2',
                        color: feature.included ? 'text.primary' : 'text.disabled'
                      }}
                    />
                  </ListItem>
                ))}
              </List>

              <Button
                fullWidth
                size="large"
                variant={plan.buttonVariant}
                sx={{
                  backgroundColor: plan.buttonVariant === 'contained' ? '#1976d2' : 'transparent',
                  borderColor: '#1976d2',
                  color: plan.buttonVariant === 'contained' ? 'white' : '#1976d2',
                  '&:hover': {
                    backgroundColor: plan.buttonVariant === 'contained' ? '#1565c0' : 'rgba(25, 118, 210, 0.04)',
                    borderColor: '#1565c0'
                  }
                }}
              >
                {plan.buttonText}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Enterprise Contact Card */}
      <Grid item xs={12}>
        <Card
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.04) 0%, rgba(25, 118, 210, 0.08) 100%)',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4
            }
          }}
          onClick={() => router.push('/enterprise')}
        >
          <CardContent sx={{ py: 2.5, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                Enterprise
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Need more? Custom plans for large organizations with dedicated support, SSO, and unlimited resources.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: '#1976d2',
                color: '#1976d2',
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: '#1565c0',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              Contact Sales
            </Button>
          </CardContent>
        </Card>
      </Grid>

    </Grid>
  );

  const renderOrganizationSetup = () => {
    const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '';

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Tell Us About You
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you setting this up for yourself or your organization?
          </Typography>
        </Grid>

        {/* Individual vs Organization toggle */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
            <Button
              variant={formData.isIndividual ? 'contained' : 'outlined'}
              onClick={() => setFormData(prev => ({ ...prev, isIndividual: true }))}
              startIcon={<UserOutlined />}
              sx={{
                flex: 1,
                py: 1.5,
                borderColor: formData.isIndividual ? '#1976d2' : 'divider',
                backgroundColor: formData.isIndividual ? '#1976d2' : 'transparent',
                color: formData.isIndividual ? 'white' : 'text.primary',
                '&:hover': {
                  backgroundColor: formData.isIndividual ? '#1565c0' : 'rgba(25, 118, 210, 0.04)',
                  borderColor: '#1976d2'
                }
              }}
            >
              Just Me
            </Button>
            <Button
              variant={!formData.isIndividual ? 'contained' : 'outlined'}
              onClick={() => setFormData(prev => ({ ...prev, isIndividual: false }))}
              startIcon={<BankOutlined />}
              sx={{
                flex: 1,
                py: 1.5,
                borderColor: !formData.isIndividual ? '#1976d2' : 'divider',
                backgroundColor: !formData.isIndividual ? '#1976d2' : 'transparent',
                color: !formData.isIndividual ? 'white' : 'text.primary',
                '&:hover': {
                  backgroundColor: !formData.isIndividual ? '#1565c0' : 'rgba(25, 118, 210, 0.04)',
                  borderColor: '#1976d2'
                }
              }}
            >
              My Organization
            </Button>
          </Box>
        </Grid>

        {/* Individual: show name as read-only */}
        {formData.isIndividual ? (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Your Name"
              value={displayName}
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <UserOutlined />
                  </InputAdornment>
                )
              }}
              helperText="Your account will be created under your name."
            />
          </Grid>
        ) : (
          <>
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
                select
                label="Team Size (Optional)"
                value={formData.teamSize}
                onChange={handleChange('teamSize')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserOutlined />
                    </InputAdornment>
                  )
                }}
              >
                <MenuItem value="">Select...</MenuItem>
                <MenuItem value="1-10">1-10</MenuItem>
                <MenuItem value="11-50">11-50</MenuItem>
                <MenuItem value="51-200">51-200</MenuItem>
                <MenuItem value="200+">200+</MenuItem>
              </TextField>
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Contact Email"
            value={formData.contactEmail}
            onChange={handleChange('contactEmail')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MailOutlined />
                </InputAdornment>
              )
            }}
          />
        </Grid>
      </Grid>
    );
  };

  const renderTeamInvites = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          Invite Your Team
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Add team members to get started together. You can always invite more later from Organization Settings.
        </Typography>
      </Grid>

      {formData.teamInvites.map((invite, index) => (
        <Grid item xs={12} key={index}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              label={`Email ${index + 1}`}
              type="email"
              value={invite.email}
              onChange={handleInviteChange(index, 'email')}
              placeholder="colleague@company.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlined />
                  </InputAdornment>
                )
              }}
            />
            <Select
              value={invite.role}
              onChange={handleInviteChange(index, 'role')}
              size="small"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="member">Member</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
            {formData.teamInvites.length > 1 && (
              <IconButton onClick={() => removeInviteField(index)} size="small" color="error">
                <DeleteOutlined />
              </IconButton>
            )}
          </Box>
        </Grid>
      ))}

      {formData.teamInvites.length < 5 && (
        <Grid item xs={12}>
          <Button variant="text" onClick={addInviteField} size="small">
            + Add another
          </Button>
        </Grid>
      )}
    </Grid>
  );

  const renderStepContent = () => {
    if (activeStep === 0) return renderPlanSelection();
    if (activeStep === 1) return renderOrganizationSetup();
    // For professional plan, step 2 is invite, step 3 doesn't exist (submit happens on invite)
    if (formData.selectedPlan === 'professional' && activeStep === 2) return renderTeamInvites();
    return null;
  };

  // Determine if we're on the last step before submit
  const isLastStep = formData.selectedPlan === 'professional'
    ? activeStep === 2
    : activeStep === 1;

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
              Get Started with EDWIND
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
              Set up your training platform in just a few steps.
            </Typography>

            {/* Stepper — only show after plan selection */}
            {formData.selectedPlan && (
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Step Content */}
            <Box sx={{ minHeight: 300, mb: 4 }}>
              {renderStepContent()}
            </Box>

            {/* Navigation Buttons — only show after plan selection and not on plan selection step */}
            {activeStep > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {/* Skip button for invite step */}
                  {formData.selectedPlan === 'professional' && activeStep === 2 && (
                    <Button
                      variant="text"
                      onClick={handleSkipInvites}
                      disabled={loading}
                    >
                      Skip for now
                    </Button>
                  )}

                  <Button
                    variant="contained"
                    onClick={isLastStep ? handleSubmit : handleNext}
                    disabled={loading}
                    sx={{
                      backgroundColor: '#1976d2',
                      '&:hover': { backgroundColor: '#1565c0' }
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : isLastStep ? (
                      formData.selectedPlan === 'professional' ? 'Continue to Payment' : 'Complete Setup'
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </Box>
              </Box>
            )}
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
