/**
 * GET /api/calendar-integrations/google/connect
 *
 * Initiates Google Calendar OAuth flow.
 * Redirects the browser to Google's consent screen.
 */

import { createHandler } from '../../../../lib/api/createHandler';
import { getAuthUrl } from '../../../../lib/calendar/googleCalendarService';
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
      // Resolve WorkOS user ID to database User ID
      const user = await prisma.user.findUnique({
        where: { workos_user_id: workosUserId },
        select: { id: true },
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Encode user ID and a timestamp in the state parameter for CSRF protection
      const statePayload = JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
        returnUrl: req.query.returnUrl || '/apps/profiles/user/integrations',
      });
      const state = encrypt(statePayload);

      const authUrl = getAuthUrl(state);
      res.redirect(authUrl);
    } catch (error) {
      console.error('[GOOGLE_CALENDAR] Connect error:', error.message);
      res.status(500).json({ error: 'Failed to initiate Google Calendar connection' });
    }
  }
});
