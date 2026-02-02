/**
 * ============================================
 * GET /api/subscriptions
 * ============================================
 *
 * Returns the current organization's subscription information
 * including plan details, resource limits, and billing info.
 * Price/currency/billingInterval are fetched from Stripe (source of truth).
 *
 * PROTECTED: Admin-only access via withAdminScope middleware
 */

import { withAdminScope } from '../../../lib/middleware/withOrgScope';
import { getOrgSubscription, getResourceUsage } from '../../../lib/features/subscriptionService';
import { getStripe } from '../../../lib/stripe/stripeService';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Organization context is validated by withAdminScope middleware
  const { organizationId } = req.orgContext;

  // Get subscription with plan details and resource usage in parallel
  const [subscription, usage] = await Promise.all([
    getOrgSubscription(organizationId),
    getResourceUsage(organizationId)
  ]);

  // If no subscription, return null - frontend will show subscribe UI
  if (!subscription) {
    return res.status(200).json({
      subscription: null,
      usage: null,
      message: 'No subscription found. Please subscribe to a plan.'
    });
  }

  // Fetch billing details from Stripe (source of truth)
  let price = 0;
  let currency = 'USD';
  let billingInterval = 'monthly';

  if (subscription.stripeSubscriptionId) {
    try {
      const stripe = getStripe();
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      const stripePriceId = stripeSubscription.items.data[0]?.price?.id;

      if (stripePriceId) {
        const stripePrice = await stripe.prices.retrieve(stripePriceId);
        price = stripePrice.unit_amount / 100;
        currency = stripePrice.currency.toUpperCase();
        billingInterval = stripePrice.recurring?.interval === 'year' ? 'annual' : 'monthly';
      }
    } catch (err) {
      console.error('Failed to fetch billing details from Stripe:', err.message);
      // Fall back to plan's Stripe price if subscription fetch fails
      if (subscription.plan?.stripePriceId) {
        try {
          const stripe = getStripe();
          const stripePrice = await stripe.prices.retrieve(subscription.plan.stripePriceId);
          price = stripePrice.unit_amount / 100;
          currency = stripePrice.currency.toUpperCase();
          billingInterval = stripePrice.recurring?.interval === 'year' ? 'annual' : 'monthly';
        } catch (priceErr) {
          console.error('Failed to fetch plan price from Stripe:', priceErr.message);
        }
      }
    }
  }

  // Merge custom limits with plan limits (custom takes precedence)
  const resourceLimits = {
    ...subscription.plan.resourceLimits,
    ...(subscription.customLimits || {})
  };

  // Return subscription data with usage
  return res.status(200).json({
    subscription: {
      id: subscription.id,
      organizationId: subscription.organizationId,
      planId: subscription.planId,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      plan: {
        name: subscription.plan.name,
        description: subscription.plan.description,
        price,
        currency,
        billingInterval,
        features: subscription.plan.features,
        resourceLimits: resourceLimits
      },
      customFeatures: subscription.customFeatures,
      customLimits: subscription.customLimits
    },
    usage: usage
  });
}

export default withAdminScope(handler);
