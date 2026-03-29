/**
 * PUT /api/internal/organizations/[id]/reactivate-subscription
 *
 * Reactivates a canceled/suspended subscription (Owner only).
 * Sets subscription status back to 'active' and records in history.
 */

import { createHandler } from '../../../../../lib/api/createHandler';
import prisma from '../../../../../lib/prisma';
import { invalidateSubscriptionCache } from '../../../../../lib/features/subscriptionService';

export default createHandler({
  scope: 'public',
  PUT: async (req, res) => {
    // Auth: verify owner
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

    // Get current subscription
    const subscription = await prisma.subscriptions.findUnique({
      where: { organizationId: orgId },
      select: {
        id: true,
        status: true,
        planId: true,
        organization: { select: { title: true } }
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found for this organization' });
    }

    if (subscription.status === 'active' || subscription.status === 'trialing') {
      return res.status(400).json({ error: 'Subscription is already active' });
    }

    // Reactivate subscription
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        canceledAt: null,
        cancelAt: null,
        history: {
          create: {
            eventType: 'reactivated',
            fromStatus: subscription.status,
            toStatus: 'active',
            reason: 'Reactivated by platform owner',
            changedBy: userId,
            changedByRole: 'owner'
          }
        }
      }
    });

    invalidateSubscriptionCache(orgId);

    console.log(`✅ Subscription reactivated for org ${orgId} (${subscription.organization?.title})`);

    return res.status(200).json({
      success: true,
      message: `Subscription reactivated for "${subscription.organization?.title}"`
    });

  }
});
