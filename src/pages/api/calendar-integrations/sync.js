/**
 * POST /api/calendar-integrations/sync
 *
 * Triggers a full sync of all events for the current user.
 * Optionally scoped to a specific project.
 */

import { createHandler } from '../../../lib/api/createHandler';
import { syncAllProjectEvents } from '../../../lib/calendar/calendarSyncService';
import prisma from '../../../lib/prisma';

export default createHandler({
  scope: 'auth',
  POST: async (req, res) => {
    const workosUserId = req.orgContext?.userId;
    if (!workosUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { workos_user_id: workosUserId },
        select: { id: true },
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { projectId, syncScope = 'future' } = req.body || {};
      const futureOnly = syncScope !== 'all';

      const result = await syncAllProjectEvents(user.id, projectId, { futureOnly });
      const scopeLabel = futureOnly ? 'upcoming' : '';
      res.status(200).json({
        success: true,
        message: `Synced ${result.synced} ${scopeLabel} events${result.errors > 0 ? ` with ${result.errors} errors` : ''}`.replace('  ', ' '),
        ...result,
      });
    } catch (error) {
      console.error('[CALENDAR_INTEGRATIONS] Sync error:', error.message);
      res.status(500).json({ error: 'Failed to sync calendar events' });
    }
  }
});
