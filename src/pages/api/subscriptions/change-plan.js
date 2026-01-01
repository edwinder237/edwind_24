/**
 * ============================================
 * POST /api/subscriptions/change-plan
 * ============================================
 *
 * Changes the organization's subscription plan.
 * Creates audit history entry for the change.
 *
 * PROTECTED: Admin-only access via withAdminScope middleware
 */

import { withAdminScope } from '../../../lib/middleware/withOrgScope';
import { getOrgSubscription, changePlan } from '../../../lib/features/subscriptionService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Organization context is validated by withAdminScope middleware
  const { organizationId, userId } = req.orgContext;

  const { planId, reason } = req.body;

  if (!planId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'planId is required'
    });
  }

  // Verify the target plan exists
  const targetPlan = await prisma.subscription_plans.findUnique({
    where: { planId }
  });

  if (!targetPlan) {
    return res.status(404).json({
      error: 'Plan not found',
      message: `Subscription plan '${planId}' does not exist`
    });
  }

  if (!targetPlan.isActive || !targetPlan.isPublic) {
    return res.status(400).json({
      error: 'Plan unavailable',
      message: 'This subscription plan is not currently available'
    });
  }

  // Get current subscription
  const currentSubscription = await getOrgSubscription(organizationId);

  if (!currentSubscription) {
    return res.status(404).json({
      error: 'No subscription found',
      message: 'Organization does not have an active subscription'
    });
  }

  // Check if already on this plan
  if (currentSubscription.planId === planId) {
    return res.status(400).json({
      error: 'Same plan',
      message: 'Organization is already on this plan'
    });
  }

  // Determine if this is an upgrade or downgrade
  const planOrder = { free: 0, pro: 1, enterprise: 2 };
  const isDowngrade = planOrder[planId] < planOrder[currentSubscription.planId];

  // Change the plan using the service function (handles history automatically)
  const updatedSubscription = await changePlan({
    subscriptionId: currentSubscription.id,
    newPlanId: planId,
    changedBy: userId,
    reason: reason || (isDowngrade ? `Downgraded to ${targetPlan.name}` : `Upgraded to ${targetPlan.name}`)
  });

  console.log(`✅ Plan changed for org ${organizationId}: ${currentSubscription.planId} → ${planId}`);

  return res.status(200).json({
    success: true,
    message: isDowngrade
      ? `Successfully downgraded to ${updatedSubscription.plan.name}`
      : `Successfully upgraded to ${updatedSubscription.plan.name}`,
    isDowngrade,
    subscription: {
      id: updatedSubscription.id,
      organizationId: updatedSubscription.organizationId,
      planId: updatedSubscription.planId,
      status: updatedSubscription.status,
      currentPeriodStart: updatedSubscription.currentPeriodStart,
      currentPeriodEnd: updatedSubscription.currentPeriodEnd,
      previousPlan: currentSubscription.planId,
      plan: {
        name: updatedSubscription.plan.name,
        description: updatedSubscription.plan.description,
        price: updatedSubscription.plan.price,
        currency: updatedSubscription.plan.currency,
        billingInterval: updatedSubscription.plan.billingInterval,
        features: updatedSubscription.plan.features,
        resourceLimits: updatedSubscription.plan.resourceLimits
      }
    }
  });
}

export default withAdminScope(handler);
