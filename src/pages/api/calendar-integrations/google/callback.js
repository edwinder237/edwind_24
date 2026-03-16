/**
 * GET /api/calendar-integrations/google/callback
 *
 * Handles the OAuth callback from Google.
 * Exchanges the code for tokens, stores them encrypted, and redirects back.
 */

import { exchangeCodeForTokens } from '../../../../lib/calendar/googleCalendarService';
import { storeIntegration } from '../../../../lib/calendar/calendarSyncService';
import { decrypt } from '../../../../lib/calendar/encryption';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error: oauthError } = req.query;

  // Handle user denying consent
  if (oauthError) {
    console.log('[GOOGLE_CALENDAR] OAuth denied:', oauthError);
    return res.redirect('/apps/profiles/user/integrations?error=google_denied');
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

  // Verify state freshness (15 minute window)
  if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
    return res.redirect('/apps/profiles/user/integrations?error=expired_state');
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Store encrypted tokens
    await storeIntegration(stateData.userId, 'google', tokens);

    console.log(`[GOOGLE_CALENDAR] Connected for user ${stateData.userId} (${tokens.email})`);

    const returnUrl = stateData.returnUrl || '/apps/profiles/user/integrations';
    res.redirect(`${returnUrl}?success=google_connected`);
  } catch (error) {
    console.error('[GOOGLE_CALENDAR] Callback error:', error.message);
    res.redirect('/apps/profiles/user/integrations?error=google_failed');
  }
}
