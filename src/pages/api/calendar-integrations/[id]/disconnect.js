/**
 * POST /api/calendar-integrations/[id]/disconnect
 *
 * Disconnects a calendar integration, deactivates it, and cleans up event mappings.
 */

import { createHandler } from '../../../../lib/api/createHandler';
import { disconnectIntegration } from '../../../../lib/calendar/calendarSyncService';
import prisma from '../../../../lib/prisma';

export default createHandler({
  scope: 'auth',
  POST: async (req, res) => {
    const workosUserId = req.orgContext?.userId;
    if (!workosUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const integrationId = parseInt(req.query.id);
    if (isNaN(integrationId)) {
      return res.status(400).json({ error: 'Invalid integration ID' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { workos_user_id: workosUserId },
        select: { id: true },
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await disconnectIntegration(user.id, integrationId);
      res.status(200).json({ success: true, message: 'Calendar integration disconnected' });
    } catch (error) {
      console.error('[CALENDAR_INTEGRATIONS] Disconnect error:', error.message);
      if (error.message === 'Integration not found') {
        return res.status(404).json({ error: 'Integration not found' });
      }
      res.status(500).json({ error: 'Failed to disconnect calendar integration' });
    }
  }
});
