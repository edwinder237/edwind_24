/**
 * ============================================
 * POST /api/subscriptions/cancel
 * ============================================
 *
 * Cancels the organization's subscription at the end of the current billing period.
 * The subscription remains active until the period ends.
 *
 * PROTECTED: Admin-only access via withAdminScope middleware
 */

import { withAdminScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler } from '../../../lib/errors/index.js';
import { getStripe } from '../../../lib/stripe/stripeService.js';
import prisma from '../../../lib/prisma.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;
  const stripe = getStripe();

  // Get subscription from database
  const subscription = await prisma.subscriptions.findUnique({
    where: { organizationId: orgContext.organizationId },
    select: {
      id: true,
      stripeSubscriptionId: true,
      planId: true,
      status: true
    }
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'No subscription found'
    });
  }

  if (!subscription.stripeSubscriptionId) {
    return res.status(400).json({
      success: false,
      message: 'No Stripe subscription associated with this account'
    });
  }

  try {
    // Cancel at period end (not immediately)
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    // Update database
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        cancelAt: stripeSubscription.cancel_at
          ? new Date(stripeSubscription.cancel_at * 1000)
          : null
      }
    });

    // Record in history
    await prisma.subscription_history.create({
      data: {
        subscriptionId: subscription.id,
        eventType: 'cancellation_scheduled',
        fromPlanId: subscription.planId,
        fromStatus: subscription.status,
        toStatus: 'active', // Still active until period end
        reason: 'User requested cancellation',
        changedBy: orgContext.userId,
        changedByRole: 'admin',
        metadata: {
          cancelAt: stripeSubscription.cancel_at
            ? new Date(stripeSubscription.cancel_at * 1000).toISOString()
            : null
        }
      }
    });

    console.log(`💳 [CANCEL] Subscription for org ${orgContext.organizationId} scheduled for cancellation`);

    return res.status(200).json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
      cancelAt: stripeSubscription.cancel_at
        ? new Date(stripeSubscription.cancel_at * 1000)
        : null
    });
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
}

export default withAdminScope(asyncHandler(handler));
