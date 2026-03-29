import { createHandler } from '../../../../lib/api/createHandler';
import { exchangeCodeForTokens } from '../../../../lib/calendar/googleCalendarService';
import { storeIntegration } from '../../../../lib/calendar/calendarSyncService';
import { decrypt } from '../../../../lib/calendar/encryption';

export default createHandler({
  scope: 'public',
  GET: async (req, res) => {
    const { code, state, error: oauthError } = req.query;

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

    if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
      return res.redirect('/apps/profiles/user/integrations?error=expired_state');
    }

    try {
      const tokens = await exchangeCodeForTokens(code);
      await storeIntegration(stateData.userId, 'google', tokens);

      console.log(`[GOOGLE_CALENDAR] Connected for user ${stateData.userId} (${tokens.email})`);

      const returnUrl = stateData.returnUrl || '/apps/profiles/user/integrations';
      res.redirect(`${returnUrl}?success=google_connected`);
    } catch (error) {
      console.error('[GOOGLE_CALENDAR] Callback error:', error.message);
      res.redirect('/apps/profiles/user/integrations?error=google_failed');
    }
  }
});
