/**
 * ============================================
 * POST /api/subscriptions/change-plan
 * ============================================
 *
 * Changes the plan for an existing Stripe subscription.
 * Handles prorations automatically.
 *
 * Request Body:
 * {
 *   planId: 'essential' | 'professional' | 'enterprise',
 *   interval: 'monthly' | 'annual' (optional, defaults to current interval)
 * }
 *
 * PROTECTED: Admin-only access via withAdminScope middleware
 */

import { withAdminScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler, ValidationError } from '../../../lib/errors/index.js';
import { getStripe, getPriceIdForPlan } from '../../../lib/stripe/stripeService.js';
import prisma from '../../../lib/prisma.js';
import { invalidateSubscriptionCache } from '../../../lib/features/subscriptionService.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;
  const { planId, interval } = req.body;
  const stripe = getStripe();

  // Validate input
  if (!planId) {
    throw new ValidationError('planId is required');
  }

  const validPlans = ['essential', 'professional', 'enterprise'];
  if (!validPlans.includes(planId)) {
    throw new ValidationError(`Invalid planId. Must be one of: ${validPlans.join(', ')}`);
  }

  // Get current subscription from database
  const currentSubscription = await prisma.subscriptions.findUnique({
    where: { organizationId: orgContext.organizationId },
    include: {
      plan: true
    }
  });

  if (!currentSubscription?.stripeSubscriptionId) {
    return res.status(400).json({
      success: false,
      message: 'No active Stripe subscription found. Please subscribe first.',
      action: 'use_checkout'
    });
  }

  // Get the target plan from database
  const targetPlan = await prisma.subscription_plans.findFirst({
    where: { planId }
  });

  if (!targetPlan) {
    return res.status(404).json({
      success: false,
      message: `Plan '${planId}' not found`
    });
  }

  if (!targetPlan.isActive || !targetPlan.isPublic) {
    return res.status(400).json({
      success: false,
      message: 'This plan is not currently available'
    });
  }

  // Determine the billing interval - use provided or keep current
  let billingInterval = interval;
  if (!billingInterval) {
    // Try to detect current interval from Stripe
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(currentSubscription.stripeSubscriptionId);
      const currentInterval = stripeSubscription.items.data[0]?.price?.recurring?.interval;
      billingInterval = currentInterval === 'year' ? 'annual' : 'monthly';
    } catch {
      billingInterval = 'monthly'; // Default to monthly if can't detect
    }
  }

  // Get the new Stripe Price ID
  const newPriceId = await getPriceIdForPlan(planId, billingInterval);

  if (!newPriceId) {
    throw new ValidationError(`No Stripe price configured for plan: ${planId} (${billingInterval}). Please contact support.`);
  }

  try {
    // Get the current Stripe subscription to find the item ID
    const stripeSubscription = await stripe.subscriptions.retrieve(currentSubscription.stripeSubscriptionId);

    if (!stripeSubscription || stripeSubscription.status === 'canceled') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is no longer active in Stripe.',
        action: 'use_checkout'
      });
    }

    // Check if already on this price
    const currentPriceId = stripeSubscription.items.data[0]?.price?.id;
    console.log(`💳 [CHANGE-PLAN] Current price: ${currentPriceId}, New price: ${newPriceId}`);

    if (currentPriceId === newPriceId) {
      // Find what plan this price belongs to for better messaging
      const actualPlan = await prisma.subscription_plans.findFirst({
        where: {
          OR: [
            { stripePriceId: currentPriceId },
            { stripeAnnualPriceId: currentPriceId }
          ]
        },
        select: { planId: true, name: true }
      });

      return res.status(400).json({
        success: false,
        message: actualPlan
          ? `You are already on the ${actualPlan.name} plan. Click "Sync" to refresh your subscription data.`
          : 'You are already on this plan and billing interval. Try clicking "Sync" to refresh.',
        currentPlan: actualPlan?.planId || null,
        action: 'sync_recommended'
      });
    }

    // Get the subscription item ID (first item)
    const subscriptionItemId = stripeSubscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      return res.status(400).json({
        success: false,
        message: 'Could not find subscription item to update.'
      });
    }

    // Determine if this is an upgrade or downgrade
    const planOrder = { essential: 1, professional: 2, enterprise: 3 };
    const currentPlanId = currentSubscription.plan?.planId || 'essential';
    const isUpgrade = planOrder[planId] > (planOrder[currentPlanId] || 0);

    // Update the subscription with the new price
    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.stripeSubscriptionId,
      {
        items: [{
          id: subscriptionItemId,
          price: newPriceId
        }],
        proration_behavior: 'create_prorations'
      }
    );

    // Handle period dates with fallbacks
    const now = new Date();
    const currentPeriodStart = updatedSubscription.current_period_start
      ? new Date(updatedSubscription.current_period_start * 1000)
      : currentSubscription.currentPeriodStart || now;
    const currentPeriodEnd = updatedSubscription.current_period_end
      ? new Date(updatedSubscription.current_period_end * 1000)
      : currentSubscription.currentPeriodEnd || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Update our database
    await prisma.subscriptions.update({
      where: { id: currentSubscription.id },
      data: {
        planId: targetPlan.planId,
        stripePriceId: newPriceId,
        status: updatedSubscription.status,
        currentPeriodStart,
        currentPeriodEnd,
        updatedAt: now
      }
    });

    // Record in history
    await prisma.subscription_history.create({
      data: {
        subscriptionId: currentSubscription.id,
        eventType: isUpgrade ? 'upgraded' : 'downgraded',
        fromPlanId: currentSubscription.planId,
        toPlanId: targetPlan.planId,
        fromStatus: currentSubscription.status,
        toStatus: updatedSubscription.status,
        reason: `User ${isUpgrade ? 'upgraded' : 'downgraded'} to ${targetPlan.name} (${billingInterval})`,
        changedBy: orgContext.userId,
        changedByRole: 'admin',
        metadata: {
          newPriceId,
          interval: billingInterval
        }
      }
    });

    // Invalidate subscription cache so fresh data is returned
    invalidateSubscriptionCache(orgContext.organizationId);

    console.log(`💳 [CHANGE-PLAN] Org ${orgContext.organizationId} changed to ${planId} (${billingInterval})`);

    return res.status(200).json({
      success: true,
      message: `Successfully ${isUpgrade ? 'upgraded' : 'changed'} to ${targetPlan.name}`,
      isUpgrade,
      subscription: {
        planId,
        planName: targetPlan.name,
        status: updatedSubscription.status,
        billingInterval,
        currentPeriodEnd: currentPeriodEnd.toISOString()
      }
    });
  } catch (err) {
    console.error('Error changing plan:', err);

    // Handle specific Stripe errors
    if (err.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        message: 'Payment failed. Please update your payment method and try again.',
        action: 'update_payment'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to change plan. Please try again or contact support.'
    });
  }
}

export default withAdminScope(asyncHandler(handler));
