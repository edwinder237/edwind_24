import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/legacy/image';

// material-ui
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';

// icons
import {
  CheckOutlined,
  MailOutlined,
  UserOutlined,
  BankOutlined,
  TeamOutlined,
  PhoneOutlined
} from '@ant-design/icons';

// project import
import Layout from 'layout';
import { ADMIN_EMAIL } from '../lib/email/resendClient';

const headerlogo = '/assets/images/logos/edwind-color-logo.png';

const ENTERPRISE_FEATURES = [
  'Unlimited projects & participants',
  'Unlimited sub-organizations',
  'Unlimited instructors',
  'Advanced analytics & Kirkpatrick',
  'Timeline view & bulk imports',
  'Custom assessments & roles',
  'Single Sign-On (SSO)',
  'Dedicated account manager',
  'Priority support & SLA',
  'Custom integrations & API access',
  'Custom branding',
  'On-premise deployment options'
];

const EnterprisePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    teamSize: '',
    message: ''
  });

  const handleChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('A valid email is required');
      return;
    }
    if (!formData.company.trim()) {
      setError('Company name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          company: formData.company.trim(),
          subject: 'Enterprise Solutions',
          message: [
            formData.phone ? `Phone: ${formData.phone.trim()}` : '',
            formData.teamSize ? `Team Size: ${formData.teamSize}` : '',
            '',
            formData.message.trim() || 'Interested in Enterprise plan. Please contact me with more information.'
          ].filter(Boolean).join('\n')
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to send inquiry. Please try again.');
      }
    } catch (err) {
      console.error('Enterprise inquiry error:', err);
      setError('Failed to send inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        pt: { xs: 6, md: 8 },
        pb: 4
      }}
    >
      <Container maxWidth="lg">
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4, cursor: 'pointer' }} onClick={() => router.push('/')}>
          <Image src={headerlogo} alt="EDBAHN" width={180} height={76} />
        </Box>

        {success ? (
          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', maxWidth: 600, mx: 'auto' }}>
            <CardContent sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
              <CheckOutlined style={{ fontSize: 64, color: '#4caf50', marginBottom: 24 }} />
              <Typography variant="h3" gutterBottom>
                Thank You!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                We&apos;ve received your enterprise inquiry. Our sales team will reach out to you within 1 business day.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/')}
                sx={{
                  px: 4,
                  backgroundColor: '#1976d2',
                  '&:hover': { backgroundColor: '#1565c0' }
                }}
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={4} justifyContent="center">
            {/* Left: Features */}
            <Grid item xs={12} md={5}>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                Enterprise Plan
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4, fontWeight: 400 }}>
                Custom pricing tailored to your organization&apos;s needs. Get everything in Professional, plus advanced enterprise features.
              </Typography>

              <List>
                {ENTERPRISE_FEATURES.map((feature, idx) => (
                  <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckOutlined style={{ fontSize: 16, color: '#4caf50' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={feature}
                      primaryTypographyProps={{
                        variant: 'body1',
                        sx: { color: 'rgba(255,255,255,0.9)' }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Right: Form */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                    Talk to Sales
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Fill out the form below and our team will get back to you within 1 business day.
                  </Typography>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          label="Full Name"
                          value={formData.name}
                          onChange={handleChange('name')}
                          InputProps={{
                            startAdornment: <UserOutlined style={{ marginRight: 8, color: '#999' }} />
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          label="Work Email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange('email')}
                          InputProps={{
                            startAdornment: <MailOutlined style={{ marginRight: 8, color: '#999' }} />
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          label="Company Name"
                          value={formData.company}
                          onChange={handleChange('company')}
                          InputProps={{
                            startAdornment: <BankOutlined style={{ marginRight: 8, color: '#999' }} />
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone (Optional)"
                          value={formData.phone}
                          onChange={handleChange('phone')}
                          InputProps={{
                            startAdornment: <PhoneOutlined style={{ marginRight: 8, color: '#999' }} />
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          select
                          label="Team Size"
                          value={formData.teamSize}
                          onChange={handleChange('teamSize')}
                          InputProps={{
                            startAdornment: <TeamOutlined style={{ marginRight: 8, color: '#999' }} />
                          }}
                        >
                          <MenuItem value="">Select...</MenuItem>
                          <MenuItem value="51-200">51-200</MenuItem>
                          <MenuItem value="201-500">201-500</MenuItem>
                          <MenuItem value="501-1000">501-1,000</MenuItem>
                          <MenuItem value="1001-5000">1,001-5,000</MenuItem>
                          <MenuItem value="5000+">5,000+</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Tell us about your needs (Optional)"
                          multiline
                          rows={4}
                          value={formData.message}
                          onChange={handleChange('message')}
                          placeholder="What are you looking to achieve with EDBAHN? Any specific requirements like SSO, compliance, custom integrations?"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          fullWidth
                          disabled={loading}
                          sx={{
                            py: 1.5,
                            fontSize: '1rem',
                            backgroundColor: '#1976d2',
                            '&:hover': { backgroundColor: '#1565c0' }
                          }}
                        >
                          {loading ? <CircularProgress size={24} color="inherit" /> : 'Get in Touch'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Footer */}
        <Typography variant="body2" color="rgba(255,255,255,0.5)" textAlign="center" sx={{ mt: 4 }}>
          Or email us directly at{' '}
          <Box component="a" href={`mailto:${ADMIN_EMAIL}`} sx={{ color: '#1976d2' }}>
            {ADMIN_EMAIL}
          </Box>
        </Typography>
      </Container>
    </Box>
  );
};

EnterprisePage.getLayout = function getLayout(page) {
  return <Layout variant="landing">{page}</Layout>;
};

export default EnterprisePage;
