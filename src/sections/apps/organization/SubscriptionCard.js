import React, { useState, useEffect } from 'react';
import axios from 'axios';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  Alert
} from '@mui/material';

// assets
import { CheckCircleOutlined, CrownOutlined, RocketOutlined, StarOutlined } from '@ant-design/icons';

// ==============================|| SUBSCRIPTION CARD ||============================== //

const SubscriptionCard = () => {
  const theme = useTheme();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plansDialogOpen, setPlansDialogOpen] = useState(false);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/subscriptions');
      setSubscription(response.data.subscription);
      setError(null);
    } catch (err) {
      // 403 means admin access required or org context issue - don't show as error
      if (err.response?.status === 403 || err.response?.status === 401) {
        console.log('Subscription not available (may require admin access or org context)');
        setSubscription(null);
        setError(null);
      } else {
        console.error('Error fetching subscription:', err);
        setError(err.response?.data?.message || 'Failed to load subscription');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/subscriptions/plans');
      setPlans(response.data.plans);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const handleViewPlans = async () => {
    await fetchPlans();
    setPlansDialogOpen(true);
  };

  const handleUpgrade = async (planId) => {
    try {
      await axios.post('/api/subscriptions/change-plan', { planId });
      await fetchSubscription();
      setPlansDialogOpen(false);
    } catch (err) {
      console.error('Error upgrading plan:', err);
      alert(err.response?.data?.message || 'Failed to change plan');
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'free':
        return <RocketOutlined style={{ fontSize: '1.5rem' }} />;
      case 'pro':
        return <StarOutlined style={{ fontSize: '1.5rem' }} />;
      case 'enterprise':
        return <CrownOutlined style={{ fontSize: '1.5rem' }} />;
      default:
        return <RocketOutlined style={{ fontSize: '1.5rem' }} />;
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'free':
        return 'default';
      case 'pro':
        return 'primary';
      case 'enterprise':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Subscription Plan</Typography>
            <LinearProgress />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">No active subscription found</Alert>
        </CardContent>
      </Card>
    );
  }

  const statusColor = subscription.status === 'active' ? 'success' : 'warning';
  const daysRemaining = Math.ceil(
    (new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5">Subscription Plan</Typography>
              <Chip
                label={subscription.status.toUpperCase()}
                color={statusColor}
                size="small"
              />
            </Stack>

            <Divider />

            {/* Current Plan */}
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    bgcolor: theme.palette[getPlanColor(subscription.planId)]?.lighter || theme.palette.primary.lighter,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.palette[getPlanColor(subscription.planId)]?.main || theme.palette.primary.main
                  }}
                >
                  {getPlanIcon(subscription.planId)}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4">{subscription.plan.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {subscription.plan.description}
                  </Typography>
                </Box>
              </Stack>

              {/* Pricing */}
              {subscription.planId !== 'enterprise' ? (
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography variant="h3">
                    ${subscription.plan.price}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    / {subscription.plan.billingInterval}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="h5" color="textSecondary">
                  Custom Pricing
                </Typography>
              )}

              {/* Period Info */}
              <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">
                    Current Period
                  </Typography>
                  <Typography variant="body2">
                    {daysRemaining} days remaining
                  </Typography>
                </Stack>
                <Typography variant="caption" color="textSecondary">
                  Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </Typography>
              </Stack>
            </Stack>

            <Divider />

            {/* Features */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                Plan Features
              </Typography>
              <Grid container spacing={1}>
                {subscription.plan.features.slice(0, 6).map((feature, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CheckCircleOutlined
                        style={{
                          color: theme.palette.success.main,
                          fontSize: '1rem'
                        }}
                      />
                      <Typography variant="body2">
                        {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
              {subscription.plan.features.length > 6 && (
                <Typography variant="caption" color="textSecondary">
                  + {subscription.plan.features.length - 6} more features
                </Typography>
              )}
            </Stack>

            <Divider />

            {/* Resource Limits */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                Resource Limits
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="textSecondary">
                      Projects
                    </Typography>
                    <Typography variant="h6">
                      {subscription.plan.resourceLimits.maxProjects === -1
                        ? 'Unlimited'
                        : subscription.plan.resourceLimits.maxProjects}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="textSecondary">
                      Participants
                    </Typography>
                    <Typography variant="h6">
                      {subscription.plan.resourceLimits.maxParticipants === -1
                        ? 'Unlimited'
                        : subscription.plan.resourceLimits.maxParticipants}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="textSecondary">
                      Sub-Organizations
                    </Typography>
                    <Typography variant="h6">
                      {subscription.plan.resourceLimits.maxSubOrganizations === -1
                        ? 'Unlimited'
                        : subscription.plan.resourceLimits.maxSubOrganizations}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="textSecondary">
                      Storage
                    </Typography>
                    <Typography variant="h6">
                      {subscription.plan.resourceLimits.maxStorageGB} GB
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>

            {/* Actions */}
            {subscription.planId !== 'enterprise' && (
              <>
                <Divider />
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleViewPlans}
                    startIcon={<CrownOutlined />}
                  >
                    Upgrade Plan
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Plans Dialog */}
      <Dialog
        open={plansDialogOpen}
        onClose={() => setPlansDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h4">Choose Your Plan</Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {plans.map((plan) => (
              <Grid item xs={12} md={4} key={plan.planId}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    border: plan.planId === subscription.planId ? `2px solid ${theme.palette.primary.main}` : undefined,
                    position: 'relative'
                  }}
                >
                  {plan.highlightText && (
                    <Chip
                      label={plan.highlightText}
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16
                      }}
                    />
                  )}
                  <CardContent>
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: 2,
                          bgcolor: theme.palette[getPlanColor(plan.planId)]?.lighter || theme.palette.primary.lighter,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.palette[getPlanColor(plan.planId)]?.main || theme.palette.primary.main
                        }}
                      >
                        {getPlanIcon(plan.planId)}
                      </Box>

                      <Typography variant="h4">{plan.name}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ minHeight: 40 }}>
                        {plan.description}
                      </Typography>

                      {plan.planId !== 'enterprise' ? (
                        <Stack direction="row" spacing={1} alignItems="baseline">
                          <Typography variant="h3">${plan.price}</Typography>
                          <Typography variant="body1" color="textSecondary">
                            / {plan.billingInterval}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="h5" color="textSecondary">
                          Custom Pricing
                        </Typography>
                      )}

                      <Divider />

                      <Stack spacing={1}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {plan.features.length} Features Included
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {plan.resourceLimits.maxProjects === -1 ? 'Unlimited' : plan.resourceLimits.maxProjects} Projects,{' '}
                          {plan.resourceLimits.maxParticipants === -1 ? 'Unlimited' : plan.resourceLimits.maxParticipants} Participants
                        </Typography>
                      </Stack>

                      <Button
                        variant={plan.planId === subscription.planId ? 'outlined' : 'contained'}
                        fullWidth
                        disabled={plan.planId === subscription.planId}
                        onClick={() => handleUpgrade(plan.planId)}
                      >
                        {plan.planId === subscription.planId ? 'Current Plan' : 'Select Plan'}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlansDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SubscriptionCard;
