/**
 * ============================================
 * GET /api/subscriptions
 * ============================================
 *
 * Returns the current organization's subscription information
 * including plan details, resource limits, and billing info.
 *
 * PROTECTED: Admin-only access via withAdminScope middleware
 */

import { withAdminScope } from '../../../lib/middleware/withOrgScope';
import { getOrgSubscription, getResourceUsage } from '../../../lib/features/subscriptionService';

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

  if (!subscription) {
    return res.status(404).json({
      error: 'No active subscription found',
      message: 'This organization does not have an active subscription plan.'
    });
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
        price: subscription.plan.price,
        currency: subscription.plan.currency,
        billingInterval: subscription.plan.billingInterval,
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
