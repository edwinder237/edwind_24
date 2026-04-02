/**
 * GET /api/calendar-integrations/microsoft/connect
 *
 * Initiates Microsoft Calendar OAuth flow.
 * Redirects the browser to Microsoft's consent screen.
 */

import { createHandler } from '../../../../lib/api/createHandler';
import { getAuthUrl } from '../../../../lib/calendar/microsoftCalendarService';
import { encrypt } from '../../../../lib/calendar/encryption';
import prisma from '../../../../lib/prisma';

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

      const statePayload = JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
        returnUrl: req.query.returnUrl || '/apps/profiles/user/integrations',
      });
      const state = encrypt(statePayload);

      const authUrl = await getAuthUrl(state);
      res.redirect(authUrl);
    } catch (error) {
      console.error('[MICROSOFT_CALENDAR] Connect error:', error.message);
      res.status(500).json({ error: 'Failed to initiate Microsoft Calendar connection' });
    }
  }
});
