import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
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
  DownOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  RightOutlined,
  RocketOutlined,
  StarOutlined
} from '@ant-design/icons';

// subscription components
import { BillingPortalButton } from '../../../components/subscription';

// ==============================|| SUBSCRIPTION CARD ||============================== //

const SubscriptionCard = () => {
  const theme = useTheme();
  const router = useRouter();
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [invoicesOpen, setInvoicesOpen] = useState(false);

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

      // If subscription is canceled in Stripe, fall back to checkout for a new subscription
      if (err.response?.data?.action === 'use_checkout') {
        try {
          const checkoutResponse = await axios.post('/api/subscriptions/checkout', { planId, interval });
          if (checkoutResponse.data?.url) {
            window.location.href = checkoutResponse.data.url;
            return;
          }
        } catch (checkoutErr) {
          console.error('Error creating checkout session:', checkoutErr);
          alert(checkoutErr.response?.data?.message || 'Failed to create checkout session');
          return;
        }
      }

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
                            onClick={() => plan.planId === 'enterprise' ? router.push('/enterprise') : handleUpgrade(plan.planId, plan.billingInterval)}
                          >
                            {plan.planId === 'enterprise' ? 'Contact Sales' : 'Subscribe'}
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

  const formatLimit = (val) => (val === -1 ? 'Unlimited' : val);

  return (
    <>
      <Stack spacing={2}>
        {/* Cancellation warning */}
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
            Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()} — you'll lose access after this date.
          </Alert>
        )}

        {/* Plan Summary Card — compact single card */}
        <Card>
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Stack spacing={2}>
              {/* Plan header row */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 1.5,
                    bgcolor: theme.palette[getPlanColor(subscription.planId)]?.lighter || theme.palette.primary.lighter,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.palette[getPlanColor(subscription.planId)]?.main || theme.palette.primary.main,
                    flexShrink: 0
                  }}
                >
                  {getPlanIcon(subscription.planId)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h5" noWrap>{subscription.plan.name}</Typography>
                    <Chip label={subscription.status.toUpperCase()} color={statusColor} size="small" />
                  </Stack>
                  <Typography variant="body2" color="textSecondary">
                    {subscription.planId !== 'enterprise' ? (
                      <>
                        <strong>${subscription.plan.price}</strong>/{subscription.plan.billingInterval}
                        {' · '}
                      </>
                    ) : (
                      <>Custom pricing · </>
                    )}
                    Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    {' · '}{daysRemaining}d remaining
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  {subscription.planId !== 'enterprise' && (
                    <Button size="small" variant="contained" onClick={handleViewPlans} startIcon={<CrownOutlined />}>
                      Upgrade
                    </Button>
                  )}
                  <BillingPortalButton size="small" variant="outlined">
                    Manage Billing
                  </BillingPortalButton>
                </Stack>
              </Stack>

              {/* Collapsible plan details */}
              <Box>
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  startIcon={detailsOpen ? <DownOutlined style={{ fontSize: '0.75rem' }} /> : <RightOutlined style={{ fontSize: '0.75rem' }} />}
                  sx={{ color: 'text.secondary', textTransform: 'none', px: 0, '&:hover': { bgcolor: 'transparent' } }}
                >
                  Plan details & limits
                </Button>
                <Collapse in={detailsOpen}>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    {/* Resource limits — inline chips */}
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip size="small" variant="outlined" label={`Projects: ${formatLimit(subscription.plan.resourceLimits.maxProjects)}`} />
                      <Chip size="small" variant="outlined" label={`Participants: ${formatLimit(subscription.plan.resourceLimits.maxParticipants)}`} />
                      <Chip size="small" variant="outlined" label={`Sub-Orgs: ${formatLimit(subscription.plan.resourceLimits.maxSubOrganizations)}`} />
                    </Stack>

                    {/* Features grid */}
                    <Grid container spacing={0.5}>
                      {subscription.plan.features.map((feature, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <CheckCircleOutlined style={{ color: theme.palette.success.main, fontSize: '0.85rem' }} />
                            <Typography variant="caption">
                              {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                          </Stack>
                        </Grid>
                      ))}
                    </Grid>
                  </Stack>
                </Collapse>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Payment & Billing — compact combined row */}
        <Card>
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} divider={<Divider orientation="vertical" flexItem />}>
              {/* Payment method */}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <CreditCardOutlined style={{ fontSize: '1.25rem', color: theme.palette.text.secondary, flexShrink: 0 }} />
                {paymentMethodLoading ? (
                  <LinearProgress sx={{ flex: 1 }} />
                ) : paymentMethod ? (
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {getCardBrandIcon(paymentMethod.brand)} ····{paymentMethod.last4}
                      <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                        exp {paymentMethod.expMonth}/{paymentMethod.expYear}
                      </Typography>
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="warning.main">No payment method</Typography>
                )}
                <Button size="small" variant="text" onClick={handleManagePaymentMethod} sx={{ flexShrink: 0 }}>
                  {paymentMethod ? 'Update' : 'Add'}
                </Button>
              </Stack>

              {/* Billing info */}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <CalendarOutlined style={{ fontSize: '1.25rem', color: theme.palette.text.secondary, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  <Typography component="span" sx={{ textTransform: 'capitalize' }}>
                    {subscription.plan.billingInterval || 'Monthly'}
                  </Typography>
                  <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                    since {new Date(subscription.currentPeriodStart).toLocaleDateString()}
                  </Typography>
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <Tooltip title="Sync from Stripe">
                    <IconButton size="small" onClick={() => syncSubscription(true)} disabled={syncing}>
                      <ReloadOutlined style={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  </Tooltip>
                  {!subscription.cancelAtPeriodEnd && (
                    <Button size="small" color="error" variant="text" onClick={() => setCancelDialogOpen(true)}>
                      Cancel
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Invoices — collapsible */}
        <Card>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: invoicesOpen && invoices.length > 0 ? 0 : 1.5 } }}>
            <Button
              fullWidth
              color="inherit"
              onClick={() => setInvoicesOpen(!invoicesOpen)}
              startIcon={invoicesOpen ? <DownOutlined style={{ fontSize: '0.75rem' }} /> : <RightOutlined style={{ fontSize: '0.75rem' }} />}
              endIcon={
                invoices.length > 0 ? (
                  <Chip label={invoices.length} size="small" sx={{ height: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' } }} />
                ) : null
              }
              sx={{ justifyContent: 'flex-start', textTransform: 'none', color: 'text.primary', px: 0, '&:hover': { bgcolor: 'transparent' } }}
            >
              <Typography variant="body2" fontWeight={500}>Invoices</Typography>
            </Button>
            <Collapse in={invoicesOpen}>
              {invoicesLoading ? (
                <LinearProgress sx={{ my: 1 }} />
              ) : invoices.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id} hover>
                          <TableCell>
                            <Typography variant="body2">{invoice.number || 'Draft'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(invoice.created).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              ${invoice.amount.toFixed(2)} {invoice.currency}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={invoice.status.toUpperCase()} color={getInvoiceStatusColor(invoice.status)} size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              {invoice.invoicePdf && (
                                <Tooltip title="Download PDF">
                                  <IconButton size="small" onClick={() => handleDownloadInvoice(invoice.invoicePdf)} color="primary">
                                    <DownloadOutlined />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {invoice.hostedInvoiceUrl && (
                                <Tooltip title="View Invoice">
                                  <IconButton size="small" onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}>
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
                <Typography variant="caption" color="textSecondary" sx={{ py: 1, display: 'block' }}>
                  No invoices yet
                </Typography>
              )}
            </Collapse>
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
                        onClick={() => plan.planId === 'enterprise' ? router.push('/enterprise') : handleUpgrade(plan.planId)}
                      >
                        {plan.planId === subscription.planId ? 'Current Plan' : plan.planId === 'enterprise' ? 'Contact Sales' : 'Select Plan'}
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
