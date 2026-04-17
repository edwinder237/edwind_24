import { createHandler } from '../../../../lib/api/createHandler';
import { exchangeCodeForTokens } from '../../../../lib/calendar/microsoftCalendarService';
import { storeIntegration } from '../../../../lib/calendar/calendarSyncService';
import { decrypt } from '../../../../lib/calendar/encryption';

export default createHandler({
  scope: 'public',
  GET: async (req, res) => {
    const { code, state, error: oauthError, error_description } = req.query;

    if (oauthError) {
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

      const returnUrl = stateData.returnUrl || '/apps/profiles/user/integrations';
      res.redirect(`${returnUrl}?success=microsoft_connected`);
    } catch (error) {
      console.error('[MICROSOFT_CALENDAR] Callback error:', error.message);
      res.redirect('/apps/profiles/user/integrations?error=microsoft_failed');
    }
  }
});
