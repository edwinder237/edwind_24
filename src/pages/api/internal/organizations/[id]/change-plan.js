/**
 * PUT /api/internal/organizations/[id]/change-plan
 *
 * Changes the subscription plan for an organization (Owner/L0 only).
 * Handles Stripe subscription updates with proration.
 *
 * Request Body:
 * {
 *   planId: 'essential' | 'professional' | 'enterprise',
 *   interval: 'monthly' | 'annual' (optional, defaults to current interval)
 * }
 */

import { createHandler } from '../../../../../lib/api/createHandler';
import prisma from '../../../../../lib/prisma';
import { getStripe, getPriceIdForPlan } from '../../../../../lib/stripe/stripeService';
import { invalidateSubscriptionCache } from '../../../../../lib/features/subscriptionService';

export default createHandler({
  scope: 'public',
  PUT: async (req, res) => {
    // Auth: verify owner (L0 only)
    const userId = req.cookies.workos_user_id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const membership = await prisma.organization_memberships.findFirst({
      where: { userId },
      select: { workos_role: true }
    });

    if (!membership || membership.workos_role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    const { id: orgId } = req.query;
    const { planId, interval } = req.body;

    // Validate input
    const validPlans = ['essential', 'professional', 'enterprise'];
    if (!planId) {
      return res.status(400).json({ error: 'planId is required' });
    }
    if (!validPlans.includes(planId)) {
      return res.status(400).json({ error: `Invalid planId. Must be one of: ${validPlans.join(', ')}` });
    }

    // Get current subscription for the target org
    const currentSubscription = await prisma.subscriptions.findUnique({
      where: { organizationId: orgId },
      include: {
        plan: true,
        organization: { select: { title: true } }
      }
    });

    if (!currentSubscription) {
      return res.status(404).json({ error: 'No subscription found for this organization' });
    }

    if (!currentSubscription.stripeSubscriptionId) {
      return res.status(400).json({
        error: 'No active Stripe subscription found. The organization must subscribe first.'
      });
    }

    // Get the target plan from database
    const targetPlan = await prisma.subscription_plans.findFirst({
      where: { planId }
    });

    if (!targetPlan) {
      return res.status(404).json({ error: `Plan '${planId}' not found` });
    }

    if (!targetPlan.isActive) {
      return res.status(400).json({ error: 'This plan is not currently available' });
    }

    const stripe = getStripe();

    // Determine the billing interval
    let billingInterval = interval;
    if (!billingInterval) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(currentSubscription.stripeSubscriptionId);
        const currentInterval = stripeSubscription.items.data[0]?.price?.recurring?.interval;
        billingInterval = currentInterval === 'year' ? 'annual' : 'monthly';
      } catch {
        billingInterval = 'monthly';
      }
    }

    // Get the new Stripe Price ID
    const newPriceId = await getPriceIdForPlan(planId, billingInterval);
    if (!newPriceId) {
      return res.status(400).json({
        error: `No Stripe price configured for plan: ${planId} (${billingInterval})`
      });
    }

    try {
      // Get the current Stripe subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(currentSubscription.stripeSubscriptionId);

      if (!stripeSubscription || stripeSubscription.status === 'canceled') {
        return res.status(400).json({
          error: 'Subscription is no longer active in Stripe.'
        });
      }

      // Check if already on this price
      const currentPriceId = stripeSubscription.items.data[0]?.price?.id;
      if (currentPriceId === newPriceId) {
        return res.status(400).json({
          error: `Organization is already on the ${targetPlan.name} plan with this billing interval.`
        });
      }

      const subscriptionItemId = stripeSubscription.items.data[0]?.id;
      if (!subscriptionItemId) {
        return res.status(400).json({ error: 'Could not find subscription item to update.' });
      }

      // Determine upgrade vs downgrade
      const planOrder = { essential: 1, professional: 2, enterprise: 3 };
      const currentPlanId = currentSubscription.plan?.planId || 'essential';
      const isUpgrade = planOrder[planId] > (planOrder[currentPlanId] || 0);

      // Update the Stripe subscription
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

      // Handle period dates
      const now = new Date();
      const currentPeriodStart = updatedSubscription.current_period_start
        ? new Date(updatedSubscription.current_period_start * 1000)
        : currentSubscription.currentPeriodStart || now;
      const currentPeriodEnd = updatedSubscription.current_period_end
        ? new Date(updatedSubscription.current_period_end * 1000)
        : currentSubscription.currentPeriodEnd || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Update database
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
          reason: `Platform owner ${isUpgrade ? 'upgraded' : 'downgraded'} to ${targetPlan.name} (${billingInterval})`,
          changedBy: userId,
          changedByRole: 'owner',
          metadata: {
            newPriceId,
            interval: billingInterval
          }
        }
      });

      // Invalidate cache
      invalidateSubscriptionCache(orgId);

      const orgTitle = currentSubscription.organization?.title || orgId;

      return res.status(200).json({
        success: true,
        message: `Successfully ${isUpgrade ? 'upgraded' : 'changed'} "${orgTitle}" to ${targetPlan.name}`,
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
      console.error('Error changing plan (internal):', err);

      if (err.type === 'StripeCardError') {
        return res.status(400).json({
          error: 'Payment failed for this organization. Their payment method may need updating.'
        });
      }

      return res.status(500).json({
        error: 'Failed to change plan. Please try again or check Stripe dashboard.'
      });
    }
  }
});
