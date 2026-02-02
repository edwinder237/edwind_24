/**
 * ============================================
 * POST /api/subscriptions/sync
 * ============================================
 *
 * Syncs subscription data from Stripe to the database.
 * Use this after completing Stripe Checkout to update
 * the local database without requiring webhooks.
 */

import { withAdminScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler } from '../../../lib/errors/index.js';
import { getStripe, getPlanFromPriceId } from '../../../lib/stripe/stripeService.js';
import prisma from '../../../lib/prisma.js';
import { invalidateSubscriptionCache } from '../../../lib/features/subscriptionService.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;
  const stripe = getStripe();

  // Find existing subscription record to get Stripe customer ID
  const existingSubscription = await prisma.subscriptions.findUnique({
    where: { organizationId: orgContext.organizationId },
    select: { stripeCustomerId: true }
  });

  // Find Stripe customer by organization metadata
  let stripeCustomerId = existingSubscription?.stripeCustomerId;

  if (!stripeCustomerId) {
    // Search for customer by organization ID in metadata
    const customers = await stripe.customers.search({
      query: `metadata['organizationId']:'${orgContext.organizationId}'`
    });

    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
    }
  }

  if (!stripeCustomerId) {
    return res.status(200).json({
      success: false,
      message: 'No Stripe customer found for this organization'
    });
  }

  // Get active subscriptions for this customer
  const stripeSubscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'active',
    limit: 1
  });

  if (stripeSubscriptions.data.length === 0) {
    // Check for trialing subscriptions
    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'trialing',
      limit: 1
    });

    if (trialingSubscriptions.data.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No active subscription found in Stripe'
      });
    }

    stripeSubscriptions.data = trialingSubscriptions.data;
  }

  const stripeSubscription = stripeSubscriptions.data[0];

  // Debug: log the subscription object to see its structure
  console.log('💳 [SYNC] Stripe subscription data:', JSON.stringify({
    id: stripeSubscription.id,
    status: stripeSubscription.status,
    current_period_start: stripeSubscription.current_period_start,
    current_period_end: stripeSubscription.current_period_end,
    items: stripeSubscription.items?.data?.map(item => ({
      price_id: item.price?.id,
      product: item.price?.product
    }))
  }, null, 2));

  const priceId = stripeSubscription.items.data[0]?.price?.id;
  const plan = await getPlanFromPriceId(priceId);

  if (!plan) {
    return res.status(200).json({
      success: false,
      message: `Unknown price ID: ${priceId}`
    });
  }

  // Handle period dates - use current date as fallback if not available
  const now = new Date();
  const currentPeriodStart = stripeSubscription.current_period_start
    ? new Date(stripeSubscription.current_period_start * 1000)
    : now;
  const currentPeriodEnd = stripeSubscription.current_period_end
    ? new Date(stripeSubscription.current_period_end * 1000)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days from now

  // Upsert subscription in database (billingInterval fetched from Stripe when needed)
  const dbSubscription = await prisma.subscriptions.upsert({
    where: { organizationId: orgContext.organizationId },
    create: {
      organizationId: orgContext.organizationId,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscription.id,
      stripeProductId: stripeSubscription.items.data[0]?.price?.product,
      stripePriceId: priceId,
      planId: plan.planId,
      status: stripeSubscription.status,
      currentPeriodStart,
      currentPeriodEnd
    },
    update: {
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscription.id,
      stripeProductId: stripeSubscription.items.data[0]?.price?.product,
      stripePriceId: priceId,
      planId: plan.planId,
      status: stripeSubscription.status,
      currentPeriodStart,
      currentPeriodEnd
    },
    include: {
      plan: true
    }
  });

  // Invalidate subscription cache so fresh data is returned
  invalidateSubscriptionCache(orgContext.organizationId);

  console.log(`💳 [SYNC] Synced subscription for org ${orgContext.organizationId} to ${plan.planId}`);

  return res.status(200).json({
    success: true,
    subscription: {
      planId: dbSubscription.planId,
      status: dbSubscription.status,
      plan: {
        name: dbSubscription.plan.name
      }
    }
  });
}

export default withAdminScope(asyncHandler(handler));
