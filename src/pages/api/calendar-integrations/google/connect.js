/**
 * GET /api/calendar-integrations/google/connect
 *
 * Initiates Google Calendar OAuth flow.
 * Redirects the browser to Google's consent screen.
 */

import { createHandler } from '../../../../lib/api/createHandler';
import { getAuthUrl } from '../../../../lib/calendar/googleCalendarService';
import { encrypt } from '../../../../lib/calendar/encryption';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const userId = req.userClaims?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Encode user ID and a timestamp in the state parameter for CSRF protection
      const statePayload = JSON.stringify({
        userId,
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
