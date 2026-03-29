/**
 * GET /api/ai/smartpulse-usage
 *
 * Returns the current user's SmartPulse usage for today.
 */

import { WorkOS } from '@workos-inc/node';
import { getOrgSubscription, getResourceUsage } from '../../../lib/features/subscriptionService';
import { RESOURCES, hasResourceCapacity } from '../../../lib/features/featureAccess';
import { getOrgIdFromUser } from '../../../lib/usage/usageLogger';
import { createHandler } from '../../../lib/api/createHandler';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const userId = req.cookies.workos_user_id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const organizationId = await getOrgIdFromUser(userId);
    if (!organizationId) {
      return res.status(200).json({ smartPulse: null });
    }

    const [subscription, usage] = await Promise.all([
      getOrgSubscription(organizationId),
      getResourceUsage(organizationId)
    ]);

    if (!subscription) {
      return res.status(200).json({ smartPulse: null });
    }

    const capacity = hasResourceCapacity({
      subscription,
      resource: RESOURCES.SMART_PULSE_PER_DAY,
      currentUsage: usage[RESOURCES.SMART_PULSE_PER_DAY] || 0
    });

    return res.status(200).json({
      smartPulse: {
        used: capacity.current,
        limit: capacity.limit,
        remaining: capacity.available
      }
    });
  }
});
