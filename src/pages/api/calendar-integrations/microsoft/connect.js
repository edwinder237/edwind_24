/**
 * GET /api/calendar-integrations/microsoft/connect
 *
 * Initiates Microsoft Calendar OAuth flow.
 * Redirects the browser to Microsoft's consent screen.
 */

import { attachUserClaims } from '../../../../lib/auth/middleware';
import { getAuthUrl } from '../../../../lib/calendar/microsoftCalendarService';
import { encrypt } from '../../../../lib/calendar/encryption';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await attachUserClaims(req, res);

  const userId = req.userClaims?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const statePayload = JSON.stringify({
      userId,
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
