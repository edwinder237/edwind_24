/**
 * GET /api/calendar-integrations/microsoft/callback
 *
 * Handles the OAuth callback from Microsoft.
 * Exchanges the code for tokens, stores them encrypted, and redirects back.
 */

import { exchangeCodeForTokens } from '../../../../lib/calendar/microsoftCalendarService';
import { storeIntegration } from '../../../../lib/calendar/calendarSyncService';
import { decrypt } from '../../../../lib/calendar/encryption';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error: oauthError, error_description } = req.query;

  if (oauthError) {
    console.log('[MICROSOFT_CALENDAR] OAuth denied:', oauthError, error_description);
    return res.redirect('/apps/profiles/user/integrations?error=microsoft_denied');
  }

  if (!code || !state) {
    return res.redirect('/apps/profiles/user/integrations?error=missing_params');
  }

  let stateData;
  try {
    stateData = JSON.parse(decrypt(state));
  } catch {
    return res.redirect('/apps/profiles/user/integrations?error=invalid_state');
  }

  if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
    return res.redirect('/apps/profiles/user/integrations?error=expired_state');
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    await storeIntegration(stateData.userId, 'microsoft', {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      email: tokens.email,
    });

    console.log(`[MICROSOFT_CALENDAR] Connected for user ${stateData.userId} (${tokens.email})`);

    const returnUrl = stateData.returnUrl || '/apps/profiles/user/integrations';
    res.redirect(`${returnUrl}?success=microsoft_connected`);
  } catch (error) {
    console.error('[MICROSOFT_CALENDAR] Callback error:', error.message);
    res.redirect('/apps/profiles/user/integrations?error=microsoft_failed');
  }
}
