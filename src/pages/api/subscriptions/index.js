/**
 * ============================================
 * GET /api/subscriptions
 * ============================================
 *
 * Returns the current organization's subscription information
 * including plan details, resource limits, and billing info.
 */

import { WorkOS } from '@workos-inc/node';
import { getClaimsFromRequest } from '../../../lib/auth/claimsManager';
import { getOrgSubscription } from '../../../lib/features/subscriptionService';
import { PrismaClient } from '@prisma/client';

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user claims from JWT
    const claims = await getClaimsFromRequest(req, workos);

    if (!claims || !claims.organizations || claims.organizations.length === 0) {
      return res.status(401).json({ error: 'Unauthorized - No organization found' });
    }

    // Get the first organization's workos_org_id
    const workosOrgId = claims.organizations[0].workos_org_id;

    // Get the organization from database
    const organization = await prisma.organizations.findUnique({
      where: { workos_org_id: workosOrgId },
      select: {
        id: true,
        title: true,
        workos_org_id: true
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get subscription with plan details
    const subscription = await getOrgSubscription(organization.id);

    if (!subscription) {
      return res.status(404).json({
        error: 'No active subscription found',
        message: 'This organization does not have an active subscription plan.'
      });
    }

    // Return subscription data
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
          resourceLimits: subscription.plan.resourceLimits
        },
        customFeatures: subscription.customFeatures,
        customLimits: subscription.customLimits
      }
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return res.status(500).json({
      error: 'Failed to fetch subscription',
      message: error.message
    });
  }
}
