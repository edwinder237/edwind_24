/**
 * ============================================
 * POST /api/subscriptions/checkout
 * ============================================
 *
 * Creates a Stripe Checkout session for subscription.
 * Redirects user to Stripe-hosted checkout page.
 *
 * Request Body:
 * {
 *   planId: 'essential' | 'professional' | 'enterprise',
 *   interval: 'monthly' | 'annual'
 * }
 *
 * Response:
 * {
 *   success: true,
 *   url: 'https://checkout.stripe.com/...',
 *   sessionId: 'cs_xxx'
 * }
 */

import { createHandler } from '../../../lib/api/createHandler';
import { ValidationError } from '../../../lib/errors/index.js';
import { createCheckoutSession, getPriceIdForPlan, getStripe } from '../../../lib/stripe/stripeService.js';
import prisma from '../../../lib/prisma.js';

export default createHandler({
  scope: 'admin',
  skipSubscriptionCheck: true,
  POST: async (req, res) => {
    const { orgContext } = req;
  const { planId, interval = 'monthly' } = req.body;

  // Validate input
  if (!planId) {
    throw new ValidationError('planId is required');
  }

  const validPlans = ['essential', 'professional', 'enterprise'];
  if (!validPlans.includes(planId)) {
    throw new ValidationError(`Invalid planId. Must be one of: ${validPlans.join(', ')}`);
  }

  const validIntervals = ['monthly', 'annual'];
  if (!validIntervals.includes(interval)) {
    throw new ValidationError(`Invalid interval. Must be one of: ${validIntervals.join(', ')}`);
  }

  // Get the Stripe Price ID for this plan
  const priceId = await getPriceIdForPlan(planId, interval);

  if (!priceId) {
    throw new ValidationError(`No Stripe price configured for plan: ${planId} (${interval}). Please contact support.`);
  }

  // Check if organization already has an active Stripe subscription
  const currentSubscription = await prisma.subscriptions.findUnique({
    where: { organizationId: orgContext.organizationId },
    select: { id: true, stripeSubscriptionId: true, status: true, planId: true }
  });

  if (currentSubscription?.stripeSubscriptionId && currentSubscription.status === 'active') {
    // Verify the actual Stripe subscription status — DB may say "active" (e.g. after
    // L0 admin reactivation) while the Stripe subscription is actually canceled.
    const stripe = getStripe();
    let stripeSubActive = true;
    try {
      const stripeSub = await stripe.subscriptions.retrieve(currentSubscription.stripeSubscriptionId);
      if (stripeSub.status === 'canceled' || stripeSub.status === 'incomplete_expired') {
        stripeSubActive = false;
        // Clear the stale Stripe subscription ID so future flows are clean
        await prisma.subscriptions.update({
          where: { id: currentSubscription.id },
          data: { stripeSubscriptionId: null }
        });
      }
    } catch (err) {
      // If Stripe can't find the subscription, it's gone — allow new checkout
      if (err.code === 'resource_missing') {
        stripeSubActive = false;
        await prisma.subscriptions.update({
          where: { id: currentSubscription.id },
          data: { stripeSubscriptionId: null }
        });
      } else {
        console.error('Error verifying Stripe subscription:', err.message);
      }
    }

    if (stripeSubActive) {
      // Truly active in Stripe — redirect to billing portal instead
      return res.status(400).json({
        error: 'Already subscribed',
        message: 'Your organization already has an active subscription. Use the billing portal to make changes.',
        currentPlan: currentSubscription.planId,
        action: 'use_billing_portal'
      });
    }
  }

  // Build URLs — success goes through verify endpoint to sync Stripe data before landing
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 8081}`;
  const successUrl = `${baseUrl}/api/subscriptions/verify-checkout?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/`;

    // Create checkout session
    const session = await createCheckoutSession({
      organizationId: orgContext.organizationId,
      priceId,
      successUrl,
      cancelUrl,
      interval
    });

    return res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id
    });
  }
});
