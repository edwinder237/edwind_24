import { useState, useEffect } from 'react';

// material-ui
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Switch,
  Typography,
  alpha,
  useTheme
} from '@mui/material';

// icons
import {
  SettingOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  BugOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ApiOutlined,
  MailOutlined,
  CloudOutlined
} from '@ant-design/icons';

// project imports
import Layout from 'layout';
import Page from 'components/Page';
import MainCard from 'components/MainCard';
import useUser from 'hooks/useUser';

// ==============================|| SYSTEM INFO CARD ||============================== //

const SystemInfoCard = ({ title, icon, children }) => {
  const theme = useTheme();

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.1)
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6">{title}</Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
};

// ==============================|| STATUS ITEM ||============================== //

const StatusItem = ({ label, value, status = 'normal', description }) => {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.text.primary;
    }
  };

  return (
    <ListItem sx={{ px: 0 }}>
      <ListItemText
        primary={label}
        secondary={description}
        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
        secondaryTypographyProps={{ variant: 'caption' }}
      />
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: getStatusColor(),
          fontFamily: 'monospace'
        }}
      >
        {value}
      </Typography>
    </ListItem>
  );
};

// ==============================|| FEATURE FLAG ||============================== //

const FeatureFlag = ({ label, enabled, description, onToggle }) => {
  return (
    <ListItem sx={{ px: 0 }}>
      <ListItemText
        primary={label}
        secondary={description}
        primaryTypographyProps={{ variant: 'body2' }}
        secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
      />
      <Switch
        checked={enabled}
        onChange={onToggle}
        color="success"
        size="small"
      />
    </ListItem>
  );
};

// ==============================|| INTERNAL - SYSTEM SETTINGS PAGE ||============================== //

