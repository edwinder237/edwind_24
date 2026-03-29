/**
 * POST /api/calendar-integrations/[id]/disconnect
 *
 * Disconnects a calendar integration, deactivates it, and cleans up event mappings.
 */

import { createHandler } from '../../../../lib/api/createHandler';
import { disconnectIntegration } from '../../../../lib/calendar/calendarSyncService';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const userId = req.userClaims?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const integrationId = parseInt(req.query.id);
    if (isNaN(integrationId)) {
      return res.status(400).json({ error: 'Invalid integration ID' });
    }

    try {
      await disconnectIntegration(userId, integrationId);
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
