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

import { withAdminScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler, ValidationError } from '../../../lib/errors/index.js';
import { createCheckoutSession, getPriceIdForPlan } from '../../../lib/stripe/stripeService.js';
import prisma from '../../../lib/prisma.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    select: { stripeSubscriptionId: true, status: true, planId: true }
  });

  if (currentSubscription?.stripeSubscriptionId && currentSubscription.status === 'active') {
    // Already has active subscription - redirect to billing portal instead
    return res.status(400).json({
      error: 'Already subscribed',
      message: 'Your organization already has an active subscription. Use the billing portal to make changes.',
      currentPlan: currentSubscription.planId,
      action: 'use_billing_portal'
    });
  }

  // Build URLs
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 8081}`;
  const successUrl = `${baseUrl}/organization-settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/organization-settings?checkout=canceled`;

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

export default withAdminScope(asyncHandler(handler));
