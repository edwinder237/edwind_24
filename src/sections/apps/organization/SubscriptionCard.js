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
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Alert
} from '@mui/material';

// assets
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  CrownOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  RocketOutlined,
  StarOutlined,
  SwapOutlined
} from '@ant-design/icons';

// subscription components
import { BillingPortalButton } from '../../../components/subscription';

// ==============================|| SUBSCRIPTION CARD ||============================== //

const SubscriptionCard = () => {
  const theme = useTheme();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plansDialogOpen, setPlansDialogOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentMethodLoading, setPaymentMethodLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Check if returning from Stripe checkout
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutStatus = urlParams.get('checkout');

    if (checkoutStatus === 'success') {
      // Sync subscription from Stripe after successful checkout
      syncSubscription();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else {
      fetchSubscription();
    }

    fetchPlans(); // Fetch plans on mount for the no-subscription UI
    fetchPaymentMethod(); // Fetch payment method on mount
    fetchInvoices(); // Fetch invoices on mount
  }, []);

  const syncSubscription = async (showAlert = false) => {
    try {
      setSyncing(true);
      setLoading(true);
      // Sync from Stripe
      const syncResponse = await axios.post('/api/subscriptions/sync');
      if (syncResponse.data.success) {
        // Now fetch the full subscription data and payment method
        await Promise.all([fetchSubscription(), fetchPaymentMethod(), fetchInvoices()]);
        if (showAlert) {
          alert(`Synced successfully! Current plan: ${syncResponse.data.subscription?.plan?.name || 'Unknown'}`);
        }
      } else {
        console.log('Sync message:', syncResponse.data.message);
        await Promise.all([fetchSubscription(), fetchPaymentMethod()]);
        if (showAlert) {
          alert(syncResponse.data.message || 'Sync completed');
        }
      }
    } catch (err) {
      console.error('Error syncing subscription:', err);
      await Promise.all([fetchSubscription(), fetchPaymentMethod()]);
      if (showAlert) {
        alert('Failed to sync subscription');
      }
    } finally {
      setSyncing(false);
      // Notify other components that subscription may have changed
      window.dispatchEvent(new CustomEvent('subscription-updated'));
    }
  };

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/subscriptions');
      setSubscription(response.data.subscription);
      setError(null);
    } catch (err) {
      // 403/401 means access issues, 404 means no subscription - don't show as error
      if (err.response?.status === 403 || err.response?.status === 401 || err.response?.status === 404) {
        console.log('Subscription not available (may require admin access, org context, or no subscription)');
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

  const fetchPaymentMethod = async () => {
    try {
      setPaymentMethodLoading(true);
      const response = await axios.get('/api/subscriptions/payment-method');
      setPaymentMethod(response.data.paymentMethod);
    } catch (err) {
      console.error('Error fetching payment method:', err);
    } finally {
      setPaymentMethodLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const response = await axios.get('/api/subscriptions/invoices');
      setInvoices(response.data.invoices || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleDownloadInvoice = (invoicePdfUrl) => {
    if (invoicePdfUrl) {
      window.open(invoicePdfUrl, '_blank');
    }
  };

  const getInvoiceStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'open':
        return 'warning';
      case 'draft':
        return 'default';
      case 'void':
      case 'uncollectible':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleManagePaymentMethod = async () => {
    try {
      const response = await axios.post('/api/subscriptions/billing-portal');
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error('Error opening billing portal:', err);
      alert('Failed to open billing portal');
    }
  };

  const getCardBrandIcon = (brand) => {
    // Return brand name for display (can be extended with actual icons)
    const brandNames = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
      diners: 'Diners Club',
      jcb: 'JCB',
      unionpay: 'UnionPay'
    };
    return brandNames[brand?.toLowerCase()] || brand || 'Card';
  };

  const handleViewPlans = async () => {
    await fetchPlans();
    setPlansDialogOpen(true);
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);
      const response = await axios.post('/api/subscriptions/cancel');
      if (response.data.success) {
        setCancelDialogOpen(false);
        // Refresh subscription data
        await fetchSubscription();
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      alert(err.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const response = await axios.post('/api/subscriptions/reactivate');
      if (response.data.success) {
        await fetchSubscription();
      }
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      alert(err.response?.data?.message || 'Failed to reactivate subscription');
    }
  };

  const handleUpgrade = async (planId, interval = 'monthly') => {
    try {
      // If user already has a subscription, use change-plan endpoint
      if (subscription) {
        const response = await axios.post('/api/subscriptions/change-plan', { planId, interval });

        if (response.data.success) {
          // Show success message and refresh data
          setPlansDialogOpen(false);
          await Promise.all([fetchSubscription(), fetchPaymentMethod(), fetchInvoices()]);
          // Notify other components (like OrganizationProfile) that subscription changed
          window.dispatchEvent(new CustomEvent('subscription-updated'));
          alert(response.data.message || 'Plan changed successfully!');
        }
      } else {
        // Use Stripe Checkout for new subscriptions
        const response = await axios.post('/api/subscriptions/checkout', { planId, interval });

        if (response.data.url) {
          // Redirect to Stripe Checkout
          window.location.href = response.data.url;
        }
      }
    } catch (err) {
      console.error('Error changing plan:', err);

      // If sync is recommended, trigger sync automatically
      if (err.response?.data?.action === 'sync_recommended') {
        const shouldSync = window.confirm(
          `${err.response?.data?.message}\n\nWould you like to sync now?`
        );
        if (shouldSync) {
          setPlansDialogOpen(false);
          await syncSubscription(true);
          return;
        }
      }

      // If payment method needs update, redirect to billing portal
      if (err.response?.data?.action === 'update_payment') {
        try {
          const portalResponse = await axios.post('/api/subscriptions/billing-portal');
          if (portalResponse.data.url) {
            window.location.href = portalResponse.data.url;
            return;
          }
        } catch (portalErr) {
          console.error('Error opening billing portal:', portalErr);
        }
      }

      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to change plan';
      console.error('Plan change error details:', err.response?.data);
      alert(errorMsg);
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'essential':
        return <RocketOutlined style={{ fontSize: '1.5rem' }} />;
      case 'professional':
        return <StarOutlined style={{ fontSize: '1.5rem' }} />;
      case 'enterprise':
        return <CrownOutlined style={{ fontSize: '1.5rem' }} />;
      default:
        return <RocketOutlined style={{ fontSize: '1.5rem' }} />;
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'essential':
        return 'info';
      case 'professional':
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
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5">Subscription Plan</Typography>
              <Chip label="NO PLAN" color="default" size="small" />
            </Stack>

            <Divider />

            <Alert severity="info" sx={{ mb: 2 }}>
              Choose a subscription plan to unlock all features
            </Alert>

            <Grid container spacing={2}>
              {plans.length > 0 ? (
                plans.map((plan) => (
                  <Grid item xs={12} md={4} key={plan.planId}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        border: plan.highlightText ? `2px solid ${theme.palette.primary.main}` : undefined
                      }}
                    >
                      <CardContent>
                        <Stack spacing={2} alignItems="center" textAlign="center">
                          {plan.highlightText && (
                            <Chip label={plan.highlightText} color="primary" size="small" sx={{ mb: -1 }} />
                          )}
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
                          <Typography variant="h5">{plan.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {plan.description}
                          </Typography>
                          <Typography variant="h4">
                            ${plan.price}
                            <Typography component="span" variant="body2" color="textSecondary">
                              /{plan.billingInterval === 'monthly' ? 'mo' : 'yr'}
                            </Typography>
                          </Typography>
                          <Button
                            variant={plan.highlightText ? 'contained' : 'outlined'}
                            fullWidth
                            onClick={() => handleUpgrade(plan.planId, plan.billingInterval)}
                          >
                            Subscribe
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <LinearProgress />
                </Grid>
              )}
            </Grid>
          </Stack>
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
      <Stack spacing={3}>
        {/* Subscription Plan Card */}
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
            <Divider />
            <Stack direction="row" spacing={2}>
              {subscription.planId !== 'enterprise' && (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleViewPlans}
                  startIcon={<CrownOutlined />}
                >
                  Upgrade Plan
                </Button>
              )}
              <BillingPortalButton
                fullWidth
                variant={subscription.planId === 'enterprise' ? 'contained' : 'outlined'}
              >
                Manage Billing
              </BillingPortalButton>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

        {/* Payment Method Card */}
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">Payment Method</Typography>
                {paymentMethod && (
                  <Chip
                    label={getCardBrandIcon(paymentMethod.brand)}
                    size="small"
                    color="default"
                  />
                )}
              </Stack>

              <Divider />

              {paymentMethodLoading ? (
                <LinearProgress />
              ) : paymentMethod ? (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 60,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: theme.palette.grey[100],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <CreditCardOutlined style={{ fontSize: '1.5rem', color: theme.palette.text.secondary }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">
                        {getCardBrandIcon(paymentMethod.brand)} ending in {paymentMethod.last4}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    variant="outlined"
                    onClick={handleManagePaymentMethod}
                    startIcon={<CreditCardOutlined />}
                  >
                    Update Payment Method
                  </Button>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Alert severity="warning">
                    No payment method on file
                  </Alert>
                  <Button
                    variant="contained"
                    onClick={handleManagePaymentMethod}
                    startIcon={<CreditCardOutlined />}
                  >
                    Add Payment Method
                  </Button>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Billing Details Card */}
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">Billing Details</Typography>
                <CalendarOutlined style={{ fontSize: '1.25rem', color: theme.palette.text.secondary }} />
              </Stack>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="textSecondary">
                      Billing Cycle
                    </Typography>
                    <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                      {subscription.plan.billingInterval || 'Monthly'}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="textSecondary">
                      Start Date
                    </Typography>
                    <Typography variant="h6">
                      {new Date(subscription.currentPeriodStart).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="textSecondary">
                      Next Billing Date
                    </Typography>
                    <Typography variant="h6">
                      {subscription.cancelAtPeriodEnd
                        ? 'N/A'
                        : new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="textSecondary">
                      Status
                    </Typography>
                    <Chip
                      label={subscription.cancelAtPeriodEnd ? 'CANCELS AT PERIOD END' : subscription.status.toUpperCase()}
                      color={subscription.cancelAtPeriodEnd ? 'warning' : (subscription.status === 'active' ? 'success' : 'default')}
                      size="small"
                    />
                  </Stack>
                </Grid>
              </Grid>

              {subscription.cancelAtPeriodEnd && (
                <Alert
                  severity="warning"
                  icon={<ExclamationCircleOutlined />}
                  action={
                    <Button color="inherit" size="small" onClick={handleReactivateSubscription}>
                      Reactivate
                    </Button>
                  }
                >
                  Your subscription will be cancelled on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                  You will lose access to all features after this date.
                </Alert>
              )}

              <Divider />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<SwapOutlined />}
                  onClick={handleViewPlans}
                  fullWidth
                >
                  Change Plan
                </Button>
                <Tooltip title="Sync subscription data from Stripe">
                  <Button
                    variant="outlined"
                    startIcon={syncing ? null : <ReloadOutlined />}
                    onClick={() => syncSubscription(true)}
                    disabled={syncing}
                    fullWidth
                  >
                    {syncing ? 'Syncing...' : 'Sync'}
                  </Button>
                </Tooltip>
                {!subscription.cancelAtPeriodEnd && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CloseCircleOutlined />}
                    onClick={() => setCancelDialogOpen(true)}
                    fullWidth
                  >
                    Cancel Subscription
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Invoices Card */}
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">Invoices</Typography>
                <FileTextOutlined style={{ fontSize: '1.25rem', color: theme.palette.text.secondary }} />
              </Stack>

              <Divider />

              {invoicesLoading ? (
                <LinearProgress />
              ) : invoices.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id} hover>
                          <TableCell>
                            <Stack>
                              <Typography variant="body2" fontWeight={500}>
                                {invoice.number || 'Draft'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {invoice.description}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(invoice.created).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              ${invoice.amount.toFixed(2)} {invoice.currency}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={invoice.status.toUpperCase()}
                              color={getInvoiceStatusColor(invoice.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              {invoice.invoicePdf && (
                                <Tooltip title="Download PDF">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDownloadInvoice(invoice.invoicePdf)}
                                    color="primary"
                                  >
                                    <DownloadOutlined />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {invoice.hostedInvoiceUrl && (
                                <Tooltip title="View Invoice">
                                  <IconButton
                                    size="small"
                                    onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                                  >
                                    <FileTextOutlined />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No invoices found. Invoices will appear here after your first payment.
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Cancel Subscription Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <ExclamationCircleOutlined style={{ color: theme.palette.warning.main, fontSize: '1.5rem' }} />
            <Typography variant="h4">Cancel Subscription</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography>
              Are you sure you want to cancel your subscription? Your subscription will remain active until the end of your current billing period.
            </Typography>
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>What happens when you cancel:</strong>
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Access continues until {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</li>
                <li>No further charges will be made</li>
                <li>You can reactivate anytime before the end date</li>
                <li>After cancellation, you'll lose access to premium features</li>
              </ul>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
            Keep Subscription
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelSubscription}
            disabled={cancelling}
            startIcon={cancelling ? null : <CloseCircleOutlined />}
          >
            {cancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>

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
