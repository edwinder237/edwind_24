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
  InputAdornment,
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
  Backdrop
} from '@mui/material';

// icons
import {
  BankOutlined,
  UserOutlined,
  TeamOutlined,
  CheckOutlined,
  CloseOutlined,
  MailOutlined,
  CrownFilled,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DeleteOutlined
} from '@ant-design/icons';

// project import
import Layout from 'layout';
import axios from 'utils/axios';
import useUser from 'hooks/useUser';

const headerlogo = '/assets/images/logos/edwind-color-logo.png';

// Fallback plans shown while API loads
const FALLBACK_PLANS = [
  {
    id: 'essential',
    name: 'Essential',
    price: '$29.95',
    period: '/mo',
    description: 'Perfect for small teams getting started with training management.',
    buttonText: 'Start 14-Day Free Trial',
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

// ==============================|| SIGN-UP PAGE ||============================== //

const SignupPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useUser();

  // Redirect authenticated users away from signup
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      if (user?.subscription?.requiresCheckout) {
        router.replace('/checkout-required');
      } else {
        router.replace('/projects');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    selectedPlan: '',
    isIndividual: false,
    organizationName: '',
    industry: '',
    teamSize: '',
    contactEmail: '',
    teamInvites: [{ email: '', role: 'member' }]
  });

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
  const getSteps = () => {
    if (!formData.selectedPlan) return ['Create Account', 'Choose Plan', 'About You'];
    return formData.selectedPlan === 'professional'
      ? ['Create Account', 'Choose Plan', 'About You', 'Invite Team']
      : ['Create Account', 'Choose Plan', 'About You'];
  };
  const steps = getSteps();

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
    setActiveStep(2);
  };

  const handleNext = () => {
    // Step 0: Account info validation
    if (activeStep === 0) {
      if (!formData.firstName.trim()) {
        setError('First name is required');
        return;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }
      if (!formData.password || formData.password.length < 10) {
        setError('Password must be at least 10 characters');
        return;
      }
      if (!/[A-Z]/.test(formData.password)) {
        setError('Password must contain at least one uppercase letter');
        return;
      }
      if (!/[0-9]/.test(formData.password)) {
        setError('Password must contain at least one number');
        return;
      }
      // Pre-fill contact email
      if (!formData.contactEmail) {
        setFormData(prev => ({ ...prev, contactEmail: prev.email }));
      }
    }

    // Step 2: About You validation
    if (activeStep === 2) {
      const orgName = formData.isIndividual
        ? `${formData.firstName} ${formData.lastName}`.trim()
        : formData.organizationName.trim();
      if (!orgName) {
        setError('Organization name is required');
        return;
      }

      // Essential plan: submit directly (no invite step)
      if (formData.selectedPlan === 'essential') {
        handleSubmit();
        return;
      }
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
    const resolvedOrgName = formData.isIndividual
      ? `${formData.firstName} ${formData.lastName}`.trim()
      : formData.organizationName.trim();

    if (!resolvedOrgName) {
      setError('Organization name is required');
      return;
    }

    setCreatingAccount(true);
    setError('');

    try {
      const validInvites = formData.teamInvites.filter(i => i.email && i.email.trim());

      const response = await axios.post('/api/signup/complete', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        selectedPlan: formData.selectedPlan,
        isIndividual: formData.isIndividual,
        organizationName: resolvedOrgName,
        industry: formData.industry,
        teamSize: formData.isIndividual ? '1' : formData.teamSize,
        contactEmail: formData.contactEmail,
        teamInvites: validInvites
      });

      if (response.data.success) {
        if (response.data.checkoutUrl) {
          window.location.href = response.data.checkoutUrl;
        } else {
          // Fallback: ensure payment is completed before app access
          window.location.href = '/checkout-required';
        }
      } else {
        setCreatingAccount(false);
        setError(response.data.error || 'Failed to create account');
      }
    } catch (err) {
      console.error('Sign-up error:', err);
      setCreatingAccount(false);
      const errorMsg = err.error || err.response?.data?.error || err.message || 'Failed to create account. Please try again.';
      setError(errorMsg);

      // Navigate back to the relevant step so the user can fix the issue
      const lower = errorMsg.toLowerCase();
      if (lower.includes('password')) {
        setActiveStep(0);
      } else if (lower.includes('email') || lower.includes('account')) {
        setActiveStep(0);
      }
    }
  };

  const handleSkipInvites = () => {
    handleSubmit();
  };

  // ==============================|| STEP RENDERERS ||============================== //

  const renderAccountInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" textAlign="center" gutterBottom>
          Create Your Account
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          Let&apos;s start, it&apos;s easy!
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="First Name"
          value={formData.firstName}
          onChange={handleChange('firstName')}
          placeholder="John"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <UserOutlined />
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Last Name"
          value={formData.lastName}
          onChange={handleChange('lastName')}
          placeholder="Doe"
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
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          placeholder="john@company.com"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MailOutlined />
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange('password')}
          placeholder="Minimum 10 characters"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlined />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                  {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        {formData.password && (
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {[
              { label: 'At least 10 characters', met: formData.password.length >= 10 },
              { label: 'At least one uppercase letter', met: /[A-Z]/.test(formData.password) },
              { label: 'At least one number', met: /[0-9]/.test(formData.password) }
            ].map((rule) => (
              <Box key={rule.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {rule.met ? (
                  <CheckOutlined style={{ fontSize: 14, color: '#4caf50' }} />
                ) : (
                  <CloseOutlined style={{ fontSize: 14, color: '#f44336' }} />
                )}
                <Typography variant="caption" sx={{ color: rule.met ? 'success.main' : 'error.main' }}>
                  {rule.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Organization Name (Optional)"
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
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Already have an account?{' '}
          <Box
            component="span"
            sx={{ color: '#1976d2', cursor: 'pointer', fontWeight: 600 }}
            onClick={async () => {
              try {
                const response = await fetch('/api/auth/signin-url');
                const data = await response.json();
                if (data.url) window.location.href = data.url;
              } catch (e) {
                console.error('Error redirecting to login:', e);
              }
            }}
          >
            Log in
          </Box>
        </Typography>
      </Grid>
    </Grid>
  );

  const renderPlanSelection = () => (
    <Grid container spacing={3} justifyContent="center">
      <Grid item xs={12}>
        <Typography variant="h5" textAlign="center" gutterBottom>
          Choose Your Plan
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
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

      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Button onClick={handleBack} variant="text" sx={{ color: 'text.secondary' }}>
            Back
          </Button>
        </Box>
      </Grid>
    </Grid>
  );

  const renderOrganizationSetup = () => {
    const displayName = `${formData.firstName} ${formData.lastName}`.trim();

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
          Add team members to get started together. You can always invite more later.
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
    if (activeStep === 0) return renderAccountInfo();
    if (activeStep === 1) return renderPlanSelection();
    if (activeStep === 2) return renderOrganizationSetup();
    if (formData.selectedPlan === 'professional' && activeStep === 3) return renderTeamInvites();
    return null;
  };

  // Determine if we're on the last step before submit
  const isLastStep = formData.selectedPlan === 'professional'
    ? activeStep === 3
    : activeStep === 2;

  // Use wider container for plan selection step
  const containerMaxWidth = activeStep === 1 ? 'md' : 'sm';

  return (
    <>
      {/* "Creating your account..." overlay */}
      <Backdrop
        open={creatingAccount}
        sx={{
          zIndex: 9999,
          color: '#fff',
          flexDirection: 'column',
          gap: 3,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CircularProgress size={48} sx={{ color: 'white' }} />
        </Box>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
          Creating your account
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Setting up your workspace...
        </Typography>
      </Backdrop>

      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          pt: { xs: 10, md: 12 },
          pb: 4
        }}
      >
        <Container maxWidth={containerMaxWidth}>
          {/* Step indicator */}
          {activeStep > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              {steps.map((label, index) => (
                <Box
                  key={label}
                  sx={{
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      backgroundColor: index <= activeStep ? '#1976d2' : 'rgba(255,255,255,0.15)',
                      color: index <= activeStep ? '#fff' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {index < activeStep ? <CheckOutlined style={{ fontSize: 14 }} /> : index + 1}
                  </Box>
                  {index < steps.length - 1 && (
                    <Box
                      sx={{
                        width: { xs: 24, sm: 48 },
                        height: 2,
                        mx: 0.5,
                        backgroundColor: index < activeStep ? '#1976d2' : 'rgba(255,255,255,0.15)',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Main Card */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              {/* Header — only on first step */}
              {activeStep === 0 && (
                <>
                  <Typography variant="h4" textAlign="center" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Get Started with EDBAHN
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
                    Set up your training platform in just a few steps.
                  </Typography>
                </>
              )}

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Step Content */}
              <Box sx={{ mb: 4 }}>
                {renderStepContent()}
              </Box>

              {/* Navigation Buttons */}
              {activeStep === 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleNext}
                    sx={{
                      px: 6,
                      py: 1.2,
                      fontSize: '1rem',
                      backgroundColor: '#1976d2',
                      '&:hover': { backgroundColor: '#1565c0' }
                    }}
                  >
                    Continue
                  </Button>
                </Box>
              )}

              {activeStep > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button onClick={handleBack} variant="outlined" size="large">
                    Back
                  </Button>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* Skip button for invite step */}
                    {formData.selectedPlan === 'professional' && activeStep === 3 && (
                      <Button
                        variant="text"
                        onClick={handleSkipInvites}
                        disabled={loading}
                        size="large"
                      >
                        Skip for now
                      </Button>
                    )}

                    <Button
                      variant="contained"
                      size="large"
                      onClick={isLastStep ? handleSubmit : handleNext}
                      disabled={loading}
                      sx={{
                        px: 4,
                        backgroundColor: '#1976d2',
                        '&:hover': { backgroundColor: '#1565c0' }
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : isLastStep ? (
                        formData.selectedPlan === 'professional' ? 'Continue to Payment' : 'Create Account'
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
          <Typography variant="body2" color="rgba(255,255,255,0.5)" textAlign="center" sx={{ mt: 3 }}>
            Need help? Contact us at support@edwind.com
          </Typography>
        </Container>
      </Box>
    </>
  );
};

SignupPage.getLayout = function getLayout(page) {
  return <Layout variant="landing">{page}</Layout>;
};

export default SignupPage;
