/**
 * ============================================
 * POST /api/subscriptions/reactivate
 * ============================================
 *
 * Reactivates a subscription that was scheduled for cancellation.
 * Only works if the subscription hasn't actually been cancelled yet.
 *
 * PROTECTED: Admin-only access via withAdminScope middleware
 */

import { createHandler } from '../../../lib/api/createHandler';
import { getStripe } from '../../../lib/stripe/stripeService.js';
import prisma from '../../../lib/prisma.js';

export default createHandler({
  scope: 'admin',
  skipSubscriptionCheck: true,
  POST: async (req, res) => {
    const { orgContext } = req;
  const stripe = getStripe();

  // Get subscription from database
  const subscription = await prisma.subscriptions.findUnique({
    where: { organizationId: orgContext.organizationId },
    select: {
      id: true,
      stripeSubscriptionId: true,
      planId: true,
      status: true,
      cancelAtPeriodEnd: true
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

  if (!subscription.cancelAtPeriodEnd) {
    return res.status(400).json({
      success: false,
      message: 'Subscription is not scheduled for cancellation'
    });
  }

  try {
    // Reactivate by setting cancel_at_period_end to false
    await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: false }
    );

    // Update database
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
        cancelAt: null
      }
    });

    // Record in history
    await prisma.subscription_history.create({
      data: {
        subscriptionId: subscription.id,
        eventType: 'reactivated',
        fromPlanId: subscription.planId,
        toPlanId: subscription.planId,
        fromStatus: subscription.status,
        toStatus: 'active',
        reason: 'User reactivated subscription',
        changedBy: orgContext.userId,
        changedByRole: 'admin'
      }
    });

    console.log(`💳 [REACTIVATE] Subscription for org ${orgContext.organizationId} reactivated`);

    return res.status(200).json({
      success: true,
      message: 'Subscription reactivated successfully'
    });
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to reactivate subscription'
      });
    }
  }
});
