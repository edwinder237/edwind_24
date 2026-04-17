/**
 * PUT /api/internal/organizations/[id]/status
 *
 * Toggle organization active/inactive status (Owner only).
 * Deactivation cascades to: DB users, WorkOS sessions, Stripe subscription.
 * Reactivation restores org status but does NOT auto-reactivate users.
 */

import { createHandler } from '../../../../../lib/api/createHandler';
import prisma from '../../../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';
import { cancelSubscription as cancelStripeSubscription } from '../../../../../lib/stripe/stripeService';
import { invalidateSubscriptionCache } from '../../../../../lib/features/subscriptionService';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

/**
 * Revoke all WorkOS sessions for a user (non-blocking on failure)
 */
async function revokeUserSessions(workosUserId) {
  if (!workosUserId) return;

  try {
    if (typeof workos.userManagement.listSessions !== 'function') return;

    const sessionsResponse = await workos.userManagement.listSessions({
      userId: workosUserId
    });

    const sessions = sessionsResponse.data || [];
    for (const session of sessions) {
      try {
        await workos.userManagement.revokeSession(session.id);
      } catch (revokeError) {
        console.error(`   Failed to revoke session ${session.id}:`, revokeError.message);
      }
    }
  } catch (error) {
    console.error('Error revoking user sessions:', error.message);
  }
}

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
      select: { workos_role: true, organizationId: true }
    });

    if (!membership || membership.workos_role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    const { id: orgId } = req.query;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive (boolean) is required' });
    }

    // Fetch the org
    const org = await prisma.organizations.findUnique({
      where: { id: orgId },
      include: {
        subscription: {
          select: { id: true, stripeSubscriptionId: true, status: true }
        }
      }
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Prevent owner from deactivating their own org
    if (!isActive && membership.organizationId === orgId) {
      return res.status(400).json({ error: 'Cannot deactivate your own organization' });
    }

    // ── DEACTIVATE ──
    if (!isActive) {
      // 1. Find all users in this org
      const orgMemberships = await prisma.organization_memberships.findMany({
        where: { organizationId: orgId },
        select: {
          userId: true,
          user: { select: { id: true, workos_user_id: true, isActive: true } }
        }
      });

      // 2. Batch deactivate all active users
      const activeUsers = orgMemberships.filter(m => m.user?.isActive === true);
      const activeUserDbIds = activeUsers
        .map(m => m.user?.id)
        .filter(Boolean);

      if (activeUserDbIds.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: activeUserDbIds } },
          data: { isActive: false }
        });
      }

      // 3. Revoke all WorkOS sessions
      for (const m of orgMemberships) {
        if (m.user?.workos_user_id) {
          await revokeUserSessions(m.user.workos_user_id);
        }
      }

      // 4. Cancel Stripe subscription immediately
      let subscriptionCanceled = false;
      if (org.subscription?.stripeSubscriptionId && org.subscription.status !== 'canceled') {
        try {
          await cancelStripeSubscription({
            stripeSubscriptionId: org.subscription.stripeSubscriptionId,
            immediately: true
          });

          await prisma.subscriptions.update({
            where: { organizationId: orgId },
            data: {
              status: 'canceled',
              canceledAt: new Date(),
              history: {
                create: {
                  eventType: 'canceled',
                  fromStatus: org.subscription.status,
                  toStatus: 'canceled',
                  reason: 'Organization deactivated by platform owner',
                  changedBy: userId,
                  changedByRole: 'owner'
                }
              }
            }
          });

          subscriptionCanceled = true;
        } catch (stripeError) {
          console.error('⚠️ Failed to cancel Stripe subscription:', stripeError.message);
        }
      }

      // 5. Update org status + metadata
      await prisma.organizations.update({
        where: { id: orgId },
        data: {
          status: 'inactive',
          info: {
            ...(org.info || {}),
            deactivatedAt: new Date().toISOString(),
            deactivatedBy: userId,
            deactivatedUserCount: activeUsers.length
          }
        }
      });

      // 6. Invalidate subscription cache
      invalidateSubscriptionCache(orgId);

      return res.status(200).json({
        success: true,
        message: `Organization "${org.title}" deactivated`,
        affectedUsers: activeUsers.length,
        subscriptionCanceled
      });
    }

    // ── REACTIVATE ──
    await prisma.organizations.update({
      where: { id: orgId },
      data: {
        status: 'active',
        info: {
          ...(org.info || {}),
          reactivatedAt: new Date().toISOString(),
          reactivatedBy: userId
        }
      }
    });

    invalidateSubscriptionCache(orgId);

    return res.status(200).json({
      success: true,
      message: `Organization "${org.title}" reactivated. Users remain deactivated and must be reactivated individually.`,
      warning: 'Users have NOT been automatically reactivated. Subscription must be re-established manually.'
    });

  }
});
