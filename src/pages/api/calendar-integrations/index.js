/**
 * GET /api/calendar-integrations
 *
 * Returns the current user's calendar integrations.
 * Never exposes tokens — only metadata.
 */

import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'auth',
  GET: async (req, res) => {
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

      const integrations = await prisma.calendar_integrations.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          provider: true,
          providerEmail: true,
          calendarId: true,
          isActive: true,
          lastSyncAt: true,
          lastSyncError: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      res.status(200).json({ integrations });
    } catch (error) {
      console.error('[CALENDAR_INTEGRATIONS] List error:', error.message);
      res.status(500).json({ error: 'Failed to fetch calendar integrations' });
    }
  }
});