const InternalSystemSettingsPage = () => {
  const theme = useTheme();
  const { user, isLoading: userLoading, isAuthenticated } = useUser();

  // Feature flags state
  const [featureFlags, setFeatureFlags] = useState({
    maintenanceMode: false,
    debugMode: false,
    stripeEnabled: true,
    emailNotifications: true,
    aiFeatures: true
  });

  // System info
  const systemInfo = {
    version: '0.6.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: typeof process !== 'undefined' ? process.version : 'N/A',
    buildDate: new Date().toISOString().split('T')[0]
  };

  // Check if current user is owner
  const isOwner = user?.role?.toLowerCase() === 'owner';

  // Handle feature flag toggle
  const handleFeatureToggle = (flag) => {
    setFeatureFlags((prev) => ({
      ...prev,
      [flag]: !prev[flag]
    }));
    // TODO: Persist to database/API
  };

  // Loading state
  if (userLoading) {
    return (
      <Page title="System Settings">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  // Not owner
  if (!isOwner) {
    return (
      <Page title="System Settings">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <MainCard>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CrownOutlined style={{ fontSize: '4rem', color: theme.palette.warning.main, marginBottom: 16 }} />
              <Typography variant="h4" gutterBottom>
                Owner Access Required
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This page is only accessible to platform owners.
              </Typography>
            </Box>
          </MainCard>
        </Container>
      </Page>
    );
  }

  return (
    <Page title="System Settings">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4">System Settings</Typography>
            <Typography variant="body2" color="text.secondary">
              Platform configuration and feature flags
            </Typography>
          </Box>
          <Chip
            icon={<CrownOutlined />}
            label="Owner Only"
            color="warning"
            variant="outlined"
          />
        </Stack>

        <Grid container spacing={3}>
          {/* System Information */}
          <Grid item xs={12} md={6}>
            <SystemInfoCard
              title="System Information"
              icon={<InfoCircleOutlined style={{ fontSize: 20, color: theme.palette.primary.main }} />}
            >
              <List disablePadding>
                <StatusItem
                  label="Version"
                  value={systemInfo.version}
                  status="success"
                />
                <Divider />
                <StatusItem
                  label="Environment"
                  value={systemInfo.environment}
                  status={systemInfo.environment === 'production' ? 'success' : 'warning'}
                />
                <Divider />
                <StatusItem
                  label="Node Version"
                  value={systemInfo.nodeVersion}
                />
                <Divider />
                <StatusItem
                  label="Build Date"
                  value={systemInfo.buildDate}
                />
              </List>
            </SystemInfoCard>
          </Grid>

          {/* Service Status */}
          <Grid item xs={12} md={6}>
            <SystemInfoCard
              title="Service Status"
              icon={<CloudServerOutlined style={{ fontSize: 20, color: theme.palette.primary.main }} />}
            >
              <List disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <DatabaseOutlined style={{ color: theme.palette.success.main }} />
                  </ListItemIcon>
                  <ListItemText primary="Database" secondary="PostgreSQL" />
                  <Chip size="small" label="Connected" color="success" variant="outlined" />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <SafetyCertificateOutlined style={{ color: theme.palette.success.main }} />
                  </ListItemIcon>
                  <ListItemText primary="Authentication" secondary="WorkOS AuthKit" />
                  <Chip size="small" label="Active" color="success" variant="outlined" />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ApiOutlined style={{ color: theme.palette.success.main }} />
                  </ListItemIcon>
                  <ListItemText primary="Stripe" secondary="Payment Processing" />
                  <Chip
                    size="small"
                    label={featureFlags.stripeEnabled ? 'Enabled' : 'Disabled'}
                    color={featureFlags.stripeEnabled ? 'success' : 'default'}
                    variant="outlined"
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CloudOutlined style={{ color: theme.palette.info.main }} />
                  </ListItemIcon>
                  <ListItemText primary="AI Services" secondary="Gemini API" />
                  <Chip
                    size="small"
                    label={featureFlags.aiFeatures ? 'Active' : 'Disabled'}
                    color={featureFlags.aiFeatures ? 'info' : 'default'}
                    variant="outlined"
                  />
                </ListItem>
              </List>
            </SystemInfoCard>
          </Grid>

          {/* Feature Flags */}
          <Grid item xs={12} md={6}>
            <SystemInfoCard
              title="Feature Flags"
              icon={<ThunderboltOutlined style={{ fontSize: 20, color: theme.palette.warning.main }} />}
            >
              <List disablePadding>
                <FeatureFlag
                  label="Maintenance Mode"
                  description="Show maintenance page to all users"
                  enabled={featureFlags.maintenanceMode}
                  onToggle={() => handleFeatureToggle('maintenanceMode')}
                />
                <Divider />
                <FeatureFlag
                  label="Stripe Payments"
                  description="Enable payment processing via Stripe"
                  enabled={featureFlags.stripeEnabled}
                  onToggle={() => handleFeatureToggle('stripeEnabled')}
                />
                <Divider />
                <FeatureFlag
                  label="AI Features"
                  description="Enable AI-powered features (summarization, etc.)"
                  enabled={featureFlags.aiFeatures}
                  onToggle={() => handleFeatureToggle('aiFeatures')}
                />
                <Divider />
                <FeatureFlag
                  label="Email Notifications"
                  description="Send email notifications to users"
                  enabled={featureFlags.emailNotifications}
                  onToggle={() => handleFeatureToggle('emailNotifications')}
                />
              </List>
            </SystemInfoCard>
          </Grid>

          {/* Developer Settings */}
          <Grid item xs={12} md={6}>
            <SystemInfoCard
              title="Developer Settings"
              icon={<BugOutlined style={{ fontSize: 20, color: theme.palette.error.main }} />}
            >
              <List disablePadding>
                <FeatureFlag
                  label="Debug Mode"
                  description="Enable verbose logging and debug info"
                  enabled={featureFlags.debugMode}
                  onToggle={() => handleFeatureToggle('debugMode')}
                />
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Clear All Caches"
                    secondary="Invalidate subscription and feature caches"
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                  <Button variant="outlined" size="small" color="warning">
                    Clear
                  </Button>
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Test Webhook"
                    secondary="Send a test Stripe webhook event"
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                  <Button variant="outlined" size="small">
                    Send
                  </Button>
                </ListItem>
              </List>
            </SystemInfoCard>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Quick Links
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DatabaseOutlined />}
                  onClick={() => window.open('https://console.prisma.io', '_blank')}
                >
                  Prisma Studio
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ApiOutlined />}
                  onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                >
                  Stripe Dashboard
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SafetyCertificateOutlined />}
                  onClick={() => window.open('https://dashboard.workos.com', '_blank')}
                >
                  WorkOS Dashboard
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CloudOutlined />}
                  onClick={() => window.open('https://console.cloud.google.com', '_blank')}
                >
                  Google Cloud Console
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
};

InternalSystemSettingsPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default InternalSystemSettingsPage;
